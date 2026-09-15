export type ProviderKind = 'openai' | 'anthropic' | 'ollama' | 'huggingface';
export type ImageType = 'image/png' | 'image/jpeg' | 'image/webp';
export interface ImageInput {
  base64: string;
  mediaType: ImageType;
}
export interface GenerationInput {
  system: string;
  user: string;
  image?: ImageInput;
}
export interface DraftProvider {
  readonly kind: ProviderKind;
  readonly model: string;
  generate(input: GenerationInput, signal?: AbortSignal): Promise<string>;
}
export interface ProviderOptions {
  kind: ProviderKind;
  model: string;
  apiKey?: string;
  /** API root. HTTPS required except for loopback development servers. */
  baseUrl?: string;
  timeoutMs?: number;
  fetch?: typeof globalThis.fetch;
}

const roots: Record<ProviderKind, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  ollama: 'http://localhost:11434/api',
  huggingface: 'https://router.huggingface.co/v1',
};
export const MAX_TEXT = 128_000;
const MAX_RESPONSE = 256_000;

export function boundedText(value: string, label: string, max = MAX_TEXT): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    throw new TypeError(`${label} must contain 1–${max} characters.`);
  }
  return value;
}

export function validateImage(image: ImageInput): void {
  if (
    !['image/png', 'image/jpeg', 'image/webp'].includes(image.mediaType) ||
    typeof image.base64 !== 'string' ||
    !image.base64.length ||
    image.base64.length > 8_000_000 ||
    image.base64.length % 4 !== 0 ||
    /[^A-Za-z0-9+/=]/.test(image.base64) ||
    image.base64.slice(0, -2).includes('=') ||
    /=[^=]$/.test(image.base64)
  ) {
    throw new TypeError('Supply PNG, JPEG or WebP bytes as base64 (maximum 6 MB).');
  }
  const prefix = atob(image.base64.slice(0, 32));
  const matches =
    image.mediaType === 'image/png'
      ? prefix.startsWith('\x89PNG\r\n\x1a\n')
      : image.mediaType === 'image/jpeg'
        ? prefix.startsWith('\xff\xd8\xff')
        : prefix.startsWith('RIFF') && prefix.slice(8, 12) === 'WEBP';
  if (!matches) throw new TypeError('Image signature does not match its declared media type.');
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

async function readJson(response: Response): Promise<unknown> {
  if (!response.body) throw new Error('Provider returned an empty response.');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE) throw new Error('Provider response exceeds the size limit.');
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error('Provider returned invalid JSON.');
  }
}

/** Explicit provider selection. No discovery, fallback, URL fetching, logging or retries. */
export function createProvider(options: ProviderOptions): DraftProvider {
  if (!Object.hasOwn(roots, options.kind)) throw new TypeError('Unknown provider.');
  const model = boundedText(options.model, 'Model', 200);
  const root = new URL(options.baseUrl ?? roots[options.kind]);
  if (
    root.username ||
    root.password ||
    root.search ||
    root.hash ||
    !(
      root.protocol === 'https:' ||
      (root.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(root.hostname))
    )
  ) {
    throw new TypeError(
      'Provider URL must use HTTPS or loopback HTTP, without credentials or query.',
    );
  }
  if (options.kind !== 'ollama' && !options.apiKey?.trim())
    throw new TypeError('Provider API key is required.');
  const timeout = options.timeoutMs ?? 30_000;
  if (!Number.isFinite(timeout) || timeout < 1 || timeout > 120_000)
    throw new TypeError('Timeout must be between 1 and 120000 ms.');
  const request = options.fetch ?? globalThis.fetch;
  return {
    kind: options.kind,
    model,
    async generate(input, signal) {
      boundedText(input.system, 'System instructions');
      boundedText(input.user, 'Input');
      if (input.image) validateImage(input.image);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      let body: unknown;
      let endpoint: string;
      if (options.kind === 'anthropic') {
        headers['x-api-key'] = options.apiKey!;
        headers['anthropic-version'] = '2023-06-01';
        endpoint = '/messages';
        body = {
          model,
          max_tokens: 2048,
          system: input.system,
          messages: [
            {
              role: 'user',
              content: [
                ...(input.image
                  ? [
                      {
                        type: 'image',
                        source: {
                          type: 'base64',
                          media_type: input.image.mediaType,
                          data: input.image.base64,
                        },
                      },
                    ]
                  : []),
                { type: 'text', text: input.user },
              ],
            },
          ],
        };
      } else if (options.kind === 'ollama') {
        endpoint = '/chat';
        body = {
          model,
          stream: false,
          options: { num_predict: 2048 },
          messages: [
            { role: 'system', content: input.system },
            {
              role: 'user',
              content: input.user,
              ...(input.image ? { images: [input.image.base64] } : {}),
            },
          ],
        };
      } else {
        headers.Authorization = `Bearer ${options.apiKey}`;
        endpoint = '/chat/completions';
        body = {
          model,
          max_tokens: 2048,
          messages: [
            { role: 'system', content: input.system },
            {
              role: 'user',
              content: input.image
                ? [
                    { type: 'text', text: input.user },
                    {
                      type: 'image_url',
                      image_url: {
                        url: `data:${input.image.mediaType};base64,${input.image.base64}`,
                      },
                    },
                  ]
                : input.user,
            },
          ],
        };
      }
      const controller = new AbortController();
      const cancel = () => controller.abort();
      signal?.addEventListener('abort', cancel, { once: true });
      if (signal?.aborted) cancel();
      const timer = setTimeout(cancel, timeout);
      try {
        if (controller.signal.aborted) throw new Error('Provider request cancelled or timed out.');
        let response: Response;
        try {
          response = await request(root.href.replace(/\/$/, '') + endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            redirect: 'error',
            signal: controller.signal,
          });
        } catch {
          throw new Error(
            controller.signal.aborted
              ? 'Provider request cancelled or timed out.'
              : 'Provider request failed.',
          );
        }
        if (!response.ok) {
          try {
            await response.body?.cancel();
          } catch {
            /* Cleanup errors must not expose provider details. */
          }
          throw new Error(`Provider request failed (HTTP ${response.status}).`);
        }
        let data: Record<string, unknown>;
        try {
          data = record(await readJson(response));
        } catch {
          throw new Error(
            controller.signal.aborted
              ? 'Provider request cancelled or timed out.'
              : 'Provider response was invalid or exceeded the size limit.',
          );
        }
        let text: unknown;
        if (options.kind === 'anthropic') {
          const blocks = Array.isArray(data.content)
            ? data.content.map(record).filter((x) => x.type === 'text')
            : [];
          if (blocks.some((x) => typeof x.text !== 'string'))
            throw new Error('Provider returned no usable draft text.');
          text = blocks.map((x) => x.text).join('\n');
        } else if (options.kind === 'ollama') text = record(data.message).content;
        else
          text = record(
            record(Array.isArray(data.choices) ? data.choices[0] : undefined).message,
          ).content;
        if (typeof text !== 'string' || !text.trim() || text.length > 64_000)
          throw new Error('Provider returned no usable draft text.');
        return text.trim();
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', cancel);
      }
    },
  };
}
