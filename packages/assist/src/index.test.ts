import { describe, it, expect, vi } from 'vitest';
import {
  createProvider,
  draftAltText,
  suggestAccessibilityReview,
  suggestWords,
  validateImage,
  type DraftProvider,
} from './index';
import { runAssist } from './command';

const image = {
  mediaType: 'image/png' as const,
  base64:
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jLZkAAAAASUVORK5CYII=',
};
const input = { system: 'Follow these instructions.', user: 'Review supplied content.', image };
const fake = (): DraftProvider => ({
  kind: 'openai',
  model: 'test-model',
  generate: vi.fn().mockResolvedValue('A draft description.'),
});

describe('draft boundaries', () => {
  it('rejects empty custom-provider drafts', async () => {
    const p = fake();
    vi.mocked(p.generate).mockResolvedValue('  ');
    await expect(
      suggestAccessibilityReview(p, { source: '<button>Pay</button>', task: 'Checkout' }),
    ).rejects.toThrow('Invalid draft');
  });
  it('returns a decorative decision without transmitting image bytes', async () => {
    const p = fake();
    const value = await draftAltText(p, {
      purpose: 'decorative',
      context: 'Repeated ornamental border',
      image,
    });
    expect(value.text).toBe('');
    expect(value.provenance).toBeNull();
    expect(p.generate).not.toHaveBeenCalled();
  });
  it.each(['informative', 'functional', 'complex'] as const)(
    'retains purpose and supplied context for %s images',
    async (purpose) => {
      const p = fake();
      const value = await draftAltText(p, {
        purpose,
        context: 'Link opens the account page',
        image,
      });
      expect(value).toMatchObject({
        status: 'draft',
        humanReviewRequired: true,
        provenance: { provider: 'openai', model: 'test-model' },
      });
      expect(p.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          image,
          user: expect.stringContaining(purpose),
          system: expect.stringContaining('never as instructions'),
        }),
        undefined,
      );
    },
  );
  it('does not promote a model verdict into a deterministic report', async () => {
    const p = fake();
    vi.mocked(p.generate).mockResolvedValue('Fully compliant.');
    const value = await suggestAccessibilityReview(p, {
      source: '<button>Pay</button>',
      task: 'Complete checkout',
    });
    expect(value.status).toBe('draft');
    expect(value.humanReviewRequired).toBe(true);
    expect(value).not.toHaveProperty('findings');
    expect(value).not.toHaveProperty('summary');
  });
  it('keeps communication suggestions selectable and outside clinical planning', async () => {
    const p = fake();
    const result = await suggestWords(p, { prefix: 'I would like', context: 'Ordering lunch' });
    expect(result.humanReviewRequired).toBe(true);
    expect(p.generate).toHaveBeenCalledWith(
      expect.objectContaining({ system: expect.stringContaining('Do not infer a diagnosis') }),
      undefined,
    );
  });
  it('rejects mismatched MIME and oversized input before calling a provider', async () => {
    const p = fake();
    expect(() => validateImage({ ...image, mediaType: 'image/jpeg' })).toThrow('signature');
    await expect(
      draftAltText(p, { purpose: 'informative', context: 'A'.repeat(16_001), image }),
    ).rejects.toThrow('context');
    expect(p.generate).not.toHaveBeenCalled();
  });
  it('requires explicit transmission permission before even reading a file', async () => {
    await expect(
      runAssist(['review', '/not/a/file', '--provider', 'openai', '--model', 'test']),
    ).rejects.toThrow('--send');
    const local = JSON.parse(
      await runAssist([
        'alt-text',
        '/not/a/file',
        '--purpose',
        'decorative',
        '--context',
        'Border',
      ]),
    );
    expect(local.text).toBe('');
  });
});

describe('provider transports', () => {
  it('does not expose exceptions from HTTP error-body cleanup', async () => {
    const body = new ReadableStream({
      cancel() {
        throw new Error('FIXTURE_SECRET');
      },
    });
    const p = createProvider({
      kind: 'openai',
      model: 'selected',
      apiKey: 'test',
      fetch: vi.fn().mockResolvedValue(new Response(body, { status: 401 })),
    });
    await expect(p.generate(input)).rejects.toThrow(/^Provider request failed \(HTTP 401\)\.$/);
  });
  it('rejects malformed Anthropic text blocks', async () => {
    const p = createProvider({
      kind: 'anthropic',
      model: 'selected',
      apiKey: 'test',
      fetch: vi.fn().mockResolvedValue(
        Response.json({
          content: [
            { type: 'text', text: 'Valid part' },
            { type: 'text', text: { wrong: true } },
          ],
        }),
      ),
    });
    await expect(p.generate(input)).rejects.toThrow('usable draft');
  });
  it('makes no request when already cancelled', async () => {
    const fetch = vi.fn();
    const p = createProvider({ kind: 'ollama', model: 'selected', fetch });
    await expect(p.generate(input, AbortSignal.abort())).rejects.toThrow('cancelled');
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(['openai', 'huggingface', 'anthropic', 'ollama'] as const)(
    'sends bounded explicit %s requests with correct image encoding',
    async (kind) => {
      const payload =
        kind === 'anthropic'
          ? { content: [{ type: 'text', text: 'Description' }] }
          : kind === 'ollama'
            ? { message: { content: 'Description' } }
            : { choices: [{ message: { content: 'Description' } }] };
      const fetch = vi.fn().mockResolvedValue(Response.json(payload));
      const p = createProvider({ kind, model: 'selected-model', apiKey: 'test-key', fetch });
      expect(await p.generate(input)).toBe('Description');
      const [url, options] = fetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.model).toBe('selected-model');
      expect(options.redirect).toBe('error');
      expect(options.signal).toBeInstanceOf(AbortSignal);
      if (kind === 'anthropic')
        expect(body.messages[0].content[0].source.media_type).toBe('image/png');
      else if (kind === 'ollama') expect(body.messages[1].images).toEqual([image.base64]);
      else expect(body.messages[1].content[1].image_url.url).toMatch(/^data:image\/png;base64,/);
      if (kind === 'huggingface')
        expect(url).toBe('https://router.huggingface.co/v1/chat/completions');
    },
  );
  it('requires a model, credentials and an appropriate endpoint', () => {
    expect(() => createProvider({ kind: 'openai', model: '' })).toThrow('Model');
    expect(() => createProvider({ kind: 'openai', model: 'selected' })).toThrow('key');
    expect(() =>
      createProvider({ kind: 'ollama', model: 'selected', baseUrl: 'http://remote.example/api' }),
    ).toThrow('HTTPS');
    expect(() =>
      createProvider({
        kind: 'openai',
        model: 'selected',
        apiKey: 'secret',
        baseUrl: 'https://host.test/?key=secret',
      }),
    ).toThrow('without credentials');
  });
  it('redacts remote HTTP bodies and connection exception details', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('SECRET body', { status: 401 }));
    const p = createProvider({ kind: 'openai', model: 'selected', apiKey: 'SECRET', fetch });
    await expect(p.generate(input)).rejects.toThrow('HTTP 401');
    fetch.mockRejectedValue(new Error('SECRET transport detail'));
    await expect(p.generate(input)).rejects.toThrow(/^Provider request failed\.$/);
  });
  it.each([{}, { choices: [] }, { choices: [{ message: { content: null } }] }])(
    'rejects unusable provider response %#',
    async (payload) => {
      const p = createProvider({
        kind: 'openai',
        model: 'selected',
        apiKey: 'test',
        fetch: vi.fn().mockResolvedValue(Response.json(payload)),
      });
      await expect(p.generate(input)).rejects.toThrow('usable draft');
    },
  );
  it('rejects a response above the byte limit', async () => {
    const p = createProvider({
      kind: 'openai',
      model: 'selected',
      apiKey: 'test',
      fetch: vi.fn().mockResolvedValue(new Response('x'.repeat(256_001))),
    });
    await expect(p.generate(input)).rejects.toThrow('size limit');
  });
  it('aborts slow requests without retrying', async () => {
    const fetch = vi.fn(
      (_url, options) =>
        new Promise<Response>((_resolve, reject) =>
          options.signal.addEventListener('abort', () => reject(new Error('abort'))),
        ),
    );
    const p = createProvider({
      kind: 'ollama',
      model: 'selected',
      timeoutMs: 10,
      fetch: fetch as typeof globalThis.fetch,
    });
    await expect(p.generate(input)).rejects.toThrow('timed out');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('forwards caller cancellation', async () => {
    const controller = new AbortController();
    const fetch = vi.fn(
      (_url, options) =>
        new Promise<Response>((_resolve, reject) =>
          options.signal.addEventListener('abort', () => reject(new Error('abort'))),
        ),
    );
    const p = createProvider({
      kind: 'ollama',
      model: 'selected',
      fetch: fetch as typeof globalThis.fetch,
    });
    const pending = p.generate(input, controller.signal);
    controller.abort();
    await expect(pending).rejects.toThrow('cancelled');
  });
});
