# Castor: A Browser with a Brain

**Castor is an experimental Chrome extension built for the Google Chrome AI Challenge.** It gives your browser a persistent, logical memory, enabling on-device AI to reason about the web content you consume.

## Project Goal

The goal of Castor is to transform web browsing from a series of disconnected sessions into a cohesive, intelligent research process. By leveraging the on-device power of Gemini Nano and the Mangle reasoning engine, this extension provides users with deep insights into information gathered across multiple tabs, helping them synthesize data and make complex decisions without manual effort.

## How It Works

Castor uses a combination of on-device AI (via Gemini Nano) and a WebAssembly-based reasoning engine (Mangle) to create a local knowledge graph from the web pages you visit. This allows you to ask complex questions and get synthesized answers based on the content you've consumed.

## Core Dependencies

*   **Framework:** [Vue 3](https://vuejs.org/)
*   **On-Device AI:** [Google Gemini Nano](https://ai.google.dev/docs/gemini_api_overview)
*   **Reasoning Engine:** [Mangle Datalog Engine (Wasm)](https://github.com/JordanScarrott/mangle-wasm)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **State Management:** [Pinia](https://pinia.vuejs.org/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)

## Gemini API Usage

This project utilizes the Gemini API in the following ways:

**Writer API:**
*   **Summarization:** Condensing webpage content into concise summaries for knowledge extraction.
*   **Natural Language Formatting:** Transforming raw Datalog query results into user-friendly, natural language responses.

**Prompt API:**
*   **Title Generation:** Creating short, context-aware titles for new tab groups based on the user's research goal.
*   **Query Translation:** Converting structured Datalog queries into natural language questions to be displayed as interactive sample questions in the UI.
*   **Real-time Notifications:** Generating brief, user-facing status updates about data discoveries during browsing.

## Developer Setup

**Prerequisites:**
*   [Node.js](https://nodejs.org/)
*   [pnpm](https://pnpm.io/)
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
