# Gemini API Information Flow Diagrams

This document outlines the various ways the Gemini API is used within this Chrome Extension, illustrating the information flow for each use case.

## Sequence Diagrams

The following Mermaid.js diagrams illustrate the sequence of events and messages passed between the different components of the extension for each Gemini API function.

### 1. `askPrompt` for Mangle Properties

This function is used to extract Mangle properties from a given text.

```mermaid
sequenceDiagram
    participant ServiceWorker
    participant GeminiNanoService

    ServiceWorker->>GeminiNanoService: geminiNanoService.askPrompt(inputText, systemPrompt, schema)
    GeminiNanoService-->>ServiceWorker: returns MangleSchemaProperties
```

### 2. `askPrompt` for Mangle Schema Generation

This function is used to generate a Mangle schema based on a user's goal.

```mermaid
sequenceDiagram
    participant ServiceWorker
    participant GeminiNanoService

    ServiceWorker->>ServiceWorker: createMangleSchemaPrompt(userGoal)
    ServiceWorker->>GeminiNanoService: geminiNanoService.askPrompt("", prompt, schema)
    GeminiNanoService-->>ServiceWorker: returns MangleSchema
```

### 3. `askPromptStreaming`

This function is used for streaming prompts to the Gemini API.

```mermaid
sequenceDiagram
    participant ServiceWorker
    participant GeminiNanoService
    participant PopupUI

    ServiceWorker->>GeminiNanoService: geminiNanoService.askPromptStreaming(userPrompt, systemPrompt, onChunk, schema)
    GeminiNanoService-->>ServiceWorker: onChunk(chunk)
    ServiceWorker->>PopupUI: chrome.runtime.sendMessage({ type: "STREAM_UPDATE", payload: chunk })
```

### 4. `formatResponseWithAI` (using `geminiNanoWriteStreaming`)

This function is used to generate a natural language response from a Mangle query result.

```mermaid
sequenceDiagram
    participant ServiceWorker
    participant GeminiNanoService
    participant PopupUI

    ServiceWorker->>GeminiNanoService: formatResponseWithAI(question, mangleResult)
    GeminiNanoService->>GeminiNanoService: geminiNanoWriteStreaming(prompt, messageId)
    GeminiNanoService->>PopupUI: chrome.runtime.sendMessage({ type: "STREAM_UPDATE", payload: { messageId, chunk, isLast } })
```

### 5. `summarize` and `summarizeStreaming`

These functions are used to summarize a given text.

```mermaid
sequenceDiagram
    participant ServiceWorker
    participant GeminiNanoService
    participant PopupUI

    ServiceWorker->>GeminiNanoService: geminiNanoService.summarize(inputText)
    GeminiNanoService-->>ServiceWorker: returns summary

    ServiceWorker->>GeminiNanoService: geminiNanoService.summarizeStreaming(inputText, onChunk)
    GeminiNanoService-->>ServiceWorker: onChunk(chunk)
    ServiceWorker->>PopupUI: chrome.runtime.sendMessage({ type: "STREAM_UPDATE", payload: chunk })
```
