import { readFileSync, statSync } from 'node:fs';
import {
  createProvider,
  draftAltText,
  suggestAccessibilityReview,
  suggestWords,
  type ProviderKind,
  type ImageType,
} from './index';

const help = `accessibility-assist <alt-text|review|suggest-words> <file> --send
  --provider openai|anthropic|ollama|huggingface --model NAME
  --context TEXT [--purpose informative|functional|complex|decorative]
  [--media-type image/png|image/jpeg|image/webp] [--language en]
  [--base-url URL]

Reads only the named local file. --send explicitly permits sending it and context
to the chosen provider. Credentials come from ACCESSIBILITY_API_KEY or the
provider's *_API_KEY environment variable. Output is a JSON draft for review.
For review, --context describes the task; for suggest-words, the file is a prefix.
Decorative alt text returns an empty draft without reading the file or contacting
a provider. Provider/model and --send are unnecessary for that local decision.
No URL inputs, automatic edits, clinical plans, or conformance verdicts.
`;

function readBounded(path: string, maximum: number): Buffer {
  if (/^https?:/i.test(path)) throw new TypeError('Supply a local file, not a URL.');
  const stat = statSync(path);
  if (!stat.isFile() || stat.size > maximum)
    throw new TypeError('Input must be a regular file within the size limit.');
  const value = readFileSync(path);
  if (value.length > maximum) throw new TypeError('Input exceeds the size limit.');
  return value;
}

export async function runAssist(
  args: string[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  if (args.length === 0 || args.includes('--help')) return help;
  const [command, path, ...rest] = args;
  if (!['alt-text', 'review', 'suggest-words'].includes(command) || !path || path.startsWith('--'))
    throw new TypeError('Specify a command and local file. Use --help.');
  const flags: Record<string, string> = {};
  const accepted = new Set([
    '--provider',
    '--model',
    '--context',
    '--purpose',
    '--media-type',
    '--language',
    '--base-url',
  ]);
  let send = false;
  for (let i = 0; i < rest.length; i++) {
    const key = rest[i];
    if (key === '--send') {
      send = true;
      continue;
    }
    if (!accepted.has(key) || !rest[i + 1] || rest[i + 1].startsWith('--') || key in flags)
      throw new TypeError('Unknown, duplicate or incomplete option. Use --help.');
    flags[key] = rest[++i];
  }
  const context = flags['--context'] ?? '';
  const purpose = flags['--purpose'] as 'informative' | 'functional' | 'complex' | 'decorative';
  if (command === 'alt-text' && purpose === 'decorative') {
    const unused = {
      kind: 'ollama' as const,
      model: 'unused',
      generate: async () => {
        throw new Error('Unexpected provider request.');
      },
    };
    return JSON.stringify(
      await draftAltText(unused, { context, purpose, language: flags['--language'] }),
      null,
      2,
    );
  }
  if (!send)
    throw new TypeError(
      'Use --send to permit sending the supplied content to the chosen provider.',
    );
  const kind = flags['--provider'] as ProviderKind;
  const provider = createProvider({
    kind,
    model: flags['--model'],
    apiKey: env.ACCESSIBILITY_API_KEY ?? env[`${kind?.toUpperCase()}_API_KEY`],
    baseUrl: flags['--base-url'],
  });
  let result;
  if (command === 'alt-text') {
    const image = {
      mediaType: flags['--media-type'] as ImageType,
      base64: readBounded(path, 6_000_000).toString('base64'),
    };
    result = await draftAltText(provider, {
      image,
      context,
      purpose,
      language: flags['--language'],
    });
  } else {
    const source = readBounded(path, 100_000).toString('utf8');
    result =
      command === 'review'
        ? await suggestAccessibilityReview(provider, { source, task: context })
        : await suggestWords(provider, { prefix: source, context });
  }
  return JSON.stringify(result, null, 2);
}
