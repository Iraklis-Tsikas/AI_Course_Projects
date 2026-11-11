/**
 * Digital Twin API — keeps the Gemini key on the server and streams replies to the site.
 *
 *   node server/main.ts            API only (dev: Angular proxies /api here)
 *   node server/main.ts --static   API + the production build in dist/ (one process, one port)
 *
 * Config comes from .env in the project root: GEMINI_API_KEY, GEMINI_MODEL, TWIN_PORT.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GeminiError, streamGemini, type ChatTurn } from './gemini.ts';
import { buildSystemPrompt } from './persona.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

try {
  process.loadEnvFile(join(ROOT, '.env'));
} catch {
  /* no .env — fall back to the real environment */
}

const API_KEY = process.env['GEMINI_API_KEY']?.trim() ?? '';
const MODEL = process.env['GEMINI_MODEL']?.trim() || 'gemini-2.5-flash';
const BASE_URL = (
  process.env['GEMINI_BASE_URL'] ?? 'https://generativelanguage.googleapis.com'
).replace(/\/$/, '');
const SERVE_STATIC = process.argv.includes('--static');
// PORT is what hosting platforms set for the whole site; in dev it belongs to `ng serve`, so the
// API-only process listens on TWIN_PORT (which the Angular proxy points at).
const PORT = Number(
  (SERVE_STATIC ? process.env['PORT'] : undefined) ?? process.env['TWIN_PORT'] ?? 4300,
);
const STATIC_DIR = join(ROOT, 'dist/iraklis-tsikas/browser');

const PLACEHOLDER = /your[-_ ]?(gemini[-_ ]?)?api[-_ ]?key|paste|^x+$|changeme/i;
const configured = API_KEY.length > 0 && !PLACEHOLDER.test(API_KEY);

const LIMITS = {
  bodyBytes: 32_000,
  turns: 20,
  charsPerTurn: 1_500,
  totalChars: 16_000,
  perClient: { max: 20, windowMs: 10 * 60_000 },
  global: { max: 12, windowMs: 60_000 }, // stay under the Gemini free-tier RPM
  timeoutMs: 45_000,
};

// --- rate limiting -------------------------------------------------------------------------

const hits = new Map<string, number[]>();

function allow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

function clientId(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return first || req.socket.remoteAddress || 'unknown';
}

// --- helpers ---------------------------------------------------------------------------------

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

function fail(res: ServerResponse, status: number, code: string, message: string): void {
  sendJson(res, status, { error: { code, message } });
}

async function readBody(req: IncomingMessage): Promise<string> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > LIMITS.bodyBytes) throw new Error('too_large');
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function parseTurns(raw: string): ChatTurn[] | string {
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return 'Body must be JSON.';
  }
  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages) || messages.length === 0)
    return 'messages must be a non-empty array.';

  const turns: ChatTurn[] = [];
  for (const m of messages.slice(-LIMITS.turns)) {
    const role = (m as ChatTurn)?.role;
    const text = (m as ChatTurn)?.text;
    if ((role !== 'user' && role !== 'model') || typeof text !== 'string')
      return 'Invalid message.';
    const trimmed = text.trim().slice(0, LIMITS.charsPerTurn);
    if (trimmed) turns.push({ role, text: trimmed });
  }
  // Keep the most recent turns within budget. Gemini expects the conversation to open with the
  // user and end on their turn.
  let total = turns.reduce((n, t) => n + t.text.length, 0);
  while (turns.length > 1 && total > LIMITS.totalChars) total -= turns.shift()!.text.length;
  while (turns.length && turns[0]!.role !== 'user') turns.shift();
  if (!turns.length || turns.at(-1)!.role !== 'user')
    return 'The last message must be from the user.';
  return turns;
}

const FRIENDLY: Record<string, string> = {
  bad_key: "The twin isn't connected to its AI model — the Gemini API key is missing or invalid.",
  bad_model: `The configured model (${MODEL}) isn't available for this API key.`,
  quota: 'My free AI quota is used up for the moment. Try again in a minute — or just email me.',
  blocked: "I can't help with that one. Ask me something about my career instead?",
  upstream: 'The AI service had a hiccup. Please try again.',
  timeout: 'That took too long to answer. Please try again.',
};

// --- routes ----------------------------------------------------------------------------------

async function handleChat(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!configured) {
    return fail(res, 503, 'not_configured', FRIENDLY['bad_key']!);
  }
  if (!allow(`c:${clientId(req)}`, LIMITS.perClient.max, LIMITS.perClient.windowMs)) {
    return fail(
      res,
      429,
      'rate_limited',
      "You're asking faster than I can think — give it a minute and try again.",
    );
  }
  if (!allow('global', LIMITS.global.max, LIMITS.global.windowMs)) {
    return fail(res, 429, 'busy', 'Lots of people are chatting right now — try again in a minute.');
  }

  let raw: string;
  try {
    raw = await readBody(req);
  } catch {
    return fail(res, 413, 'too_large', 'Message too long.');
  }
  const turns = parseTurns(raw);
  if (typeof turns === 'string') return fail(res, 400, 'bad_request', turns);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('timeout')), LIMITS.timeoutMs);
  res.on('close', () => controller.abort(new Error('client_closed')));

  let started = false;
  const send = (event: string, data: unknown) => {
    if (!started) {
      started = true;
      res.writeHead(200, {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache, no-transform',
        connection: 'keep-alive',
        'x-accel-buffering': 'no',
      });
    }
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    for await (const text of streamGemini(turns, {
      apiKey: API_KEY,
      model: MODEL,
      baseUrl: BASE_URL,
      systemPrompt: buildSystemPrompt(),
      signal: controller.signal,
    })) {
      send('delta', { text });
    }
    send('done', {});
    res.end();
  } catch (err) {
    if (controller.signal.aborted && controller.signal.reason?.message === 'client_closed') return;
    const isTimeout = controller.signal.aborted;
    const code = isTimeout ? 'timeout' : err instanceof GeminiError ? err.code : 'upstream';
    const status = isTimeout ? 504 : err instanceof GeminiError ? err.status : 502;
    console.error(`[twin] ${code}: ${err instanceof Error ? err.message : String(err)}`);
    const message = FRIENDLY[code] ?? FRIENDLY['upstream']!;
    if (started) {
      send('error', { code, message });
      res.end();
    } else {
      fail(res, status >= 400 && status < 600 ? status : 502, code, message);
    }
  } finally {
    clearTimeout(timeout);
  }
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
};

async function serveStatic(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
): Promise<void> {
  const root = resolve(STATIC_DIR);
  let file = resolve(root, normalize(`.${decodeURIComponent(pathname)}`));
  if (!file.startsWith(root)) return fail(res, 403, 'forbidden', 'Forbidden');

  const isFile = await stat(file).then(
    (s) => s.isFile(),
    () => false,
  );
  if (!isFile) {
    // SPA fallback for client-side routes; real missing assets stay 404.
    if (extname(pathname)) return fail(res, 404, 'not_found', 'Not found');
    file = join(root, 'index.html');
  }
  const body = await readFile(file);
  const hashed = /-[A-Z0-9]{8}\.(js|css)$/.test(file);
  res.writeHead(200, {
    'content-type': MIME[extname(file)] ?? 'application/octet-stream',
    'cache-control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache',
    'x-content-type-options': 'nosniff',
  });
  res.end(req.method === 'HEAD' ? undefined : body);
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  try {
    if (pathname === '/api/twin/health' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, configured, model: MODEL });
    }
    if (pathname === '/api/twin/chat') {
      if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed', 'Use POST.');
      return await handleChat(req, res);
    }
    if (pathname.startsWith('/api/')) return fail(res, 404, 'not_found', 'Not found');
    if (SERVE_STATIC && (req.method === 'GET' || req.method === 'HEAD')) {
      return await serveStatic(req, res, pathname);
    }
    fail(res, 404, 'not_found', 'Not found');
  } catch (err) {
    console.error('[twin] unhandled', err);
    if (!res.headersSent) fail(res, 500, 'server_error', 'Something went wrong.');
    else res.end();
  }
});

server.listen(PORT, () => {
  const where = SERVE_STATIC
    ? `site + API on http://localhost:${PORT}`
    : `API on http://localhost:${PORT}`;
  console.log(
    `[twin] ${where} · model ${MODEL} · ${configured ? 'key loaded' : 'NO API KEY — set GEMINI_API_KEY in .env'}`,
  );
});
