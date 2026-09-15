# Optional accessibility drafting

`@accessibility-devkit/assist` recovers the useful generation workflows from the
archived language-model prototype. This new package is available from source;
it is separate from the published Devkit 1.1.2 packages.

It provides contextual alt-text drafts, source-review suggestions, and selectable
word suggestions. Every result has `status: "draft"`, `humanReviewRequired: true`,
provider/model provenance and verification steps. Generated suggestions never
become deterministic findings or a conformance report.

## Build and run

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
node packages/assist/dist/cli.mjs --help
```

Choose the provider and an appropriate model explicitly. A local Ollama example:

```sh
node packages/assist/dist/cli.mjs alt-text ./photo.png \
  --provider ollama --model YOUR_VISION_MODEL --send \
  --media-type image/png --purpose informative \
  --context 'The photo accompanies a description of the garden.'
```

For `openai`, `anthropic` or `huggingface`, supply credentials through
`ACCESSIBILITY_API_KEY` or the provider's `*_API_KEY` environment variable.
Do not put credentials on the command line. `--base-url` selects a compatible
API root when needed; HTTPS is required except for loopback HTTP.
The Hugging Face adapter uses its OpenAI-compatible router; choose a model that
supports the requested text or image input. Provider availability and permissions
depend on the selected account and model. HTTP adapters have fixture coverage;
this migration does not claim every live model has been exercised.

```sh
node packages/assist/dist/cli.mjs review ./checkout.html \
  --provider openai --model YOUR_MODEL --send \
  --context 'Complete checkout using a keyboard.'

node packages/assist/dist/cli.mjs suggest-words ./prefix.txt \
  --provider ollama --model YOUR_TEXT_MODEL --send \
  --context 'Ordering lunch in my own words.'
```

`--send` permits transmitting only the named file and supplied context to the
chosen provider. URL inputs are not supported. Files are limited to 6 MB for
images and 100 KB for text; prompts and provider responses have additional limits.
No file is edited, suggestion selected, or text spoken automatically.

For a decorative image, `alt-text unused --purpose decorative --context 'Border'`
returns an empty alternative for review without reading the file or making a
provider request. No `--send`, credentials or model are needed for that decision.

## Programmatic API

```ts
import { createProvider, draftAltText } from '@accessibility-devkit/assist';

const provider = createProvider({ kind: 'ollama', model: 'YOUR_VISION_MODEL' });
const draft = await draftAltText(provider, {
  image: { mediaType: 'image/png', base64: suppliedImageBytes },
  purpose: 'functional',
  context: 'This image is the only content of a link to the account page.',
});
```

`draftAltText`, `suggestAccessibilityReview`, and `suggestWords` accept an optional
`AbortSignal`. `createProvider` accepts an explicit model, API root, timeout and
an injectable `fetch`. No default model, fallback provider, automatic retry or
conversation history is selected. Calls time out after 30 seconds by default,
including response reading. Error messages omit provider bodies and credentials.

The exported `altTextPrompt` and `accessibilityReviewPrompt` can also be used with
an existing provider integration. A custom provider implements `DraftProvider`.
Treat all generated content as untrusted plain text; never insert it into HTML
without escaping. Verify visible text, names, purpose and uncertainties before use.

Word suggestions support personal communication. They do not diagnose a condition,
recommend a device, produce a clinical plan or replace the person's choices.
