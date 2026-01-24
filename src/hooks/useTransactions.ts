import { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, MonthlyGoal, MonthlyStats, TransactionType, Category } from '@/types/finance';

const TRANSACTIONS_KEY = 'finance-controller-transactions';
const GOALS_KEY = 'finance-controller-goals';

const generateId = () => crypto.randomUUID();

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<MonthlyGoal[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
      const storedGoals = localStorage.getItem(GOALS_KEY);
      
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      }
      if (storedGoals) {
        setGoals(JSON.parse(storedGoals));
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
    setIsLoaded(true);
  }, []);

  // Persist transactions to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    }
  }, [transactions, isLoaded]);

  // Persist goals to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    }
  }, [goals, isLoaded]);

  // Add transaction
  const addTransaction = useCallback((
    transaction: Omit<Transaction, 'id' | 'createdAt'>
  ) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
    return newTransaction;
  }, []);

  // Update transaction
  const updateTransaction = useCallback((
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>
  ) => {
    setTransactions(prev => 
      prev.map(t => t.id === id ? { ...t, ...updates } : t)
    );
  }, []);

  // Delete transaction
  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  // Set monthly goal
  const setMonthlyGoal = useCallback((month: string, targetAmount: number) => {
    setGoals(prev => {
      const existing = prev.find(g => g.month === month);
      if (existing) {
        return prev.map(g => 
          g.month === month ? { ...g, targetAmount } : g
        );
      }
      return [...prev, {
        id: generateId(),
        month,
        targetAmount,
        createdAt: new Date().toISOString(),
      }];
    });
  }, []);

  // Get goal for a specific month
  const getGoalForMonth = useCallback((month: string) => {
    return goals.find(g => g.month === month);
  }, [goals]);

  // Filter transactions
  const filterTransactions = useCallback((filters: {
    month?: string;
    type?: TransactionType;
    category?: Category;
    search?: string;
  }) => {
    return transactions.filter(t => {
      if (filters.month) {
        const transactionMonth = t.date.substring(0, 7);
        if (transactionMonth !== filters.month) return false;
      }
      if (filters.type && t.type !== filters.type) return false;
      if (filters.category && t.category !== filters.category) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const descMatch = t.description?.toLowerCase().includes(searchLower);
        if (!descMatch) return false;
      }
      return true;
    });
  }, [transactions]);

  // Calculate stats for a specific month
  const getMonthlyStats = useCallback((month: string): MonthlyStats => {
    const monthTransactions = transactions.filter(
      t => t.date.substring(0, 7) === month
    );
    
    const totalIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
    
    return { totalIncome, totalExpense, balance, savingsRate };
  }, [transactions]);

  // Get expense breakdown by category for a month
  const getCategoryBreakdown = useCallback((month: string) => {
    const monthTransactions = transactions.filter(
      t => t.date.substring(0, 7) === month && t.type === 'expense'
    );
    
    const breakdown: Record<string, number> = {};
    monthTransactions.forEach(t => {
      breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
    });
    
    return Object.entries(breakdown).map(([category, amount]) => ({
      category: category as Category,
      amount,
    }));
  }, [transactions]);

  // Get monthly trend data (last 6 months)
  const getMonthlyTrend = useCallback(() => {
    const months: string[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date.toISOString().substring(0, 7));
    }
    
    return months.map(month => {
      const stats = getMonthlyStats(month);
      const [year, monthNum] = month.split('-');
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      return {
        month,
        label: monthNames[parseInt(monthNum) - 1],
        ...stats,
      };
    });
  }, [getMonthlyStats]);

  // Overall balance (all time)
  const totalBalance = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return income - expense;
  }, [transactions]);

  return {
    transactions,
    goals,
    isLoaded,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setMonthlyGoal,
    getGoalForMonth,
    filterTransactions,
    getMonthlyStats,
    getCategoryBreakdown,
    getMonthlyTrend,
    totalBalance,
  };
}
