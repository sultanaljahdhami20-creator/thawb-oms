// Submit an explicitly marked save action from single-line inputs. Native forms,
// select menus, textareas, IME composition and focused buttons keep browser behavior.
// Enter also toggles checkboxes/radios and activates semantic clickable rows.
const submitting = new WeakSet();
export function handleEnterSubmit(event) {
  if (!['Enter', ' '].includes(event.key) || event.defaultPrevented || event.repeat || event.isComposing || event.nativeEvent?.isComposing || event.keyCode === 229 || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
  const target = event.target;
  if (target?.disabled || target?.matches?.(':disabled') || target?.getAttribute?.('aria-disabled') === 'true') return;
  const semanticButton = target?.getAttribute?.('role') === 'button' && !['BUTTON','A','INPUT'].includes(target.tagName);
  const toggle = target?.tagName === 'INPUT' && ['checkbox','radio'].includes(target.type);
  if (semanticButton || (event.key === 'Enter' && toggle)) {
    event.preventDefault();
    target.click();
    return;
  }
  if (event.key !== 'Enter') return;
  if (target?.tagName !== 'INPUT' || target.isContentEditable || target.closest('form') || ['checkbox','radio','file','button','submit','reset','range','color'].includes(target.type)) return;
  const scope = target.closest('[data-enter-scope]');
  if (!scope || scope.closest('[aria-hidden="true"]') || submitting.has(scope)) return;
  // A covered dialog must never submit through a confirmation above it.
  const layers = [...scope.ownerDocument.querySelectorAll('[data-enter-scope]')].filter(node => node.getClientRects().length);
  const zIndex = node => Number(node.style.zIndex) || 0;
  const top = layers.reduce((highest, node) => !highest || zIndex(node) >= zIndex(highest) ? node : highest, null);
  if (top !== scope) return;
  const button = scope.querySelector('[data-enter-submit]');
  if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true' || !button.getClientRects().length) return;
  event.preventDefault();
  submitting.add(scope);
  try { button.click(); }
  finally { queueMicrotask(() => submitting.delete(scope)); }
}
