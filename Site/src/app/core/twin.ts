import { Injectable, computed, effect, signal } from '@angular/core';

export interface TwinMessage {
  id: number;
  role: 'user' | 'model';
  text: string;
  time: string;
  streaming?: boolean;
  error?: string;
}

type Availability = 'unknown' | 'online' | 'unconfigured' | 'unreachable';

const STORAGE_KEY = 'it-twin-chat';
const API = '/api/twin';

const ERRORS = {
  network: "I can't reach my server right now. Please try again in a moment.",
  generic: 'Something went wrong. Please try again.',
} as const;

function now(): string {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(),
  );
}

function restore(): TwinMessage[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]') as TwinMessage[];
    return Array.isArray(saved) ? saved.filter((m) => m.text || m.error) : [];
  } catch {
    return [];
  }
}

/** State + streaming transport for the AI Digital Twin chat. The Gemini key never reaches the browser. */
@Injectable({ providedIn: 'root' })
export class TwinService {
  readonly isOpen = signal(false);
  readonly messages = signal<TwinMessage[]>(restore());
  readonly busy = signal(false);
  readonly availability = signal<Availability>('unknown');
  readonly model = signal<string | null>(null);
  readonly hasConversation = computed(() => this.messages().length > 0);

  private controller?: AbortController;
  private nextId = Math.max(0, ...this.messages().map((m) => m.id)) + 1;

  constructor() {
    effect(() => {
      const settled = this.messages()
        .filter((m) => !m.streaming)
        .map(({ streaming: _s, ...m }) => m);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settled));
      } catch {
        /* storage unavailable — the chat just won't survive a reload */
      }
    });
  }

  open(): void {
    this.isOpen.set(true);
    if (this.availability() !== 'online') void this.checkHealth();
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    if (this.isOpen()) this.close();
    else this.open();
  }

  /** Open the panel and immediately ask a question (used by suggestion chips and other CTAs). */
  ask(question: string): void {
    this.open();
    void this.send(question);
  }

  async checkHealth(): Promise<void> {
    try {
      const res = await fetch(`${API}/health`, { cache: 'no-store' });
      const body = (await res.json()) as { configured?: boolean; model?: string };
      this.model.set(body.model ?? null);
      this.availability.set(res.ok && body.configured ? 'online' : 'unconfigured');
    } catch {
      this.availability.set('unreachable');
    }
  }

  async send(text: string): Promise<void> {
    const question = text.trim();
    if (!question || this.busy()) return;

    const history = this.messages()
      .filter((m) => !m.error && m.text)
      .map(({ role, text }) => ({ role, text }));

    const reply: TwinMessage = {
      id: this.nextId++,
      role: 'model',
      text: '',
      time: now(),
      streaming: true,
    };
    this.messages.update((list) => [
      ...list,
      { id: this.nextId++, role: 'user', text: question, time: now() },
      reply,
    ]);
    await this.stream([...history, { role: 'user', text: question }], reply.id);
  }

  /** Re-ask the last question after an error. */
  retry(): void {
    const list = this.messages();
    const failed = list.at(-1);
    const question = list.at(-2);
    if (!failed?.error || question?.role !== 'user') return;
    this.messages.set(list.slice(0, -2));
    void this.send(question.text);
  }

  stop(): void {
    this.controller?.abort();
  }

  reset(): void {
    this.stop();
    this.messages.set([]);
  }

  private patch(id: number, change: Partial<TwinMessage>): void {
    this.messages.update((list) => list.map((m) => (m.id === id ? { ...m, ...change } : m)));
  }

  private async stream(turns: { role: string; text: string }[], id: number): Promise<void> {
    this.busy.set(true);
    const controller = (this.controller = new AbortController());

    // Text arrives in bursts; reveal it a few characters per tick so it reads like typing.
    // A timer (not rAF) keeps it moving in background tabs, where it simply catches up at once.
    let received = '';
    let shown = 0;
    let finished = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const settle = new Promise<void>((resolve) => {
      const tick = () => {
        const backlog = received.length - shown;
        if (backlog > 0) {
          const instant = reduce || document.hidden;
          shown = instant ? received.length : shown + Math.max(2, Math.ceil(backlog / 10));
          this.patch(id, { text: received.slice(0, shown) });
        }
        if (finished && shown >= received.length) resolve();
        else timer = setTimeout(tick, 16);
      };
      tick();
    });

    let error: string | undefined;
    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: turns }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => null)) as {
          error?: { code?: string; message?: string };
        } | null;
        if (body?.error?.code === 'not_configured') this.availability.set('unconfigured');
        else if (!body) this.availability.set('unreachable');
        // No JSON body means the twin server itself is unreachable (e.g. the dev proxy's 502/504).
        throw new Error(
          body?.error?.message ?? (res.status >= 500 ? ERRORS.network : ERRORS.generic),
        );
      }
      this.availability.set('online');

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        let boundary: number;
        while ((boundary = buffer.indexOf('\n\n')) >= 0) {
          const raw = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const event = /^event: (.+)$/m.exec(raw)?.[1];
          const data = JSON.parse(/^data: (.*)$/m.exec(raw)?.[1] ?? '{}') as {
            text?: string;
            message?: string;
          };
          if (event === 'delta' && data.text) received += data.text;
          if (event === 'error') throw new Error(data.message ?? ERRORS.generic);
        }
      }
      if (!received.trim()) throw new Error(ERRORS.generic);
    } catch (err) {
      if (controller.signal.aborted) {
        if (!received) error = 'Stopped.';
      } else {
        error =
          err instanceof TypeError ? ERRORS.network : (err as Error).message || ERRORS.generic;
      }
    } finally {
      finished = true;
      await settle;
      clearTimeout(timer);
      this.patch(id, { text: received, streaming: false, error });
      this.busy.set(false);
      if (this.controller === controller) this.controller = undefined;
    }
  }
}
