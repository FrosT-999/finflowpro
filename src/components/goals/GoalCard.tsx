import { useState } from 'react';
import { Target, Plus, Trash2, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { FinancialGoal } from '@/hooks/useFinancialGoals';

interface GoalCardProps {
  goal: FinancialGoal;
  onAddFunds: (goalId: string, amount: number) => Promise<void>;
  onDelete: (goalId: string) => Promise<void>;
}

export function GoalCard({ goal, onAddFunds, onDelete }: GoalCardProps) {
  const [fundOpen, setFundOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const progress = goal.targetAmount > 0
    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const isCompleted = goal.status === 'completed';

  // Time remaining
  const deadlineDate = new Date(goal.deadline + 'T00:00:00');
  const today = new Date();
  const daysRemaining = Math.max(Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)), 0);
  const isOverdue = daysRemaining === 0 && !isCompleted;

  const progressClass = isCompleted ? 'progress-fill-success'
    : progress >= 50 ? 'progress-fill-warning' : 'progress-fill-danger';

  const handleAddFunds = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      toast({ title: 'Valor inválido', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      await onAddFunds(goal.id, val);
      toast({ title: 'Valor adicionado!', description: `${formatCurrency(val)} adicionado à meta "${goal.name}".` });
      setAmount('');
      setFundOpen(false);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(goal.id);
      toast({ title: 'Meta excluída' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className={cn(
      "finance-card relative overflow-hidden",
      isCompleted && "border-income/30 bg-income/5"
    )}>
      {isCompleted && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 text-income text-xs font-semibold bg-income/10 px-2 py-1 rounded-full">
            <CheckCircle2 className="h-3 w-3" />
            Concluída
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 mb-4">
        <div className={cn(
          "rounded-xl p-3 shrink-0",
          isCompleted ? "bg-income/10" : "bg-primary/10"
        )}>
          <Target className={cn("h-5 w-5", isCompleted ? "text-income" : "text-primary")} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold truncate">{goal.name}</h3>
          {goal.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{goal.description}</p>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium">{progress.toFixed(0)}%</span>
        </div>
        <div className="progress-bar">
          <div className={cn(progressClass)} style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
          </span>
          {!isCompleted && (
            <span className="text-muted-foreground">
              Faltam {formatCurrency(remaining)}
            </span>
          )}
        </div>
      </div>

      {/* Deadline */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Clock className="h-3.5 w-3.5" />
        {isCompleted ? (
          <span>Meta atingida!</span>
        ) : isOverdue ? (
          <span className="text-expense font-medium">Prazo expirado</span>
        ) : (
          <span>{daysRemaining} dias restantes</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!isCompleted && (
          <Dialog open={fundOpen} onOpenChange={setFundOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 gap-1">
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[320px]">
              <DialogHeader>
                <DialogTitle>Adicionar valor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Meta: <strong>{goal.name}</strong>
                </p>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setFundOpen(false)} disabled={isLoading}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={handleAddFunds} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Adicionar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
              <AlertDialogDescription>
                A meta "{goal.name}" será removida permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
