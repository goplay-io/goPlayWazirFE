<script setup>
const logos = [
  { src: '/svg/footer-icons/upi-icon.svg', alt: 'Payment partner 1' },
  { src: '/svg/footer-icons/bank-transfer-icon.svg', alt: 'Payment partner 2' },
  { src: '/svg/footer-icons/be-gamble-aware-icon.svg', alt: 'Responsible gaming partner 1' },
  { src: '/svg/footer-icons/malta-gaming-authority.svg', alt: 'Compliance partner 1' },
  { src: '/svg/footer-icons/e-cogra-icon.svg', alt: 'Compliance partner 2' },
  { src: '/svg/footer-icons/gambling-commission-icon.svg', alt: 'Responsible gaming partner 2' },
]
</script>

<template>
  <div class="footer-partner-logos">
    <img
      v-for="logo in logos"
      :key="logo.alt"
      :src="logo.src"
      :alt="logo.alt"
      class="footer-partner-logos__img"
      loading="lazy"
    />
  </div>
</template>

<style scoped>
.footer-partner-logos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 12px;
  place-items: center;
  width: 100%;
  padding: 0 12px;
  box-sizing: border-box;
}

@media (min-width: 1024px) {
  .footer-partner-logos {
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 20px 16px;
    padding: 0 8px;
  }
}

.footer-partner-logos__img {
  width: auto;
  max-width: 148px;
  height: 30px;
  object-fit: contain;
  /* Match reference muted grey logos on dark charcoal */
  opacity: 0.72;
  filter: grayscale(0.15) brightness(0.92);
}

@media (min-width: 768px) {
  .footer-partner-logos__img {
    height: 36px;
    opacity: 0.8;
    filter: none;
  }
}
</style>
