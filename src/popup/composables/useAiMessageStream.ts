import { onMounted, onUnmounted, ref } from "vue";

type StreamUpdater = (chunk: string) => void;

export function useAiMessageStream(streamUpdaterFactory: (messageId: any) => StreamUpdater | undefined) {
    const isLoading = ref(false);
    const streamHandlers = new Map<string, StreamUpdater>();

    const handleStreamUpdate = (message: any) => {
        if (message.type !== "STREAM_UPDATE") {
            return;
        }
        const { messageId, chunk, isLast } = message.payload;

        let handler = streamHandlers.get(messageId);

        if (!handler) {
            const streamUpdater = streamUpdaterFactory(messageId);
            if (!streamUpdater) {
                return;
            }
            handler = streamUpdater;
            streamHandlers.set(messageId, handler);
            isLoading.value = false;
        }

        if (chunk) {
            handler(chunk);
        }

        if (isLast) {
            streamHandlers.delete(messageId);
        }
    };

    onMounted(() => {
        chrome.runtime.onMessage.addListener(handleStreamUpdate);
    });

    onUnmounted(() => {
        chrome.runtime.onMessage.removeListener(handleStreamUpdate);
    });

    function startLoading() {
        isLoading.value = true;
    }

    function stopLoading() {
        isLoading.value = false;
    }

    return {
        isLoading,
        startLoading,
        stopLoading,
    };
}
