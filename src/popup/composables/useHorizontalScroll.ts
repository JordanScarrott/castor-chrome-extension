import { ref, onMounted, onUnmounted, computed } from "vue";

export function useHorizontalScroll() {
    const scrollContainer = ref<HTMLElement | null>(null);
    const canScrollLeft = ref(false);
    const canScrollRight = ref(false);

    const checkScrollability = () => {
        if (!scrollContainer.value) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value;
        // Add a tolerance of 1px to account for floating point inaccuracies
        canScrollLeft.value = scrollLeft > 1;
        canScrollRight.value = scrollWidth - clientWidth - scrollLeft > 1;
    };

    const scrollLeft = () => {
        if (!scrollContainer.value) return;
        scrollContainer.value.scrollBy({ left: -200, behavior: "smooth" });
    };

    const scrollRight = () => {
        if (!scrollContainer.value) return;
        scrollContainer.value.scrollBy({ left: 200, behavior: "smooth" });
    };

    onMounted(() => {
        if (scrollContainer.value) {
            scrollContainer.value.addEventListener("scroll", checkScrollability);
            window.addEventListener("resize", checkScrollability);
            // Initial check
            checkScrollability();
            // Check again after content has loaded
            setTimeout(checkScrollability, 100);
        }
    });

    onUnmounted(() => {
        if (scrollContainer.value) {
            scrollContainer.value.removeEventListener(
                "scroll",
                checkScrollability
            );
            window.removeEventListener("resize", checkScrollability);
        }
    });

    return {
        scrollContainer,
        canScrollLeft: computed(() => canScrollLeft.value),
        canScrollRight: computed(() => canScrollRight.value),
        scrollLeft,
        scrollRight,
        checkScrollability,
    };
}
