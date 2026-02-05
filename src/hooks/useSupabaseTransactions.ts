import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, MonthlyGoal, MonthlyStats, TransactionType } from '@/types/finance';
import { useAuthContext } from '@/contexts/AuthContext';

interface DbTransaction {
  id: string;
  user_id: string;
  type: string;
  category: string;
  amount: number;
  date: string;
  description: string | null;
  created_at: string;
}

interface DbGoal {
  id: string;
  user_id: string;
  month: string;
  target_amount: number;
  created_at: string;
}

// Map DB transaction to app transaction
const mapDbTransaction = (t: DbTransaction): Transaction => ({
  id: t.id,
  type: t.type as TransactionType,
  category: t.category,
  amount: Number(t.amount),
  date: t.date,
  description: t.description || undefined,
  createdAt: t.created_at,
});

// Map DB goal to app goal
const mapDbGoal = (g: DbGoal): MonthlyGoal => ({
  id: g.id,
  month: g.month,
  targetAmount: Number(g.target_amount),
  createdAt: g.created_at,
});

export function useSupabaseTransactions() {
  const { user } = useAuthContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<MonthlyGoal[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch transactions from Supabase
  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }

    setTransactions((data || []).map(mapDbTransaction));
  }, [user]);

  // Fetch goals from Supabase
  const fetchGoals = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('monthly_goals')
      .select('*')
      .order('month', { ascending: false });

    if (error) {
      console.error('Error fetching goals:', error);
      return;
    }

    setGoals((data || []).map(mapDbGoal));
  }, [user]);

  // Initial data load
  useEffect(() => {
    if (user) {
      Promise.all([fetchTransactions(), fetchGoals()]).then(() => {
        setIsLoaded(true);
      });
    } else {
      setTransactions([]);
      setGoals([]);
      setIsLoaded(true);
    }
  }, [user, fetchTransactions, fetchGoals]);

  // Add transaction
  const addTransaction = useCallback(async (
    transaction: Omit<Transaction, 'id' | 'createdAt'>
  ) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        date: transaction.date,
        description: transaction.description || null,
      })
      .select()
      .single();

    if (error) throw error;

    const newTransaction = mapDbTransaction(data);
    setTransactions(prev => [newTransaction, ...prev]);
    return newTransaction;
  }, [user]);

  // Update transaction
  const updateTransaction = useCallback(async (
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>
  ) => {
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('transactions')
      .update({
        type: updates.type,
        category: updates.category,
        amount: updates.amount,
        date: updates.date,
        description: updates.description || null,
      })
      .eq('id', id);

    if (error) throw error;

    setTransactions(prev => 
      prev.map(t => t.id === id ? { ...t, ...updates } : t)
    );
  }, [user]);

  // Delete transaction
  const deleteTransaction = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setTransactions(prev => prev.filter(t => t.id !== id));
  }, [user]);

  // Set monthly goal
  const setMonthlyGoal = useCallback(async (month: string, targetAmount: number) => {
    if (!user) throw new Error('Not authenticated');

    // Check if goal exists
    const existingGoal = goals.find(g => g.month === month);

    if (existingGoal) {
      const { error } = await supabase
        .from('monthly_goals')
        .update({ target_amount: targetAmount })
        .eq('id', existingGoal.id);

      if (error) throw error;

      setGoals(prev => 
        prev.map(g => g.month === month ? { ...g, targetAmount } : g)
      );
    } else {
      const { data, error } = await supabase
        .from('monthly_goals')
        .insert({
          user_id: user.id,
          month,
          target_amount: targetAmount,
        })
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => [...prev, mapDbGoal(data)]);
    }
  }, [user, goals]);

  // Get goal for a specific month
  const getGoalForMonth = useCallback((month: string) => {
    return goals.find(g => g.month === month);
  }, [goals]);

  // Filter transactions
  const filterTransactions = useCallback((filters: {
    month?: string;
    type?: TransactionType;
    category?: string;
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
      category,
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
