// Use a single, consistent theme color (no random/cycling colors)
// Vuetify theme variables are exposed as: --v-theme-primary: r,g,b
const THEME_PRIMARY = 'rgb(var(--v-theme-primary))'

const CARD_COLORS = [
  {
    gradientFrom: THEME_PRIMARY,
    gradientTo: THEME_PRIMARY,
    name: 'Primary',
  },
]

export function useCompetitionCards() {
  /**
   * Assigns colors to competitions in sequence
   * @param {Array} competitions - Array of competition objects
   * @returns {Array} Array of competitions with assigned colors
   */
  const assignColorsToCompetitions = (competitions) => {
    if (!Array.isArray(competitions)) {
      return [];
    }

    return competitions.map((competition, index) => {
      const colorIndex = index % CARD_COLORS.length;
      const colorScheme = CARD_COLORS[colorIndex];
      
      return {
        ...competition,
        colorScheme: {
          gradientFrom: colorScheme.gradientFrom,
          gradientTo: colorScheme.gradientTo,
          name: colorScheme.name
        }
      };
    });
  };

  /**
   * Get all available color schemes
   * @returns {Array} Array of all color schemes
   */   
  const getAllColorSchemes = () => {
    return [...CARD_COLORS];
  };

  /**
   * Get a specific color scheme by index
   * @param {number} index - Index of the color scheme
   * @returns {Object|null} Color scheme object or null if index is invalid
   */
  const getColorSchemeByIndex = (index) => {
    if (index >= 0 && index < CARD_COLORS.length) {
      return CARD_COLORS[index];
    }
    return null;
  };

  return {
    assignColorsToCompetitions,
    getAllColorSchemes,
    getColorSchemeByIndex,
    CARD_COLORS
  };
}
