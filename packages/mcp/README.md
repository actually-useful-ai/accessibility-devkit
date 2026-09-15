# Accessibility MCP tools

`@accessibility-devkit/mcp` is a genuine Model Context Protocol server using the
[official TypeScript SDK](https://ts.sdk.modelcontextprotocol.io/). It connects
over standard input/output and exposes four local tools:

| Tool                  | Supplied input                               | Result                                                          |
| --------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| `scan_source`         | HTML text, optional label and review profile | Existing source report with findings and separate manual checks |
| `check_contrast`      | Two hex colors, level and text size          | Ratio and selected threshold result                             |
| `analyze_readability` | English text                                 | Heuristic readability scores                                    |
| `assess_timing`       | Time-limit settings                          | Deterministic timing assessment or manual-review requirement    |

This new package is available from source, separately from the ten published
Devkit 1.1.2 packages. It is not automatically included in the installed plugin.

## Build and connect

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
node packages/mcp/dist/cli.mjs
```

The process waits for MCP requests; ordinary output would interfere with the
protocol. Configure a compatible client to launch `node` with the **absolute path**
to `packages/mcp/dist/cli.mjs` in your built checkout. For clients using the common
`mcpServers` configuration shape:

```json
{
  "mcpServers": {
    "accessibility": {
      "command": "node",
      "args": ["/absolute/path/to/accessibility-devkit/packages/mcp/dist/cli.mjs"]
    }
  }
}
```

Use that client's supported configuration mechanism; the JSON shape is not a
promise that every host uses the same settings file. Listing tools should return
the four names above. A black/white `check_contrast` call should return ratio 21.

`createAccessibilityServer()` is also exported for integrations and testing.

## Boundaries

The server accepts supplied text and objects. It has no filesystem access tool,
URL fetcher, browser, HTTP listener or model provider. It does not accept a path
instead of HTML source. Text inputs are limited to 128,000 characters. No API key
is needed, and credentials present in the environment do not enable generation.

Source checks and calculated values do not establish rendered behavior or
accessibility conformance. Keyboard, screen-reader, zoom, context and user testing
remain separate. Optional model-assisted generation is provided by the sibling
`assist` package and CLI; the MCP server does not silently transmit source to it.

The archived prototype's package named `mcp` was a Flask HTTP service. Its routes
are not a compatibility interface for this server.
