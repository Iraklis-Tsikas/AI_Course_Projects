export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export interface GeminiOptions {
  apiKey: string;
  model: string;
  baseUrl: string;
  systemPrompt: string;
  signal: AbortSignal;
}

export type GeminiErrorCode = 'bad_key' | 'bad_model' | 'quota' | 'blocked' | 'upstream';

export class GeminiError extends Error {
  readonly code: GeminiErrorCode;
  readonly status: number;

  constructor(code: GeminiErrorCode, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

interface GeminiChunk {
  candidates?: {
    content?: { parts?: { text?: string; thought?: boolean }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
}

/**
 * Streams a reply from the Gemini REST API (streamGenerateContent + SSE), yielding text deltas.
 * Docs: https://ai.google.dev/api/generate-content
 */
export async function* streamGemini(
  turns: ChatTurn[],
  opts: GeminiOptions,
): AsyncGenerator<string> {
  const url = `${opts.baseUrl}/v1beta/models/${encodeURIComponent(opts.model)}:streamGenerateContent?alt=sse`;

  const generationConfig: Record<string, unknown> = { temperature: 0.6, maxOutputTokens: 800 };
  // 2.5 Flash "thinks" by default; a chat about a CV doesn't need it, and skipping it is faster and
  // cheaper on the free tier.
  if (/^gemini-2\.5-flash/.test(opts.model)) {
    generationConfig['thinkingConfig'] = { thinkingBudget: 0 };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': opts.apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.systemPrompt }] },
      contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
      generationConfig,
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) throw await toGeminiError(res);

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      let boundary: number;
      while ((boundary = buffer.search(/\r?\n\r?\n/)) >= 0) {
        const event = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary).replace(/^\r?\n\r?\n/, '');
        const data = event
          .split(/\r?\n/)
          .filter((l) => l.startsWith('data:'))
          .map((l) => l.slice(5).trim())
          .join('');
        if (!data) continue;
        const chunk = JSON.parse(data) as GeminiChunk;
        if (chunk.promptFeedback?.blockReason) {
          throw new GeminiError(
            'blocked',
            400,
            `Prompt blocked: ${chunk.promptFeedback.blockReason}`,
          );
        }
        const candidate = chunk.candidates?.[0];
        for (const part of candidate?.content?.parts ?? []) {
          if (part.text && !part.thought) yield part.text;
        }
        if (
          candidate?.finishReason === 'SAFETY' ||
          candidate?.finishReason === 'PROHIBITED_CONTENT'
        ) {
          throw new GeminiError('blocked', 400, `Response blocked: ${candidate.finishReason}`);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function toGeminiError(res: Response): Promise<GeminiError> {
  let detail = '';
  let reason = '';
  try {
    const body = (await res.json()) as {
      error?: { message?: string; status?: string; details?: { reason?: string }[] };
    };
    detail = body.error?.message ?? '';
    reason = body.error?.details?.find((d) => d.reason)?.reason ?? body.error?.status ?? '';
  } catch {
    /* non-JSON error body */
  }
  const message = `Gemini ${res.status} ${reason}: ${detail}`.trim();
  if (reason === 'API_KEY_INVALID' || res.status === 401 || res.status === 403) {
    return new GeminiError('bad_key', res.status, message);
  }
  if (res.status === 404) return new GeminiError('bad_model', res.status, message);
  if (res.status === 429) return new GeminiError('quota', res.status, message);
  return new GeminiError('upstream', res.status, message);
}
