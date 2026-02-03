<template>
  <button class="add-button" @click="$emit('click')">+ Add</button>
</template>

<script setup lang="ts">
defineEmits<{
  click: [];
}>();
</script>

<style scoped>
.add-button {
  background-color: #00bcd4;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: #00acc1;
  }

  &:active {
    background-color: #0097a7;
  }
}
</style>
