// Copyright (c) 2026 Luke Steuber. MIT; see ../../LICENSE.
// Adapted from the typing and scene-ownership guards in StoryBlocks.
const editingSelector =
  'input, textarea, select, [role="textbox"], [role="searchbox"], ' +
  '[role="combobox"], [role="spinbutton"], [data-shortcuts-ignore]';

function ancestry(element) {
  const result = [];
  for (let node = element; node;) {
    result.push(node);
    node = node.assignedSlot || node.parentElement || node.getRootNode?.().host;
  }
  return result;
}

/** Check the current event and explicit application context without consuming it. */
export function shouldHandleShortcut(event, { enabled = false, ownsFocus = false } = {}) {
  if (!enabled || !ownsFocus || event.defaultPrevented || event.repeat || event.isComposing) {
    return false;
  }
  if (
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.shiftKey ||
    event.getModifierState?.('AltGraph') ||
    event.keyCode === 229 ||
    ['Dead', 'Process', 'Unidentified'].includes(event.key)
  )
    return false;
  const path = event.composedPath?.() || [];
  const nodes = path.length ? path : ancestry(event.target);
  return !nodes.some((node) => node.isContentEditable || node.matches?.(editingSelector));
}

/** Only the native, visible action button may receive a shortcut click. */
export function canActivateShortcutButton(button) {
  if (!button?.matches?.('button') || !button.isConnected || button.matches(':disabled')) {
    return false;
  }
  if (
    ancestry(button).some((node) =>
      node.matches?.('[hidden], [inert], [aria-hidden="true"], [aria-disabled="true"]'),
    )
  ) {
    return false;
  }
  const style = button.ownerDocument.defaultView.getComputedStyle(button);
  return (
    button.getClientRects().length > 0 &&
    style.visibility !== 'hidden' &&
    style.visibility !== 'collapse'
  );
}
