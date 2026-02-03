<template>
  <div class="app">
    <IpLookupCard />
  </div>
</template>

<script setup lang="ts">
import IpLookupCard from './components/IpLookupCard.vue'
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
</style>
