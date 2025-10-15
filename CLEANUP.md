# Project Cleanup

This file documents the files and directories that are not currently used in the project.

## Unused Directories

The following directories are not in use and can be considered for removal:

- `src/service-worker/`
- `src/service-worker-3/`
- `src/tests/core/`

## Knip Analysis Results (Corrected)

After configuring `knip` with the correct entry points for the Chrome Extension, the following is a more accurate list of unused files, dependencies, and exports.

### Unused files (34)
- `src/App.vue`
- `src/core/store/coreStore.ts`
- `src/modules/geminiNano/store/geminiNanoStore.ts`
- `src/modules/mangle/store/mangleStore.ts`
- `src/popup/components/ContentIngestForm.vue`
- `src/popup/components/GoalDisplay.vue`
- `src/popup/components/GuidingQuestions.vue`
- `src/popup/components/KnowledgeBaseList.vue`
- `src/popup/components/KnowledgeSourceItem.vue`
- `src/popup/components/QueryInput.vue`
- `src/popup/components/results/ComparisonTableResult.vue`
- `src/popup/components/results/TextResult.vue`
- `src/popup/components/ResultsDisplay.vue`
- `src/popup/components/ResultsQandA.vue`
- `src/popup/components/SessionHeader.vue`
- `src/popup/views/GeminiNanoPlayground.vue`
- `src/service-worker-2/geminiNano/utils/prompts/prompts.ts`
- `src/service-worker-2/geminiNano/utils/prompts/questionFromGoalGeneration.ts`
- `src/service-worker-2/stores/contentStore.ts`
- `src/service-worker-3/handler/executeQueryHandler.ts`
- `src/service-worker-3/handler/generateMangleSchemaHandler.ts`
- `src/service-worker-3/handler/processNewContentHandler.ts`
- `src/service-worker-3/index.ts`
- `src/service-worker-3/promiseUtils.ts`
- `src/service-worker/geminiNano/geminiNanoService.ts`
- `src/service-worker/geminiNano/utils/prompts/questionFromGoalGeneration.ts`
- `src/service-worker/handlers/contentHandler.ts`
- `src/service-worker/handlers/queryHandler.ts`
- `src/service-worker/handlers/schemaHandler.ts`
- `src/service-worker/handlers/stateHandler.ts`
- `src/service-worker/index.ts`
- `src/service-worker/router.ts`
- `src/service-worker/storage/storage.ts`
- `vitest.config.node.ts`

### Unused dependencies (3)
- `@types/dompurify`
- `dompurify`
- `streaming-markdown`

### Unused devDependencies (1)
- `@vue/test-utils`

### Unused exports (6)
- `convertHotelDataToFacts` in `src/service-worker-2/handlers/hotelDataHandler.ts`
- `hotelRules` in `src/service-worker-2/handlers/hotelDataHandler.ts`
- `hotelQueries` in `src/service-worker-2/handlers/hotelDataHandler.ts`
- `analyzeHotelData` in `src/service-worker-2/handlers/hotelDataHandler.ts`
- `t1` in `src/tests/core/service/exampleData.ts`
- `runMangleInstanceRelative` in `src/tests/modules/mangle/mangleTestUtils.ts`

### Unused exported types (5)
- `ChatComponentExposed` in `src/popup/composables/useMessageStreamer.ts`
- `Source` in `src/popup/store/sessionStore.ts`
- `Result` in `src/popup/store/sessionStore.ts`
- `SessionState` in `src/popup/store/sessionStore.ts`
- `ApiResponse` in `src/types.ts`
