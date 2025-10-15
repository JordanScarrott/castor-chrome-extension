<template>
    <div v-html="renderedHtml"></div>
</template>

<script setup lang="ts">
import { watchEffect } from "vue";
import { useMarkdownRenderer } from "../composables/useMarkdownRenderer";

interface Props {
    stream: string;
}

const props = defineProps<Props>();

const { renderedHtml, render } = useMarkdownRenderer();

watchEffect(() => {
    render(props.stream);
});
</script>

<style scoped>
/* Scoped styles for the rendered markdown */
:deep(h1),
:deep(h2),
:deep(h3) {
    font-size: 1.2em;
    font-weight: 600;
    margin-top: 1em;
    margin-bottom: 0.5em;
}

:deep(p) {
    margin-bottom: 1em;
    line-height: 1.6;
    white-space: normal; /* Override the pre-wrap from parent */
}

:deep(ul),
:deep(ol) {
    margin-bottom: 1em;
    padding-left: 2em;
}

:deep(li) {
    margin-bottom: 0.5em;
}

:deep(code) {
    background-color: #e8eaed;
    color: #202124;
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier,
        monospace;
    font-size: 0.9em;
}

:deep(pre) {
    background-color: #f8f9fa;
    border: 1px solid #e8eaed;
    border-radius: 6px;
    padding: 12px;
    overflow-x: auto;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier,
        monospace;
    font-size: 0.9em;
}

:deep(pre) code {
    background-color: transparent;
    padding: 0;
    border-radius: 0;
}

:deep(blockquote) {
    border-left: 3px solid #dcdfe2;
    margin: 1em 0;
    padding-left: 1em;
    color: #5f6368;
    font-style: italic;
}
</style>
