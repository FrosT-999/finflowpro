import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Pencil, 
  Trash2,
  UtensilsCrossed,
  Home,
  Car,
  Gamepad2,
  TrendingUp,
  Briefcase,
  Laptop,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { Transaction, CATEGORY_LABELS, Category } from '@/types/finance';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { TransactionForm } from './TransactionForm';
import { useFinance } from '@/contexts/FinanceContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const categoryIcons: Record<Category, React.ElementType> = {
  alimentacao: UtensilsCrossed,
  aluguel: Home,
  transporte: Car,
  lazer: Gamepad2,
  investimentos: TrendingUp,
  salario: Briefcase,
  freelance: Laptop,
  outros: MoreHorizontal,
};

interface TransactionListProps {
  transactions: Transaction[];
  showActions?: boolean;
}

export function TransactionList({ transactions, showActions = true }: TransactionListProps) {
  const { deleteTransaction } = useFinance();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteTransaction(id);
      toast({
        title: 'Transação excluída',
        description: 'A transação foi removida com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir a transação.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg">Nenhuma transação</h3>
        <p className="text-muted-foreground mt-1">
          Adicione sua primeira transação para começar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction, index) => {
        const CategoryIcon = categoryIcons[transaction.category];
        const isIncome = transaction.type === 'income';
        const isDeleting = deletingId === transaction.id;

        return (
          <div
            key={transaction.id}
            className={cn(
              "transaction-item animate-fade-in",
              isDeleting && "opacity-50"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                'rounded-xl p-3',
                isIncome ? 'bg-income/10' : 'bg-expense/10'
              )}>
                <CategoryIcon className={cn(
                  'h-5 w-5',
                  isIncome ? 'text-income' : 'text-expense'
                )} />
              </div>
              <div>
                <p className="font-medium">{CATEGORY_LABELS[transaction.category]}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{formatDate(transaction.date)}</span>
                  {transaction.description && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-[200px]">{transaction.description}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={cn(
                  'font-semibold',
                  isIncome ? 'text-income' : 'text-expense'
                )}>
                  {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
                </p>
              </div>
              {showActions && (
                <div className="flex gap-1">
                  <TransactionForm
                    transaction={transaction}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isDeleting}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. A transação será permanentemente removida.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(transaction.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
