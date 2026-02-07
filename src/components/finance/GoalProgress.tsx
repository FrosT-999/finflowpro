import { useState } from 'react';
import { Target, CheckCircle2, Loader2, Plus, ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useFinance } from '@/contexts/FinanceContext';
import { useFinancialGoals } from '@/hooks/useFinancialGoals';
import { formatCurrency, getCurrentMonth, formatMonth } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function GoalProgress() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [goalAmount, setGoalAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { getGoalForMonth, setMonthlyGoal, getMonthlyStats } = useFinance();
  const { goals } = useFinancialGoals();
  const { toast } = useToast();

  const currentMonth = getCurrentMonth();
  const goal = getGoalForMonth(currentMonth);
  const stats = getMonthlyStats(currentMonth);
  const savings = stats.balance > 0 ? stats.balance : 0;

  const progress = goal ? Math.min((savings / goal.targetAmount) * 100, 100) : 0;
  const progressClass = progress >= 100 ? 'progress-fill-success' : 
                        progress >= 50 ? 'progress-fill-warning' : 'progress-fill-danger';

  const activeGoals = goals.filter(g => g.status === 'active').slice(0, 3);

  const handleSetGoal = async () => {
    const amount = parseFloat(goalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor maior que zero.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await setMonthlyGoal(currentMonth, amount);
      toast({
        title: 'Meta definida!',
        description: `Sua meta de economia para ${formatMonth(currentMonth)} é ${formatCurrency(amount)}`,
      });
      setOpen(false);
      setGoalAmount('');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível definir a meta.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="finance-card animate-slide-up" style={{ animationDelay: '400ms' }}>
      {/* Monthly Goal */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-warning/10 p-3">
            <Target className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold">Meta do Mês</h3>
            <p className="text-sm text-muted-foreground">
              {formatMonth(currentMonth)}
            </p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              {goal ? 'Editar' : 'Definir Meta'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[350px]">
            <DialogHeader>
              <DialogTitle>Definir Meta de Economia</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">
                  Quanto você quer economizar este mês?
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleSetGoal}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goal ? (
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Economizado</span>
            <span className="font-medium">
              {formatCurrency(savings)} / {formatCurrency(goal.targetAmount)}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={cn(progressClass)}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {progress.toFixed(0)}% concluído
            </span>
            {progress >= 100 && (
              <div className="flex items-center gap-1 text-income text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Meta atingida!
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          <p>Defina uma meta para acompanhar seu progresso</p>
        </div>
      )}

      {/* Financial Goals Summary */}
      {activeGoals.length > 0 && (
        <div className="mt-5 pt-5 border-t space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-muted-foreground">Metas Financeiras</h4>
          </div>
          {activeGoals.map((g) => {
            const pct = g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0;
            const pctClass = pct >= 100 ? 'progress-fill-success' : pct >= 50 ? 'progress-fill-warning' : 'progress-fill-danger';
            const deadlineDate = new Date(g.deadline + 'T00:00:00');
            const daysLeft = Math.max(Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)), 0);

            return (
              <div key={g.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate">{g.name}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                    <Clock className="h-3 w-3" />
                    {daysLeft}d
                  </span>
                </div>
                <div className="progress-bar !h-1.5">
                  <div className={cn(pctClass)} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(g.currentAmount)}</span>
                  <span>{formatCurrency(g.targetAmount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Link to Goals page */}
      <div className="mt-4 pt-3 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/goals')}
        >
          <span className="flex items-center gap-2">
            <Plus className="h-3.5 w-3.5" />
            {goals.length > 0 ? 'Ver todas as metas' : 'Criar metas financeiras'}
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
