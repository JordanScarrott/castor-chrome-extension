# Castor: A Browser with a Brain

**Castor is an experimental Chrome extension built for the Google Chrome AI Challenge.** It gives your browser a persistent, logical memory, enabling on-device AI to reason about the web content you consume.

## Project Goal

The goal of Castor is to transform web browsing from a series of disconnected sessions into a cohesive, intelligent research process. By leveraging the on-device power of Gemini Nano and the Mangle reasoning engine, this extension provides users with deep insights into information gathered across multiple tabs, helping them synthesize data and make complex decisions without manual effort.

## Core Technologies

*   **Framework:** [Vue 3](https://vuejs.org/)
*   **On-Device AI:** [Google Gemini Nano](https://ai.google.dev/docs/gemini_api_overview)
*   **Reasoning Engine:** [Mangle Datalog Engine (Wasm)](https://github.com/JordanScarrott/mangle-wasm)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **State Management:** [Pinia](https://pinia.vuejs.org/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)

### Mangle Reasoning Engine

The Mangle Datalog engine, compiled to WebAssembly, provides the core logic and reasoning capabilities. The engine's flexibility and power are validated by a comprehensive test suite that showcases its ability to handle any fact schema and demonstrates all possible operations. Key validation files include:
*   `realWorldTests.test.ts`
*   `newMangleTests.test.ts`
*   `crossSiteDemo.test.ts`

## Gemini API Usage

Castor leverages Google's on-device Gemini Nano APIs to integrate AI seamlessly into the browsing experience.

### [Prompt API](https://developer.chrome.com/docs/ai/prompt-api?hl=en)

The Prompt API is used for versatile, context-aware text generation tasks:

*   **Fact Ingestion:** Taking unstructured text from webpages and transforming it into structured Datalog facts for the Mangle engine.
*   **Tab Group Title Generation:** Creating short, context-aware titles for new tab groups based on the user's stated research goal.
*   **Natural Language Query Generation:** Translating formal Datalog queries into user-friendly questions, which are presented as clickable chips in the chat interface.

### [Writer API](https://developer.chrome.com/docs/ai/writer-api?hl=en)

The Writer API is used for refining and formatting text:

*   **AI Response Formatting:** Taking the structured output from a Mangle query and reformatting it into a polished, natural language response for the user.

## Developer Setup

**Prerequisites:**
*   [Node.js](https://nodejs.org/)
*   [pnpm](https://pnpm.io/) (This project uses `pnpm` for package management)
*   [Google Chrome](https://www.google.com/chrome/) (latest version with AI features enabled)

**1. Install Dependencies:**
```bash
pnpm install
```

**2. Build the Extension:**
```bash
pnpm run build
```

**3. Load the Extension in Chrome:**
1.  Navigate to `chrome://extensions`.
2.  Enable **"Developer mode"**.
3.  Click **"Load unpacked"** and select the `dist` directory.

## Running the Demo Websites

The `demos` directory contains three static websites for testing the extension's features.

**1. Navigate to the `demos` directory:**
```bash
cd demos
```

**2. Install Demo Dependencies:**
```bash
pnpm install
```

**3. Run all Demos:**
```bash
pnpm run serve
```
*   **Hotel Demo:** `http://localhost:8081`
*   **Restaurant Demo:** `http://localhost:8082`
*   **Bus Tour Demo:** `http://localhost:8083`
