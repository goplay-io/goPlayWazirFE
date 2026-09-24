# Unified Theme System Documentation

## Overview
This project uses a comprehensive unified theme system that supports both light and dark themes with consistent color definitions across the entire application.

## Color Palette

### Primary Colors (Blue)
- **Light Theme**: Blue-600 (#2563eb)
- **Dark Theme**: Blue-400 (#60a5fa)
- Used for: Main actions, primary buttons, brand elements, active states

### Secondary Colors (Green)
- **Light Theme**: Green-600 (#16a34a)
- **Dark Theme**: Green-400 (#4ade80)
- Used for: Success states, secondary actions, positive indicators

### Neutral Colors
- **Range**: 50-900 (from lightest to darkest)
- Used for: Text, backgrounds, borders, surfaces

### Status Colors
- **Error**: Red palette
- **Warning**: Amber/Yellow palette
- **Success**: Same as secondary (green)

## Theme Variables

### Semantic Color Variables
```css
/* Primary Colors */
--color-primary: Main primary color
--color-primary-hover: Hover state for primary
--color-primary-active: Active state for primary
--color-primary-light: Light background for primary

/* Secondary Colors */
--color-secondary: Main secondary color
--color-secondary-hover: Hover state for secondary
--color-secondary-active: Active state for secondary
--color-secondary-light: Light background for secondary

/* Background Colors */
--color-background: Main background
--color-background-alt: Alternative background (slightly darker/lighter)
--color-surface: Card/surface backgrounds
--color-surface-alt: Alternative surface color

/* Text Colors */
--color-text: Primary text color
--color-text-secondary: Secondary text color
--color-text-muted: Muted/helper text color
--color-text-inverse: Inverse text color (for dark backgrounds)

/* Border Colors */
--color-border: Default border color
--color-border-light: Light borders
--color-border-strong: Strong/emphasized borders

/* Special Purpose Surfaces */
--color-nav-deep: Deep blue surface used by the top navigation and compact event cards

/* Status Colors */
--color-error: Error states
--color-warning: Warning states
--color-success: Success states
```

## Tailwind Classes

### Theme-Aware Classes
```css
/* Text Colors */
.tw-text-primary
.tw-text-secondary
.tw-text-theme-text
.tw-text-theme-text-secondary
.tw-text-theme-text-muted

/* Background Colors */
.tw-bg-primary
.tw-bg-secondary
.tw-bg-theme-background
.tw-bg-theme-background-alt
.tw-bg-theme-surface

/* Border Colors */
.tw-border-theme-border
.tw-border-theme-border-strong
```

### Color Scales
Both primary and secondary colors have full 50-900 scales available:
```css
.tw-text-primary-50
.tw-text-primary-100
...
.tw-text-primary-900

.tw-bg-secondary-50
.tw-bg-secondary-100
...
.tw-bg-secondary-900
```

## Usage Examples

### Component Styling
```vue
<template>
  <!-- Card with theme colors -->
  <div class="tw-bg-theme-surface tw-border tw-border-theme-border tw-rounded-lg">
    <h2 class="tw-text-theme-text tw-text-xl tw-font-bold">Title</h2>
    <p class="tw-text-theme-text-secondary">Description text</p>
    
    <!-- Primary button -->
    <button class="tw-bg-primary tw-text-white hover:tw-bg-primary-hover">
      Action
    </button>
    
    <!-- Secondary button -->
    <button class="tw-bg-secondary tw-text-white hover:tw-bg-secondary-hover">
      Secondary Action
    </button>
  </div>
</template>
```

### Status Indicators
```vue
<template>
  <!-- Success badge -->
  <span class="tw-bg-success-100 tw-text-success tw-px-2 tw-py-1 tw-rounded-full">
    Success
  </span>
  
  <!-- Error badge -->
  <span class="tw-bg-error-100 tw-text-error tw-px-2 tw-py-1 tw-rounded-full">
    Error
  </span>
  
  <!-- Warning badge -->
  <span class="tw-bg-warning-100 tw-text-warning tw-px-2 tw-py-1 tw-rounded-full">
    Warning
  </span>
</template>
```

## Theme Store

### Usage
```javascript
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

// Toggle between light and dark
themeStore.toggleTheme()

// Set specific theme
themeStore.setTheme('dark')
themeStore.setTheme('light')

// Check current theme
if (themeStore.isDark) {
  // Dark theme logic
}
```

### Available Methods
- `setTheme(theme)`: Set specific theme ('light' or 'dark')
- `toggleTheme()`: Toggle between light and dark themes

### Available Getters
- `isDark`: Boolean indicating if current theme is dark

## Migration Guide

### From Old System
If you're migrating from the old color system:

1. Replace hardcoded colors with theme variables:
   ```css
   /* Old */
   color: #2563eb;
   background: #ffffff;
   
   /* New */
   color: var(--color-primary);
   background: var(--color-surface);
   ```

2. Update Tailwind classes:
   ```vue
   <!-- Old -->
   <div class="tw-bg-white tw-text-gray-800">
   
   <!-- New -->
   <div class="tw-bg-theme-surface tw-text-theme-text">
   ```

3. Use semantic color names:
   ```vue
   <!-- Old -->
   <button class="tw-bg-blue-600 hover:tw-bg-blue-700">
   
   <!-- New -->
   <button class="tw-bg-primary hover:tw-bg-primary-hover">
   ```

## Best Practices

1. **Always use semantic variables** instead of hardcoded colors
2. **Use theme-aware classes** for consistent theming
3. **Test both themes** when implementing new components
4. **Use appropriate contrast ratios** for accessibility
5. **Follow the color hierarchy**: primary > secondary > neutral

## Components Updated
- ✅ Sidebar.vue
- ✅ Header.vue
- ✅ Layout.vue
- ✅ Featured.vue
- ✅ ThemeToggle.vue
- ✅ App.vue

## Backward Compatibility
The system maintains backward compatibility with legacy CSS variables:
- `--bg-main` → `--color-background`
- `--text-light1` → `--color-text`
- `--button-light` → `--color-primary`

These will continue to work but should be migrated to the new system over time.
