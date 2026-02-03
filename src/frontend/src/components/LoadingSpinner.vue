<template>
  <div class="loading-spinner"></div>
</template>

<style scoped>
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px dashed #666;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
