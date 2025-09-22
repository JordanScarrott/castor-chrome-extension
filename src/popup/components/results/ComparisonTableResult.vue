<template>
  <div class="table-result">
    <table class="comparison-table">
      <thead>
        <tr>
          <th v-for="header in data.headers" :key="header">{{ header }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in data.rows" :key="index">
          <td v-for="cell in row" :key="cell">{{ cell }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: {
    headers: string[];
    rows: string[][];
  };
}>();
</script>

<style scoped>
.table-result {
  overflow-x: auto;
}
.comparison-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.comparison-table th,
.comparison-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
.comparison-table th {
  background-color: #f2f2f2;
  font-weight: bold;
}
.comparison-table tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}
</style>
