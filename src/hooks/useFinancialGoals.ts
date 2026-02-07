import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface FinancialGoal {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

interface CreateGoalInput {
  name: string;
  description?: string;
  targetAmount: number;
  deadline: string;
}

export function useFinancialGoals() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mapRow = (row: any): FinancialGoal => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    deadline: row.deadline,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('financial_goals' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erro ao carregar metas', description: error.message, variant: 'destructive' });
    } else {
      setGoals((data as any[]).map(mapRow));
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = async (input: CreateGoalInput) => {
    if (!user) return;
    const { error } = await supabase.from('financial_goals' as any).insert({
      user_id: user.id,
      name: input.name,
      description: input.description || null,
      target_amount: input.targetAmount,
      deadline: input.deadline,
      current_amount: 0,
      status: 'active',
    } as any);

    if (error) throw error;
    await fetchGoals();
  };

  const addFunds = async (goalId: string, amount: number) => {
    if (!user) return;
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newAmount = goal.currentAmount + amount;
    const newStatus = newAmount >= goal.targetAmount ? 'completed' : 'active';

    const { error } = await supabase
      .from('financial_goals' as any)
      .update({ current_amount: newAmount, status: newStatus } as any)
      .eq('id', goalId);

    if (error) throw error;
    await fetchGoals();
  };

  const deleteGoal = async (goalId: string) => {
    const { error } = await supabase
      .from('financial_goals' as any)
      .delete()
      .eq('id', goalId);

    if (error) throw error;
    await fetchGoals();
  };

  return { goals, isLoading, createGoal, addFunds, deleteGoal, refetch: fetchGoals };
}
