import { ref, onMounted, onUnmounted } from "vue";

/**
 * A composable function to determine the type of device (mobile, tablet, or desktop)
 * based on the window's width and to dynamically update the device type on window resize.
 *
 * @returns {Object} An object containing:
 * - {Ref<boolean>} isMobile - Reactive reference indicating if the device is mobile.
 * - {Ref<boolean>} isTablet - Reactive reference indicating if the device is a tablet.
 * - {Ref<boolean>} isDesktop - Reactive reference indicating if the device is a desktop.
 * - {Function} setDeviceWidths - Function to update the maximum widths for mobile and tablet devices.
 */
function readDeviceFlags(mobileMax, tabletMax) {
  if (typeof window === "undefined") {
    return { mobile: false, tablet: false, desktop: true };
  }
  const width = window.innerWidth;
  return {
    mobile: width <= mobileMax,
    tablet: width > mobileMax && width <= tabletMax,
    desktop: width > tabletMax,
  };
}

export default function useDevices() {
  let MOBILE_MAX_WIDTH = 768;
  let TABLET_MAX_WIDTH = 1024;

  const initial = readDeviceFlags(MOBILE_MAX_WIDTH, TABLET_MAX_WIDTH);
  const isMobile = ref(initial.mobile);
  const isTablet = ref(initial.tablet);
  const isDesktop = ref(initial.desktop);

  const updateDeviceType = () => {
    const { mobile, tablet, desktop } = readDeviceFlags(
      MOBILE_MAX_WIDTH,
      TABLET_MAX_WIDTH,
    );
    isMobile.value = mobile;
    isTablet.value = tablet;
    isDesktop.value = desktop;
  };

  /**
   * Updates the maximum width thresholds for mobile and tablet devices
   * and recalculates the device type based on the new thresholds.
   *
   * @param {number} mobileMaxWidth - The maximum width (in pixels) for mobile devices.
   * @param {number} tabletMaxWidth - The maximum width (in pixels) for tablet devices.
   * @returns {void}
   */
  const setDeviceWidths = (mobileMaxWidth, tabletMaxWidth) => {
    MOBILE_MAX_WIDTH = mobileMaxWidth;
    TABLET_MAX_WIDTH = tabletMaxWidth;
    updateDeviceType(); // Recalculate device type after updating widths
  };

  onMounted(() => {
    updateDeviceType();
    window.addEventListener("resize", updateDeviceType);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", updateDeviceType);
  });

  return {
    isMobile,
    isTablet,
    isDesktop,
    setDeviceWidths, // Expose the function to adjust widths
  };
}
