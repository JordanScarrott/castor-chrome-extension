# Mangle Chrome Extension: A Browser with a Brain

*An experimental Chrome extension that gives your browser a persistent, logical memory, enabling on-device AI to reason about the web content you consume.*

## Project Goal

The primary goal of this project is to transform the web browsing experience from a series of disconnected sessions into a cohesive, intelligent research process. By leveraging the on-device power of Gemini Nano and the Mangle reasoning engine, this extension aims to provide users with deep insights into the information they gather across multiple tabs. It helps users synthesize data and make complex decisions without manually collating information.

## Use Case Example: Buying a Laptop

Imagine you're trying to buy a new laptop. You have ten tabs open: five with different models from various online stores, and five with reviews and benchmark comparisons. Switching between tabs, you struggle to keep track of the specs, prices, and pros and cons of each option.

With this extension, you can simply tell it: "My goal is to find the best laptop for under $1500 with at least 16GB of RAM and a good keyboard for programming."

As you browse, the extension consumes the information from each tab, adding it to its knowledge base. When you're ready, you can ask it questions like:
*   "Which of these laptops have the best battery life according to the reviews?"
*   "Summarize the negative feedback for the Dell XPS 15."
*   "Based on my goal, which laptop is the best value for the money?"

The extension reasons over the data from all your open tabs and provides you with a synthesized, actionable answer, helping you make a better, more informed decision, faster.

## How It Works

The extension uses a combination of on-device AI (via Gemini Nano) and a WebAssembly-based reasoning engine (Mangle) to create a local knowledge graph from the web pages you visit. This allows you to ask complex questions and get synthesized answers based on the content you've consumed.

The core reasoning loop is as follows:
1.  **Consume Content:** The user browses to a web page.
2.  **Perceive & Summarize:** Gemini Nano summarizes the page content.
3.  **Extract Knowledge:** The summary is converted into structured Mangle Datalog facts.
4.  **Load into Memory:** The facts are loaded into the Mangle Wasm engine.
5.  **Ask a Question:** The user asks a natural language question.
6.  **Translate to Logic:** The question is translated into a formal Mangle query.
7.  **Reason & Deduce:** The Mangle engine executes the query against its knowledge graph.
8.  **Deliver the Insight:** The result is displayed to the user.

## Dependencies

This project is built with a modern web stack:

*   **Framework:** [Vue 3](https://vuejs.org/)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Testing:** [Vitest](https://vitest.dev/)
*   **State Management:** [Pinia](https://pinia.vuejs.org/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Linting/Formatting:** [Biome](https://biomejs.dev/)

## Wasm Module

The Mangle reasoning engine is compiled to WebAssembly from a forked version of the official Mangle project. The source for the Wasm module can be found here:
[https://github.com/JordanScarrott/mangle-wasm](https://github.com/JordanScarrott/mangle-wasm)

## Developer Setup

To get started with development, follow these steps:

**Prerequisites:**
*   [Node.js](https://nodejs.org/)
*   [pnpm](https://pnpm.io/)
*   [Google Chrome](https://www.google.com/chrome/) (latest version recommended)

**Installation:**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/JordanScarrott/mangle-chrome-extension.git
    cd mangle-chrome-extension
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Build the extension:**
    ```bash
    pnpm run build
    ```
    This will create a `dist` directory with the unpacked extension files.

**Loading the extension in Chrome:**

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **"Developer mode"** using the toggle in the top-right corner.
3.  Click **"Load unpacked"**.
4.  Select the `dist` directory from this project.
5.  The extension icon should appear in your browser's toolbar.

## Testing

This project uses [Vitest](https://vitest.dev/) for unit testing. To run the tests, use the following command:

```bash
pnpm test
```

This will run all tests defined in the `src/tests` directory.

## Running the Demos

The `demos` directory contains three static websites that can be used to test the extension's features. Each demo runs on its own port.

**Prerequisites:**
*   You must have completed the **Developer Setup** steps above.

**Installation:**

1.  **Navigate to the `demos` directory:**
    ```bash
    cd demos
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```
    This will install the dependencies for all three demos.

**Running all demos at once:**

1.  **From the `demos` directory, run:**
    ```bash
    pnpm run serve
    ```
    This will start all three demo servers concurrently. The demos will be available at the following URLs:
    *   **Hotel Demo:** `http://localhost:8081`
    *   **Restaurant Demo:** `http://localhost:8082`
    *   **Bus Tour Demo:** `http://localhost:8083`

**Running each demo individually:**

You can also run each demo on its own. From the `demos` directory, use one of the following commands:

*   **Hotel Demo:**
    ```bash
    pnpm run serve:hotel
    ```
*   **Restaurant Demo:**
    ```bash
    pnpm run serve:restaurant
    ```
*   **Bus Tour Demo:**
    ```bash
    pnpm run serve:bus-tour
    ```
