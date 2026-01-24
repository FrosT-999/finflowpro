import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFinance } from '@/contexts/FinanceContext';
import { 
  TransactionType, 
  Category, 
  CATEGORY_LABELS,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  Transaction,
} from '@/types/finance';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Selecione uma categoria'),
  amount: z.string().min(1, 'Informe o valor').refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Valor deve ser maior que zero'
  ),
  date: z.string().min(1, 'Informe a data'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TransactionFormProps {
  transaction?: Transaction;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function TransactionForm({ transaction, onSuccess, trigger }: TransactionFormProps) {
  const [open, setOpen] = useState(false);
  const { addTransaction, updateTransaction } = useFinance();
  const { toast } = useToast();
  const isEditing = !!transaction;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: transaction?.type || 'expense',
      category: transaction?.category || '',
      amount: transaction?.amount?.toString() || '',
      date: transaction?.date || new Date().toISOString().split('T')[0],
      description: transaction?.description || '',
    },
  });

  const selectedType = form.watch('type');
  const categories = selectedType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const onSubmit = (data: FormData) => {
    const transactionData = {
      type: data.type as TransactionType,
      category: data.category as Category,
      amount: parseFloat(data.amount),
      date: data.date,
      description: data.description?.trim() || undefined,
    };

    if (isEditing && transaction) {
      updateTransaction(transaction.id, transactionData);
      toast({
        title: 'Transação atualizada',
        description: 'A transação foi atualizada com sucesso.',
      });
    } else {
      addTransaction(transactionData);
      toast({
        title: 'Transação adicionada',
        description: 'A transação foi registrada com sucesso.',
      });
    }

    setOpen(false);
    form.reset();
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Transação
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Type Selection */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={field.value === 'income' ? 'default' : 'outline'}
                        className={cn(
                          'gap-2',
                          field.value === 'income' && 'bg-income hover:bg-income/90'
                        )}
                        onClick={() => {
                          field.onChange('income');
                          form.setValue('category', '');
                        }}
                      >
                        <ArrowUpCircle className="h-4 w-4" />
                        Entrada
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === 'expense' ? 'default' : 'outline'}
                        className={cn(
                          'gap-2',
                          field.value === 'expense' && 'bg-expense hover:bg-expense/90'
                        )}
                        onClick={() => {
                          field.onChange('expense');
                          form.setValue('category', '');
                        }}
                      >
                        <ArrowDownCircle className="h-4 w-4" />
                        Saída
                      </Button>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Compras do mês, Salário janeiro..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {isEditing ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
