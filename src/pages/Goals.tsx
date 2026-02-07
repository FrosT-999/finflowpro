import { useNavigate } from 'react-router-dom';
import {
  Target, Wallet, ArrowLeft, Loader2,
} from 'lucide-react';
import { useFinancialGoals } from '@/hooks/useFinancialGoals';
import { GoalFormDialog } from '@/components/goals/GoalFormDialog';
import { GoalCard } from '@/components/goals/GoalCard';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Goals() {
  const navigate = useNavigate();
  const { goals, isLoading, createGoal, addFunds, deleteGoal } = useFinancialGoals();

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary p-2">
                <Wallet className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl hidden sm:inline">Metas Financeiras</span>
              <span className="font-bold text-lg sm:hidden">Metas</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GoalFormDialog onSubmit={createGoal} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {goals.length === 0 ? (
          <div className="finance-card text-center py-16 animate-fade-in">
            <Target className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhuma meta criada</h2>
            <p className="text-muted-foreground mb-6">
              Comece definindo uma meta financeira para acompanhar seu progresso.
            </p>
            <GoalFormDialog onSubmit={createGoal} />
          </div>
        ) : (
          <Tabs defaultValue="active" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="active" className="gap-2">
                  <Target className="h-4 w-4" />
                  Ativas ({activeGoals.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="gap-2">
                  Concluídas ({completedGoals.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="active" className="space-y-4">
              {activeGoals.length === 0 ? (
                <div className="finance-card text-center py-10">
                  <p className="text-muted-foreground">Nenhuma meta ativa. Crie uma nova!</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} onAddFunds={addFunds} onDelete={deleteGoal} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedGoals.length === 0 ? (
                <div className="finance-card text-center py-10">
                  <p className="text-muted-foreground">Nenhuma meta concluída ainda.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {completedGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} onAddFunds={addFunds} onDelete={deleteGoal} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
