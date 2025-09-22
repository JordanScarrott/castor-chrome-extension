<template>
    <div class="container">
        <h1>Mangle Extension</h1>
        <p>Hello, Mangle!</p>

        <textarea
            v-model="newContent"
            placeholder="Enter content to process..."
        ></textarea>
        <button @click="handleSubmitContent">Submit Content</button>
        <hr />

        isWasmLoaded: {{ isWasmLoaded }}

        <!-- <input v-model="inputText" />
        <button @click="summarize">Summarize</button>
        <button @click="prompt">Prompt</button>
        <button @click="summarizeStreaming">Summarize (Streaming)</button>
        <button @click="promptStreaming">Prompt (Streaming)</button>
        <button @click="ingestIntoMangle">Ingest</button>

        <input v-model="mangleInput" />
        <button @click="executeMangleQuery">Execute Mangle Query</button>
        <div>Mangle output: {{ mangleOutput }}</div>

        <div>output: {{ output }}</div>
        <div id="streaming-output"></div> -->
    </div>
</template>

<script setup lang="ts">
import { usePrompt } from "@/service-worker/geminiNano/composables/geminiNanoComposable";
import { useMangle } from "@/modules/mangle/composables/useMangle";
import {
    manglePrompt,
    MangleSchemaProperties,
} from "@/service-worker/geminiNano/utils/prompts/prompts";
import { geminiNanoService } from "@/modules/geminiNano/service/geminiNanoService";
import DOMPurify from "dompurify";
import * as smd from "streaming-markdown";
import { ref } from "vue";
import { serviceWorkerApi } from "./popup/api";

const newContent = ref("");

async function handleSubmitContent() {
    if (!newContent.value) return;
    try {
        const response = await serviceWorkerApi.processNewContent(
            newContent.value
        );
        console.log("API Response:", response); // Should log { status: 'QUEUED' }
        alert("Content submitted for processing!");
        newContent.value = "";
    } catch (error) {
        console.error("API Error:", error);
        alert("Failed to submit content.");
    }
}

// No script logic needed for this simple component yet.

const count = ref(0);

const inputText = ref("");
const output = ref("");
const jsonFacts = ref<string | MangleSchemaProperties>({
    facts: [],
    rules: [],
});

const { isWasmLoaded, mangle, mangledText } = useMangle();

async function summarize() {
    output.value = await geminiNanoService.summarize(inputText.value);
}

async function prompt() {
    jsonFacts.value = await usePrompt().prompt(inputText.value);

    output.value = JSON.stringify(jsonFacts.value);
}

async function summarizeStreaming() {
    const streamingOutput = document.getElementById("streaming-output");
    if (streamingOutput) {
        streamingOutput.innerHTML = "";
        const renderer = smd.default_renderer(streamingOutput);
        const parser = smd.parser(renderer);
        await geminiNanoService.summarizeStreaming(inputText.value, (chunk) => {
            const sanitizedChunk = DOMPurify.sanitize(chunk);
            smd.parser_write(parser, sanitizedChunk);
        });
        smd.parser_end(parser);
    }
}

async function promptStreaming() {
    const streamingOutput = document.getElementById("streaming-output");
    if (streamingOutput) {
        streamingOutput.innerHTML = "";
        const renderer = smd.default_renderer(streamingOutput);
        const parser = smd.parser(renderer);
        await geminiNanoService.askPromptStreaming(
            inputText.value,
            manglePrompt().systemPrompt,
            (chunk) => {
                const sanitizedChunk = DOMPurify.sanitize(chunk);
                smd.parser_write(parser, sanitizedChunk);
            }
        );
        smd.parser_end(parser);
    }
}

async function ingestIntoMangle() {
    console.log("Mangle facts: ", jsonFacts.value);

    const parsedMangleData = parseMangleQuery(jsonFacts.value);

    const factToWriteToMangle = parsedMangleData.facts.at(0) || "";
    console.log(
        "🚀 ~ ingestIntoMangle ~ factToWriteToMangle:",
        factToWriteToMangle
    );
    mangle(factToWriteToMangle);
}

function parseMangleQuery(
    mangleData: string | MangleSchemaProperties
): MangleSchemaProperties {
    let parsedMangleData: MangleSchemaProperties = {
        facts: [],
        rules: [],
    };

    if (typeof mangleData === "string") {
        try {
            parsedMangleData = JSON.parse(mangleData);
        } catch (e) {
            throw new Error(
                "Failed to parse gemini-generated mangle facts: " + e
            );
        }
    } else {
        return mangleData;
    }

    return parsedMangleData;
}

const mangleInput = ref("");
const mangleOutput = ref("");
function executeMangleQuery(): void {
    console.log("🚀 ~ mangleInput:", mangleInput);

    mangleOutput.value = mangle(mangleInput.value);

    console.log("🚀 ~ mangleOutput:", mangleOutput);
}
</script>

<style scoped>
.container {
    overflow: auto;
    width: 300px;
    padding: 1rem;
    text-align: center;
    font-family: sans-serif;
}
</style>
