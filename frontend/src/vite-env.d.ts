/// <reference types="vite/client" />

// Polyfill types for browser environment
interface Window {
  Buffer: typeof import('buffer').Buffer;
  process: typeof import('process');
}

declare global {
  var Buffer: typeof import('buffer').Buffer;
  var process: typeof import('process');
}
