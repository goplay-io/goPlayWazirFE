<template>
  <div class="border-lightgreen tw-bg-theme-surface-alt tw-border tw-border-theme-border tw-rounded-2xl tw-p-3 sm:tw-p-4 tw-shadow-sm">
    <div class="tw-flex tw-justify-between tw-items-center tw-mb-3 sm:tw-mb-4">
      <h3 class="tw-text-base sm:tw-text-lg tw-font-semibold tw-text-theme-text">{{ t('wallet.charts.profitLossAnnually') }}</h3>
    </div>
    <div class="chart-container">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Props
const props = defineProps({
  profitData: {
    type: Array,
    default: () => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  lossData: {
    type: Array,
    default: () => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  }
})

// Helper functions
const getThemeColor = (cssVar, fallback) => {
  if (typeof window !== 'undefined') {
    const rootStyles = getComputedStyle(document.documentElement)
    return rootStyles.getPropertyValue(cssVar).trim() || fallback
  }
  return fallback
}

const isDarkTheme = () => {
  if (typeof window !== 'undefined') {
    return document.documentElement.getAttribute('data-theme') === 'dark'
  }
  return false
}

// Computed properties
const chartData = computed(() => {
  return {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: t('wallet.charts.profit'),
        data: props.profitData,
        borderColor: 'rgba(16, 185, 129, 1)', // Green for profit - matching deposits
        backgroundColor: 'rgba(16, 185, 129, 0.2)', // Green with 20% opacity
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
        pointBorderColor: 'rgba(16, 185, 129, 1)',
        pointRadius: 5,
        pointHoverRadius: 7
      },
      {
        label: t('wallet.charts.loss'),
        data: props.lossData,
        borderColor: 'rgba(239, 68, 68, 1)', // Red for loss - matching withdrawals
        backgroundColor: 'rgba(239, 68, 68, 0.2)', // Red with 20% opacity
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(239, 68, 68, 1)',
        pointBorderColor: 'rgba(239, 68, 68, 1)',
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  }
})

const chartOptions = computed(() => {
  const textColor = isDarkTheme() 
    ? getThemeColor('--neutral-300', '#d1d5db')
    : getThemeColor('--neutral-600', '#4b5563')
  
  const gridColor = isDarkTheme()
    ? getThemeColor('--neutral-700', '#374151')
    : getThemeColor('--neutral-200', '#e5e7eb')

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: textColor,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: window.innerWidth < 640 ? 11 : 12
          },
          padding: window.innerWidth < 640 ? 8 : 12
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: isDarkTheme() ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: getThemeColor('--primary-500', '#3b82f6'),
        borderWidth: 1,
        titleFont: {
          size: window.innerWidth < 640 ? 11 : 12
        },
        bodyFont: {
          size: window.innerWidth < 640 ? 10 : 11
        },
        padding: window.innerWidth < 640 ? 8 : 12,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: textColor,
          font: {
            size: window.innerWidth < 640 ? 10 : 11
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        ticks: {
          color: textColor,
          font: {
            size: window.innerWidth < 640 ? 10 : 11
          },
          callback: function(value) {
            return Number(value).toLocaleString(undefined, {
              maximumFractionDigits: 0
            })
          }
        },
        grid: {
          color: isDarkTheme() 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
          lineWidth: 1
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }
})
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 220px;
  width: 100%;
}

@media (min-width: 640px) {
  .chart-container {
    height: 260px;
  }
}

@media (min-width: 1024px) {
  .chart-container {
    height: 300px;
  }
}
</style>
