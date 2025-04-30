# Origin Configuration System

This directory contains the centralized origin-specific configuration system. The files in this directory are:

## Directory Structure

- `index.ts` - Exports all utilities and types from the origin module
- `types.ts` - Type definitions for origin-related configurations
- `utils.ts` - Utility functions for working with origins
- `config.ts` - Origin-specific configurations
- `theme-utils.ts` - Theme-related utilities for setting/getting themes

## Configuration Structure

The configuration follows this structure:

```typescript
export const originConfig: OriginConfigMap = {
  firstParty: {
    metadata: { ... },
    brandLogo: { ... },
  },
  thirdParty: {
    '0x.city': {
      metadata: { ... },
      brandLogo: { ... },
    },
    'defi.build': {
      // ...
    },
  },
};
```

## Usage

The `index.ts` file exports utility functions to access specific parts of the configuration:

- `getOriginConfig(origin)`: Get the full configuration for a specific origin

## Theme System

The theme system is CSS-based and uses Tailwind CSS v4's `@theme` directive combined with CSS attribute selectors:

1. Base theme variables are defined in the `@theme {}` block in `globals.css`
2. Theme-specific overrides are defined in `@layer theme {}` with `[data-theme="theme-name"]` selectors
3. Theme switching is done by setting the `data-theme` attribute on the `<html>` element

### Themed Properties

Currently, only the following brand-related properties are themed:

- `--color-brand-primary`: Primary brand color
- `--color-brand-secondary`: Secondary brand color
- `--color-brand-tertiary`: Tertiary brand color

All other properties (like background colors, text colors, etc.) remain consistent across themes.

### Theme Utilities

The `theme-utils.ts` file provides functions for working with themes:

- `setTheme(theme)`: Set the current theme by changing the data-theme attribute
- `getTheme()`: Get the current theme from the data-theme attribute
- `originToTheme(origin)`: Convert an origin domain to a theme name
- `getThemeFromOrigin(thirdPartyOrigin)`: Map a third-party origin to its theme name

## Adding New Origins

To add support for a new origin:

1. Add the domain to the appropriate environment variables in `env/schema.ts`
2. Add a new entry to the `thirdParty` object in `config.ts` with:
   - Metadata configuration
   - Brand logo information
3. Add a new theme in `globals.css` under the `@layer theme {}` section:

   ```css
   [data-theme="new-theme-name"] {
     --color-brand-primary: #your-brand-color;
     --color-brand-secondary: #your-secondary-color;
     --color-brand-tertiary: #your-tertiary-color;
   }
   ```

4. Add the corresponding logo image to the `public/logos` directory
