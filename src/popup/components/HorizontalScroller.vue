<template>
    <div class="horizontal-scroller">
        <button
            v-if="canScrollLeft"
            @click="scrollLeft"
            class="scroll-arrow left"
        >
            &lt;
        </button>
        <div ref="scrollContainer" class="scroll-container">
            <slot></slot>
        </div>
        <button
            v-if="canScrollRight"
            @click="scrollRight"
            class="scroll-arrow right"
        >
            &gt;
        </button>
    </div>
</template>

<script setup lang="ts">
import { useHorizontalScroll } from "../composables/useHorizontalScroll";

const {
    scrollContainer,
    canScrollLeft,
    canScrollRight,
    scrollLeft,
    scrollRight,
} = useHorizontalScroll();
</script>

<style scoped>
.horizontal-scroller {
    position: relative;
    display: flex;
    align-items: center;
}

.scroll-container {
    display: flex;
    overflow-x: auto;
    scrollbar-width: none; /* For Firefox */
    -ms-overflow-style: none; /* For Internet Explorer and Edge */
    padding: 8px 0;
    width: 100%;
    gap: 8px;
}

.scroll-container::-webkit-scrollbar {
    display: none; /* For Chrome, Safari, and Opera */
}

.scroll-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    background-color: white;
    border: 1px solid #dcdfe2;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.scroll-arrow.left {
    left: -16px;
}

.scroll-arrow.right {
    right: -16px;
}
</style>
