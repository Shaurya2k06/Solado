import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Buffer } from 'buffer'
import process from 'process'

// Polyfill Buffer and process for browser environment
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.process = process;
}

// Global polyfills
globalThis.Buffer = Buffer;
globalThis.process = process;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
