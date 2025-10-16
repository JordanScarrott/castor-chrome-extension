import Chat from "@/popup/components/Chat.vue";
import { onMounted, Ref } from "vue";

export function useAnalysisDemo(
    chatComponent: Ref<InstanceType<typeof Chat> | null>
) {
    // --- DEMO LIFECYCLE FOR ANALYSIS CARD ---
    // This is a stand-in for a real data stream from the service worker
    function runAnalysisDemo() {
        const analysisId = `analysis-${Date.now()}`;
        const topic = "Hotels near the Eiffel Tower";

        // 1. Add the card
        chatComponent.value?.addAnalysisCard(analysisId, topic);

        // 2. Update it with "ideas"
        const ideas = [
            "Pullman Paris Tour Eiffel",
            "Mercure Paris Centre Tour Eiffel",
            "Shangri-La Hotel Paris",
            "Hôtel Le Derby Alma",
        ];

        let ideaIndex = 0;
        const interval = setInterval(() => {
            if (ideaIndex < ideas.length) {
                chatComponent.value?.updateAnalysisCard(
                    analysisId,
                    ideas[ideaIndex]
                );
                ideaIndex++;
            } else {
                // 3. Complete the analysis
                clearInterval(interval);
                chatComponent.value?.completeAnalysisCard(analysisId);
            }
        }, 1000);
    }

    onMounted(() => {
        runAnalysisDemo();
    });

    return { runAnalysisDemo };
}
