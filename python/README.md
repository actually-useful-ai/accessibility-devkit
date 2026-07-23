# accessibility-devkit for Python

A dependency-free Python 3.11+ package with the same commands, JSON contract, findings, and exit codes as `@accessibility-devkit/cli`.

```bash
python -m pip install accessibility-devkit
```

Run without keeping a global install:

```bash
pipx run accessibility-devkit scan ./index.html --profile all
```

## Python API

```python
from accessibility_devkit import (
    assess_time_limit,
    get_contrast_ratio,
    meets_contrast_threshold,
    scan_source,
)

ratio = get_contrast_ratio("#595959", "#ffffff")
passes = meets_contrast_threshold("#595959", "#ffffff")
timing = assess_time_limit({"adjustmentMultiplier": 10})
report = scan_source('<html lang="en"><main></main></html>', target="inline.html")
```

## CLI

```text
accessibility-devkit scan <files...> [--profile cvi|switch|all] [--format text|json]
accessibility-devkit contrast <foreground> <background> [--level AA|AAA] [--text-size normal|large]
accessibility-devkit readability <file|->
accessibility-devkit timing <policy.json>
```

Manual checks never fail CI. Static analysis does not replace browser, assistive-technology, or human verification; read each report's `manualChecks` before drawing a conclusion.

MIT © Luke Steuber.
