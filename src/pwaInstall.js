export function installationPlatform(navigator) {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  return /Android/i.test(ua) ? 'android' : 'desktop';
}

export function createInstallController(browser) {
  const mode = browser.matchMedia('(display-mode: standalone)');
  let promptEvent = null;
  let state = {installed: mode.matches || browser.navigator.standalone === true, canPrompt: false};
  const listeners = new Set();
  const update = changes => {
    state = {...state, ...changes};
    listeners.forEach(listener => listener());
  };
  const onPrompt = event => {
    event.preventDefault();
    promptEvent = event;
    update({canPrompt: true});
  };
  const onInstalled = () => {
    promptEvent = null;
    update({installed: true, canPrompt: false});
  };
  const onModeChange = () => {
    if (mode.matches || browser.navigator.standalone === true) onInstalled();
  };
  browser.addEventListener('beforeinstallprompt', onPrompt);
  browser.addEventListener('appinstalled', onInstalled);
  mode.addEventListener('change', onModeChange);
  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async prompt() {
      const event = promptEvent;
      if (!event) return null;
      promptEvent = null;
      update({canPrompt: false});
      await event.prompt();
      return event.userChoice;
    },
    dispose() {
      browser.removeEventListener('beforeinstallprompt', onPrompt);
      browser.removeEventListener('appinstalled', onInstalled);
      mode.removeEventListener('change', onModeChange);
      listeners.clear();
    },
  };
}

// Capture the browser event before the app finishes loading its data.
export const installController = typeof window === 'undefined' ? null : createInstallController(window);
if (import.meta.hot) import.meta.hot.dispose(() => installController?.dispose());
