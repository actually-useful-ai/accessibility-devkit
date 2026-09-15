// Browser regression check. Requires Playwright through NODE_PATH.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
(async () => {
  const out = process.env.KEYBOARD_EVIDENCE_DIR;
  if (!out) throw Error('Set KEYBOARD_EVIDENCE_DIR');
  await fs.mkdir(out, { recursive: true });
  const server = http.createServer(async (req, res) => {
    const file = req.url === '/' ? 'index.html' : req.url === '/guard.mjs' ? 'guard.mjs' : null;
    if (!file) {
      res.writeHead(404).end();
      return;
    }
    res.setHeader('Content-Type', file.endsWith('.mjs') ? 'text/javascript' : 'text/html');
    res.end(await fs.readFile(path.join(__dirname, file)));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let browser;
  const checks = [];
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.KEYBOARD_CHROMIUM_PATH
        ? { executablePath: process.env.KEYBOARD_CHROMIUM_PATH }
        : {}),
    });
    const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    const status = () => page.locator('#status').innerText();
    async function unchanged(label, action) {
      const before = await status();
      await action();
      assert.equal(await status(), before, label);
      checks.push(label);
    }
    await unchanged('shortcuts begin off', () => page.keyboard.press('1'));
    await page.locator('#route').focus();
    await page.keyboard.press('Enter');
    assert.match(await status(), /Action 1/);
    checks.push('native Enter works while off');
    await page.locator('#enabled').check();
    assert.equal(await page.locator('#route').getAttribute('aria-keyshortcuts'), '1');
    await page.locator('#route').focus();
    await page.keyboard.press('2');
    assert.match(await status(), /Save route/);
    checks.push('enabled number shortcut works');
    await unchanged('input typing', async () => {
      await page.locator('#notes').fill('');
      await page.locator('#notes').pressSequentially('123');
    });
    assert.equal(await page.locator('#notes').inputValue(), '123');
    await unchanged('nested editable typing', async () => {
      await page.locator('#editor').focus();
      await page.keyboard.press('1');
    });
    await page.locator('#route').focus();
    for (const key of ['Control+1', 'Meta+1', 'Alt+1', 'Shift+1', '3']) {
      await unchanged(`ignored key ${key}`, () => page.keyboard.press(key));
    }
    await unchanged('modal pauses background', async () => {
      await page.locator('#open-dialog').click();
      await page.keyboard.press('1');
    });
    await page.keyboard.press('Escape');
    assert.equal(
      await page.locator('#open-dialog').evaluate((el) => el === document.activeElement),
      true,
    );
    checks.push('dialog restores trigger focus');
    const boundaries = await page.evaluate(async () => {
      const { shouldHandleShortcut, canActivateShortcutButton } = await import('/guard.mjs');
      const ctx = { enabled: true, ownsFocus: true };
      const checkEvent = (target, options = {}, context = ctx, prehandled = false) => {
        let result;
        target.addEventListener(
          'keydown',
          (e) => {
            if (prehandled) e.preventDefault();
            result = shouldHandleShortcut(e, context);
          },
          { once: true },
        );
        target.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: '1',
            bubbles: true,
            composed: true,
            cancelable: true,
            ...options,
          }),
        );
        return result;
      };
      const area = document.createElement('div');
      document.body.append(area);
      const results = {};
      results['composition'] = !checkEvent(area, { isComposing: true });
      results['repeat'] = !checkEvent(area, { repeat: true });
      results['handled event'] = !checkEvent(area, {}, ctx, true);
      results['ownership required'] = !checkEvent(area, {}, { enabled: true });
      results['enablement required'] = !checkEvent(area, {}, { ownsFocus: true });
      results['editable descendant'] = !checkEvent(document.querySelector('#editor span'));
      for (const role of ['textbox', 'searchbox', 'combobox', 'spinbutton']) {
        area.setAttribute('role', role);
        results[`role ${role}`] = !checkEvent(area);
      }
      area.removeAttribute('role');
      area.setAttribute('data-shortcuts-ignore', '');
      results['custom editor opt-out'] = !checkEvent(area);
      area.removeAttribute('data-shortcuts-ignore');
      const host = document.createElement('div');
      document.body.append(host);
      const shadow = host.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<input aria-label="Shadow editor">';
      let allowed;
      host.addEventListener(
        'keydown',
        (e) => {
          allowed = shouldHandleShortcut(e, ctx);
        },
        { once: true },
      );
      shadow
        .querySelector('input')
        .dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true, composed: true }));
      results['shadow retargeted editor'] = !allowed;
      const fieldset = document.createElement('fieldset');
      fieldset.disabled = true;
      fieldset.innerHTML = '<button>Fieldset action</button>';
      area.append(fieldset);
      results['disabled fieldset'] = !canActivateShortcutButton(fieldset.firstChild);
      const button = document.createElement('button');
      button.textContent = 'Test';
      area.append(button);
      for (const attr of ['hidden', 'inert', 'aria-hidden', 'aria-disabled']) {
        area.setAttribute(attr, 'true');
        results[`ancestor ${attr}`] = !canActivateShortcutButton(button);
        area.removeAttribute(attr);
      }
      button.style.display = 'none';
      results['CSS hidden button'] = !canActivateShortcutButton(button);
      button.style.display = '';
      button.style.visibility = 'hidden';
      results['CSS invisible button'] = !canActivateShortcutButton(button);
      area.remove();
      host.remove();
      results['detached button'] = !canActivateShortcutButton(button);
      return results;
    });
    for (const [name, passed] of Object.entries(boundaries)) {
      assert.equal(passed, true, name);
      checks.push(name);
    }
    await page.locator('#enabled').uncheck();
    assert.equal(await page.locator('#route').getAttribute('aria-keyshortcuts'), null);
    await unchanged('off switch takes effect', () => page.keyboard.press('1'));
    await page.locator('#route').focus();
    await page.screenshot({ path: path.join(out, 'desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    checks.push('390px layout has no horizontal overflow');
    await page.screenshot({ path: path.join(out, 'mobile.png'), fullPage: true });
    const evidence = {
      browser: browser.version(),
      passed: checks.length,
      checks,
      screenReader: 'not tested',
      speechInput: 'not tested',
    };
    await fs.writeFile(path.join(out, 'evidence.json'), JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify(evidence, null, 2));
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
