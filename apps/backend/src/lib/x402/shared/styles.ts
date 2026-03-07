/**
 * Shared styles for x402 paywall system
 */

import type { ThemeConfig } from './types';
import { NAMEFI_THEME } from './constants';

/**
 * Generates the Tailwind CDN script with custom theme configuration
 */
export function getTailwindScript(theme: ThemeConfig = NAMEFI_THEME): string {
  return `
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            background: '${theme.background}',
            card: '${theme.card}',
            foreground: '${theme.foreground}',
            muted: '${theme.muted}',
            'brand-primary': '${theme.brandPrimary}',
            'brand-primary-hover': '${theme.brandPrimaryHover}',
            destructive: '${theme.destructive}',
            border: '${theme.border}',
          },
          borderRadius: {
            DEFAULT: '${theme.borderRadius || '0.65rem'}',
          }
        }
      }
    }
  </script>`;
}

/**
 * Generates the base CSS styles (fonts, animations)
 */
export function getBaseStyles(): string {
  return `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    .spinner {
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>`;
}
