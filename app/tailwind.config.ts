import type { Config } from 'tailwindcss';

/**
 * Every value here points at a CSS custom property from src/styles/tokens.css.
 * The default Tailwind palette is switched off on purpose: `text-gray-500`,
 * `bg-white`, `bg-blue-600` … produce no CSS, so a wrong class is visible at once.
 * Opacity modifiers (`bg-accent/50`) do not work with these colours — use a token.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Dark styles come from the tokens alone; `dark:` variants are not needed.
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      nav: '900px', // below this the app sidebar becomes a drawer
      lg: '1024px',
      xl: '1280px',
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      bg: 'var(--bg)',
      surface: 'var(--surface)',
      'surface-2': 'var(--surface-2)',
      'surface-3': 'var(--surface-3)',
      raised: 'var(--raised)',
      'raised-hover': 'var(--raised-hover)',
      border: 'var(--border)',
      'border-strong': 'var(--border-strong)',
      fg: 'var(--fg)',
      'fg-muted': 'var(--fg-muted)',
      'fg-subtle': 'var(--fg-subtle)',
      accent: 'var(--accent)',
      'accent-hover': 'var(--accent-hover)',
      'accent-fg': 'var(--accent-fg)',
      'accent-soft': 'var(--accent-soft)',
      'accent-soft-fg': 'var(--accent-soft-fg)',
      success: 'var(--success)',
      'success-soft': 'var(--success-soft)',
      warning: 'var(--warning)',
      'warning-soft': 'var(--warning-soft)',
      danger: 'var(--danger)',
      'danger-hover': 'var(--danger-hover)',
      'danger-solid': 'var(--danger-solid)',
      'danger-solid-hover': 'var(--danger-solid-hover)',
      'danger-fg': 'var(--danger-fg)',
      'danger-soft': 'var(--danger-soft)',
      info: 'var(--info)',
      'info-soft': 'var(--info-soft)',
      inverse: 'var(--inverse)',
      'inverse-fg': 'var(--inverse-fg)',
      'widget-fg': 'var(--widget-fg)',
      'widget-surface': 'var(--widget-surface)',
      'widget-surface-2': 'var(--widget-surface-2)',
      'widget-text': 'var(--widget-text)',
      'widget-muted': 'var(--widget-muted)',
      'widget-border': 'var(--widget-border)',
      'widget-border-strong': 'var(--widget-border-strong)',
      'widget-default': 'var(--widget-default)',
      overlay: 'var(--overlay)',
      ring: 'var(--ring)',
    },
    fontFamily: {
      display: 'var(--font-display)',
      sans: 'var(--font-sans)',
      mono: 'var(--font-mono)',
    },
    fontSize: {
      xs: ['var(--text-xs)', { lineHeight: 'var(--leading-xs)' }],
      sm: ['var(--text-sm)', { lineHeight: 'var(--leading-sm)' }],
      base: ['var(--text-base)', { lineHeight: 'var(--leading-base)' }],
      md: ['var(--text-md)', { lineHeight: 'var(--leading-md)' }],
      lg: ['var(--text-lg)', { lineHeight: 'var(--leading-lg)' }],
      xl: ['var(--text-xl)', { lineHeight: 'var(--leading-xl)' }],
      '2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-2xl)' }],
      '3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-3xl)' }],
      '4xl': ['var(--text-4xl)', { lineHeight: 'var(--leading-4xl)' }],
    },
    borderRadius: {
      none: '0',
      sm: 'var(--radius-sm)',
      DEFAULT: 'var(--radius)',
      lg: 'var(--radius-lg)',
      full: '9999px',
    },
    boxShadow: {
      none: 'none',
      xs: 'var(--shadow-xs)',
      md: 'var(--shadow-md)',
      lg: 'var(--shadow-lg)',
    },
    extend: {
      maxWidth: {
        content: '72rem', // app content column
        prose: '42rem', // forms and reading text
      },
      spacing: {
        gutter: 'var(--gutter)',
        sidebar: '15rem',
        topbar: '3.5rem',
      },
      keyframes: {
        'wave-bar': {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'skeleton-pulse': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.45' } },
        spin: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        'wave-bar': 'wave-bar 1.1s ease-in-out infinite',
        'fade-in': 'fade-in 140ms ease-out',
        'rise-in': 'rise-in 160ms ease-out',
        'slide-in-left': 'slide-in-left 200ms ease-out',
        'skeleton-pulse': 'skeleton-pulse 1.6s ease-in-out infinite',
        spin: 'spin 700ms linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
