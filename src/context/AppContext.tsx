import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Category, Transaction, Budget } from '../database/types';
import { initDatabase, getSetting, setSetting, isWeb } from '../database/db';
import { getAllCategories, addCategory, deleteCategory, getAllBudgets, setBudget, deleteBudget } from '../database/categoryRepository';
import { getAllTransactions, addTransaction, deleteTransaction, getTransactionStats, StatsSummary } from '../database/transactionRepository';

interface AppContextProps {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  stats: StatsSummary;
  theme: 'light' | 'dark';
  currencySymbol: string;
  currencyCode: string;
  isLoading: boolean;
  
  // Transactions
  addNewTransaction: (type: 'expense' | 'income', amount: number, categoryId: number, date: string, description?: string) => Transaction | null;
  deleteTx: (id: number) => boolean;
  
  // Categories
  addNewCategory: (name: string, icon: string, color: string) => Category | null;
  deleteCat: (id: number) => boolean;
  
  // Budgets
  updateBudget: (categoryId: number, limitAmount: number) => Budget | null;
  removeBudget: (categoryId: number) => boolean;
  
  // Settings
  toggleTheme: () => void;
  updateCurrency: (code: string, symbol: string) => void;
  resetAll: () => void;
  refreshData: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [stats, setStats] = useState<StatsSummary>({ totalIncome: 0, totalExpense: 0, balance: 0, categoryBreakdown: [] });
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');

  // Initialize DB on mount
  useEffect(() => {
    try {
      initDatabase();
      
      // Load settings
      const savedTheme = getSetting('theme', 'dark') as 'light' | 'dark';
      const savedCurrencyCode = getSetting('currency_code', 'USD');
      const savedCurrencySymbol = getSetting('currency_symbol', '$');
      
      setTheme(savedTheme);
      setCurrencyCode(savedCurrencyCode);
      setCurrencySymbol(savedCurrencySymbol);
      
      // Load data
      loadDataFromSource();
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDataFromSource = () => {
    try {
      const cats = getAllCategories();
      const txs = getAllTransactions();
      const budg = getAllBudgets();
      const summary = getTransactionStats();

      setCategories(cats);
      setTransactions(txs);
      setBudgets(budg);
      setStats(summary);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const refreshData = () => {
    loadDataFromSource();
  };

  const addNewTransaction = (
    type: 'expense' | 'income',
    amount: number,
    categoryId: number,
    date: string,
    description?: string
  ) => {
    const tx = addTransaction(type, amount, categoryId, date, description);
    if (tx) {
      loadDataFromSource();
    }
    return tx;
  };

  const deleteTx = (id: number) => {
    const success = deleteTransaction(id);
    if (success) {
      loadDataFromSource();
    }
    return success;
  };

  const addNewCategory = (name: string, icon: string, color: string) => {
    const cat = addCategory(name, icon, color);
    if (cat) {
      loadDataFromSource();
    }
    return cat;
  };

  const deleteCat = (id: number) => {
    const success = deleteCategory(id);
    if (success) {
      loadDataFromSource();
    }
    return success;
  };

  const updateBudget = (categoryId: number, limitAmount: number) => {
    const b = setBudget(categoryId, limitAmount);
    if (b) {
      loadDataFromSource();
    }
    return b;
  };

  const removeBudget = (categoryId: number) => {
    const success = deleteBudget(categoryId);
    if (success) {
      loadDataFromSource();
    }
    return success;
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    setSetting('theme', newTheme);
  };

  const updateCurrency = (code: string, symbol: string) => {
    setCurrencyCode(code);
    setCurrencySymbol(symbol);
    setSetting('currency_code', code);
    setSetting('currency_symbol', symbol);
  };

  const resetAll = () => {
    try {
      // Clear local records
      if (isWeb) {
        localStorage.clear();
      }
      initDatabase(); // Re-seeds categories and tables
      loadDataFromSource();
    } catch (error) {
      console.error('Reset error:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        transactions,
        categories,
        budgets,
        stats,
        theme,
        currencySymbol,
        currencyCode,
        isLoading,
        addNewTransaction,
        deleteTx,
        addNewCategory,
        deleteCat,
        updateBudget,
        removeBudget,
        toggleTheme,
        updateCurrency,
        resetAll,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
