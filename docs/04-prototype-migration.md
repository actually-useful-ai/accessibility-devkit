# Prototype migration

Accessibility Devkit is the maintained home for accessibility development tools
and review skills. Intentional UX remains a separate companion for interaction
design. The original language-model prototype remains archived for provenance;
the old Devkit mirror is now
[`accessibility-old`](https://github.com/actually-useful-ai/accessibility-old).

The migration starts from
[`accessibility-devkit-llm` at 241f1a3](https://github.com/lukeslp/accessibility-devkit-llm/tree/241f1a332af8dbe3a5aef4fcdc0ec33b5d619e87).
Its MIT-licensed source and history are preserved. These are adapted capabilities,
not binary-compatible replacements or a claim that old installations still work.

| Prototype surface                     | Maintained disposition                                                                                                                       |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `llm-prompts` alt-text prompts        | Contextual `altTextPrompt`; image purpose is explicit, including decorative and functional use                                               |
| `llm-prompts` ARIA and WCAG prompts   | `accessibilityReviewPrompt`; suggestions and verification tasks rather than pass/fail verdicts                                               |
| `llm-apis`                            | `assist.createProvider`: explicit model, OpenAI-compatible, Anthropic, Ollama and Hugging Face transports; bounded requests and cancellation |
| `llm-tools` alt-text CLI/API          | `assist.draftAltText` and `accessibility-assist alt-text`; explicit image bytes/MIME and context                                             |
| `llm-tools` WCAG CLI/API              | `assist.suggestAccessibilityReview` and `accessibility-assist review`; separate from deterministic reports                                   |
| AAC word prediction                   | `assist.suggestWords` and `accessibility-assist suggest-words`; a person selects or edits each suggestion                                    |
| Diagnosis-based AAC clinical planning | Retained only in archive; not a supported development-tool capability                                                                        |
| Agent skill registry                  | The canonical general Accessibility skill and four specialist skills                                                                         |
| Flask service called `llm-mcp`        | Replaced in purpose by genuine stdio MCP tools over existing deterministic checks; no HTTP route compatibility                               |
| Orchestration and chat history        | Caller-managed composition of explicit inputs; no implicit history collection or provider fallback                                           |
| Internal gateway adapter              | A caller-configured compatible API root where supported; no embedded service address or credential                                           |

The ten deterministic npm packages and Python package remain at their published
1.1.2 release. `assist` and `mcp` are new optional packages at 0.1.0 in source;
their addition does not publish them or update installed plugins automatically.
Use their package READMEs to build and test the source.

Generation outputs retain provider/model provenance, draft status and manual
verification tasks. They do not populate `AccessibilityReport.findings`, alter its
evidence categories or change the Python/Node report contract. Network adapters
are tested with fixture responses; live provider compatibility remains dependent
on the selected model and account.
