interface FinancialFilter {
  conSaldo: boolean;
  conDeuda: boolean;
}

const STORAGE_KEY = 'usuarios_filtro_financiero';

export const filterStorageUtils = {
  saveFilter: (filter: FinancialFilter) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filter));
    } catch (error) {
      console.warn('Error saving filter to sessionStorage:', error);
    }
  },

  loadFilter: (): FinancialFilter | null => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Error loading filter from sessionStorage:', error);
      return null;
    }
  },

  clearFilter: () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Error clearing filter from sessionStorage:', error);
    }
  }
};
