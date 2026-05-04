// Vitest setup file — runs in the jsdom environment before each test file.
//
// Node 25+ exposes a native `localStorage` global (backed by --localstorage-file).
// When that flag has no path the native stub has no .clear()/.setItem() etc.
// Vitest's populateGlobal skips jsdom's localStorage because the native one is
// already present on globalThis and 'localStorage' is not in Vitest's KEYS list.
//
// Fix: pull the real Storage from jsdom's internal window object (exposed on
// the global as `window.jsdom.window.localStorage`) and redefine globalThis.localStorage.
if (typeof window !== 'undefined' && (window as any).jsdom) {
  const jsdomWindow = (window as any).jsdom.window as Window;
  const realStorage = jsdomWindow.localStorage;
  if (realStorage && typeof realStorage.clear === 'function') {
    Object.defineProperty(globalThis, 'localStorage', {
      value: realStorage,
      configurable: true,
      enumerable: true,
      writable: true,
    });
  }
}
