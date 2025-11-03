export type ThemeColor = 'blue' | 'green' | 'red' | 'orange' | 'teal' | 'cyan';
export type ThemeMode = 'light' | 'dark';

export interface Theme {
  color: ThemeColor;
  mode: ThemeMode;
}

const THEME_STORAGE_KEY = 'hilos-theme';

const COLOR_SCHEMES = {
  blue: {
    light: {
      primary: 'bg-blue-600',
      primaryHover: 'hover:bg-blue-700',
      primaryText: 'text-blue-600',
      primaryBorder: 'border-blue-600',
      primaryFocus: 'focus:ring-blue-500',
      secondary: 'bg-blue-50',
      secondaryText: 'text-blue-700',
      accent: 'bg-blue-100',
    },
    dark: {
      primary: 'bg-blue-500',
      primaryHover: 'hover:bg-blue-600',
      primaryText: 'text-blue-400',
      primaryBorder: 'border-blue-500',
      primaryFocus: 'focus:ring-blue-400',
      secondary: 'bg-blue-900',
      secondaryText: 'text-blue-300',
      accent: 'bg-blue-800',
    },
  },
  green: {
    light: {
      primary: 'bg-green-600',
      primaryHover: 'hover:bg-green-700',
      primaryText: 'text-green-600',
      primaryBorder: 'border-green-600',
      primaryFocus: 'focus:ring-green-500',
      secondary: 'bg-green-50',
      secondaryText: 'text-green-700',
      accent: 'bg-green-100',
    },
    dark: {
      primary: 'bg-green-500',
      primaryHover: 'hover:bg-green-600',
      primaryText: 'text-green-400',
      primaryBorder: 'border-green-500',
      primaryFocus: 'focus:ring-green-400',
      secondary: 'bg-green-900',
      secondaryText: 'text-green-300',
      accent: 'bg-green-800',
    },
  },
  red: {
    light: {
      primary: 'bg-red-600',
      primaryHover: 'hover:bg-red-700',
      primaryText: 'text-red-600',
      primaryBorder: 'border-red-600',
      primaryFocus: 'focus:ring-red-500',
      secondary: 'bg-red-50',
      secondaryText: 'text-red-700',
      accent: 'bg-red-100',
    },
    dark: {
      primary: 'bg-red-500',
      primaryHover: 'hover:bg-red-600',
      primaryText: 'text-red-400',
      primaryBorder: 'border-red-500',
      primaryFocus: 'focus:ring-red-400',
      secondary: 'bg-red-900',
      secondaryText: 'text-red-300',
      accent: 'bg-red-800',
    },
  },
  orange: {
    light: {
      primary: 'bg-orange-600',
      primaryHover: 'hover:bg-orange-700',
      primaryText: 'text-orange-600',
      primaryBorder: 'border-orange-600',
      primaryFocus: 'focus:ring-orange-500',
      secondary: 'bg-orange-50',
      secondaryText: 'text-orange-700',
      accent: 'bg-orange-100',
    },
    dark: {
      primary: 'bg-orange-500',
      primaryHover: 'hover:bg-orange-600',
      primaryText: 'text-orange-400',
      primaryBorder: 'border-orange-500',
      primaryFocus: 'focus:ring-orange-400',
      secondary: 'bg-orange-900',
      secondaryText: 'text-orange-300',
      accent: 'bg-orange-800',
    },
  },
  teal: {
    light: {
      primary: 'bg-teal-600',
      primaryHover: 'hover:bg-teal-700',
      primaryText: 'text-teal-600',
      primaryBorder: 'border-teal-600',
      primaryFocus: 'focus:ring-teal-500',
      secondary: 'bg-teal-50',
      secondaryText: 'text-teal-700',
      accent: 'bg-teal-100',
    },
    dark: {
      primary: 'bg-teal-500',
      primaryHover: 'hover:bg-teal-600',
      primaryText: 'text-teal-400',
      primaryBorder: 'border-teal-500',
      primaryFocus: 'focus:ring-teal-400',
      secondary: 'bg-teal-900',
      secondaryText: 'text-teal-300',
      accent: 'bg-teal-800',
    },
  },
  cyan: {
    light: {
      primary: 'bg-cyan-600',
      primaryHover: 'hover:bg-cyan-700',
      primaryText: 'text-cyan-600',
      primaryBorder: 'border-cyan-600',
      primaryFocus: 'focus:ring-cyan-500',
      secondary: 'bg-cyan-50',
      secondaryText: 'text-cyan-700',
      accent: 'bg-cyan-100',
    },
    dark: {
      primary: 'bg-cyan-500',
      primaryHover: 'hover:bg-cyan-600',
      primaryText: 'text-cyan-400',
      primaryBorder: 'border-cyan-500',
      primaryFocus: 'focus:ring-cyan-400',
      secondary: 'bg-cyan-900',
      secondaryText: 'text-cyan-300',
      accent: 'bg-cyan-800',
    },
  },
};

export const themeService = {
  getTheme(): Theme {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { color: 'blue', mode: 'light' };
      }
    }
    return { color: 'blue', mode: 'light' };
  },

  setTheme(theme: Theme): void {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    this.applyTheme(theme);
  },

  applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return;

    try {
      const root = document.documentElement;
      const body = document.body;

      if (!root || !body) return;

      if (theme.mode === 'dark') {
        if (root.classList) root.classList.add('dark');
        if (body.classList) body.classList.add('dark');
        if (body.style) {
          body.style.backgroundColor = '#111827';
          body.style.color = '#f3f4f6';
        }
      } else {
        if (root.classList) root.classList.remove('dark');
        if (body.classList) body.classList.remove('dark');
        if (body.style) {
          body.style.backgroundColor = '#f9fafb';
          body.style.color = '#111827';
        }
      }

      if (root.setAttribute) {
        root.setAttribute('data-theme-color', theme.color);
        root.setAttribute('data-theme-mode', theme.mode);
      }

      const colorMap: Record<ThemeColor, { light: string; dark: string }> = {
        blue: { light: '#2563eb', dark: '#3b82f6' },
        green: { light: '#16a34a', dark: '#22c55e' },
        red: { light: '#dc2626', dark: '#ef4444' },
        orange: { light: '#ea580c', dark: '#f97316' },
        teal: { light: '#0d9488', dark: '#14b8a6' },
        cyan: { light: '#0891b2', dark: '#06b6d4' },
      };

      const primaryColor = theme.mode === 'dark' ? colorMap[theme.color].dark : colorMap[theme.color].light;
      if (root.style && root.style.setProperty) {
        root.style.setProperty('--primary-color', primaryColor);
      }
    } catch (error) {
      console.warn('Error applying theme:', error);
    }
  },

  getColorScheme(color: ThemeColor, mode: ThemeMode) {
    return COLOR_SCHEMES[color][mode];
  },

  getAvailableColors(): { value: ThemeColor; label: string; preview: string }[] {
    return [
      { value: 'blue', label: 'Azul', preview: 'bg-blue-600' },
      { value: 'green', label: 'Verde', preview: 'bg-green-600' },
      { value: 'teal', label: 'Verde Azulado', preview: 'bg-teal-600' },
      { value: 'cyan', label: 'Cian', preview: 'bg-cyan-600' },
      { value: 'orange', label: 'Naranja', preview: 'bg-orange-600' },
      { value: 'red', label: 'Rojo', preview: 'bg-red-600' },
    ];
  },
};
