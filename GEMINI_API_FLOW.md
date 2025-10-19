# Gemini API Information Flow Diagrams

This document outlines the various ways the Gemini API is used within this Chrome Extension, illustrating the information flow for each use case.

## Sequence Diagrams

The following Mermaid.js diagrams illustrate the sequence of events and messages passed between the different components of the extension for each Gemini API function.

### 1. `GeminiNanoService` API Interaction (Unified Flow)

All interactions with the Gemini Nano APIs (`LanguageModel`, `Summarizer`, `Writer`) are now managed by the `GeminiNanoService`. This service uses a session caching mechanism to improve performance by reusing session objects.

```mermaid
sequenceDiagram
    participant ClientCode as (e.g., Service Worker)
    participant GeminiNanoService
    participant GeminiNanoAPI as (LanguageModel, Summarizer, Writer)

    ClientCode->>GeminiNanoService: call e.g., askPrompt(prompt)
    GeminiNanoService->>GeminiNanoService: Check for cached session
    alt Session not found
        GeminiNanoService->>GeminiNanoAPI: create()
        GeminiNanoAPI-->>GeminiNanoService: new session
        GeminiNanoService->>GeminiNanoService: Store session in cache
    end
    GeminiNanoService->>GeminiNanoAPI: Use session to call API method (e.g., prompt(prompt))
    GeminiNanoAPI-->>GeminiNanoService: returns result or stream
    GeminiNanoService-->>ClientCode: returns result or stream
```

### 2. `formatResponseWithAI` Flow

This standalone function generates a natural language response from a Mangle query result. It now calls the generic `writeStreaming` method on the `GeminiNanoService`.

```mermaid
sequenceDiagram
    participant ServiceWorker
    participant StandaloneFunctions as (formatResponseWithAI)
    participant GeminiNanoService
    participant PopupUI

    ServiceWorker->>StandaloneFunctions: formatResponseWithAI(question, mangleResult)
    Note over StandaloneFunctions,GeminiNanoService: Constructs prompt and options object
    StandaloneFunctions->>GeminiNanoService: geminiNanoService.writeStreaming(prompt, messageId, options)
    GeminiNanoService-->>PopupUI: chrome.runtime.sendMessage({ type: "STREAM_UPDATE", payload: { messageId, chunk, isLast } })
```
