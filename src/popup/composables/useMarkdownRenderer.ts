import { ref } from "vue";
import markdownit from "markdown-it";
import DOMPurify from "dompurify";

const md = markdownit({
    html: true,
    breaks: true,
    linkify: true,
});

export function useMarkdownRenderer() {
    const renderedHtml = ref("");

    const render = (markdownText: string) => {
        const rawHtml = md.render(markdownText);
        renderedHtml.value = DOMPurify.sanitize(rawHtml);
    };

    return {
        renderedHtml,
        render,
    };
}
