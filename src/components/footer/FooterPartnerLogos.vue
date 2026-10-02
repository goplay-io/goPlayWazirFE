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
  gap: 20px 8px;
  place-items: center;
  width: 100%;
  padding: 0 8px;
  box-sizing: border-box;
}

@media (min-width: 1024px) {
  .footer-partner-logos {
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 20px 16px;
  }
}

.footer-partner-logos__img {
  display: block;
  width: 100%;
  max-width: 168px;
  height: 34px;
  object-fit: contain;
  opacity: 1;
  filter: brightness(0) invert(1);
}

@media (min-width: 768px) {
  .footer-partner-logos__img {
    max-width: 160px;
    height: 40px;
  }
}
</style>
