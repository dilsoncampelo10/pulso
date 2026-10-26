<template>
  <div class="screen loading" role="status">
    <span class="spinner" aria-hidden="true"></span>
    <span>Carregando…</span>
  </div>
</template>

<style scoped>
.loading {
  justify-content: center;
  gap: 14px;
  color: var(--muted);
  font-size: 14px;
}
.spinner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid rgba(155, 92, 255, 0.3);
  border-top-color: var(--cyan);
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation-duration: 2.4s;
  }
}
</style>
