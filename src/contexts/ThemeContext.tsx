import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { themeService, Theme, ThemeColor, ThemeMode } from '../services/themeService';

interface ThemeContextType {
  theme: Theme;
  setThemeColor: (color: ThemeColor) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(themeService.getTheme());

  useEffect(() => {
    themeService.applyTheme(theme);
  }, [theme]);

  const setThemeColor = (color: ThemeColor) => {
    const newTheme = { ...theme, color };
    setTheme(newTheme);
    themeService.setTheme(newTheme);
  };

  const setThemeMode = (mode: ThemeMode) => {
    const newTheme = { ...theme, mode };
    setTheme(newTheme);
    themeService.setTheme(newTheme);
  };

  const toggleThemeMode = () => {
    const newMode: ThemeMode = theme.mode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, setThemeColor, setThemeMode, toggleThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
