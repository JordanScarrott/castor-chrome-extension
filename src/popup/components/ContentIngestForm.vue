<template>
  <div class="content-ingest-form">
    <label for="knowledge-input">Add to Knowledge Base</label>
    <textarea
      id="knowledge-input"
      v-model="content"
      placeholder="Paste text, specs, or notes here..."
    ></textarea>
    <button @click="handleSubmit">Add</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const content = ref('');

const emit = defineEmits(['ingest-content']);

const handleSubmit = () => {
  if (content.value.trim()) {
    emit('ingest-content', content.value);
    content.value = '';
  }
};
</script>

<style scoped>
.content-ingest-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

label {
  font-weight: bold;
  font-size: 0.9rem;
}

textarea {
  width: 100%;
  min-height: 80px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
}

button {
  align-self: flex-end;
  padding: 8px 16px;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}
</style>
