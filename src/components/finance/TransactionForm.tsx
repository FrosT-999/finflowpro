import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react';
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
import { useCategoryContext } from '@/contexts/CategoryContext';
import { TransactionType, Transaction } from '@/types/finance';
import { QuickCategoryModal } from './QuickCategoryModal';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  type: z.enum(['income', 'expense']),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  amount: z.string().min(1, 'Informe o valor').refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Valor deve ser maior que zero'
  ),
  date: z.string().min(1, 'Informe a data'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// Get current date in local timezone
function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface TransactionFormProps {
  transaction?: Transaction;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function TransactionForm({ transaction, onSuccess, trigger }: TransactionFormProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addTransaction, updateTransaction } = useFinance();
  const { 
    categories, 
    incomeCategoriesWithChildren, 
    expenseCategoriesWithChildren,
    getCategoryByName,
    isLoaded: categoriesLoaded,
  } = useCategoryContext();
  const { toast } = useToast();
  const isEditing = !!transaction;

  // Find the category ID for existing transaction (by name for backward compatibility)
  const getInitialCategoryId = () => {
    if (!transaction) return '';
    const cat = getCategoryByName(transaction.category, transaction.type);
    return cat?.id || '';
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: transaction?.type || 'expense',
      categoryId: getInitialCategoryId(),
      amount: transaction?.amount?.toString() || '',
      date: transaction?.date || getCurrentDate(),
      description: transaction?.description || '',
    },
  });

  const selectedType = form.watch('type');
  const currentCategories = selectedType === 'income' 
    ? incomeCategoriesWithChildren 
    : expenseCategoriesWithChildren;

  // Reset category when type changes
  useEffect(() => {
    if (!isEditing) {
      form.setValue('categoryId', '');
    }
  }, [selectedType, isEditing, form]);

  // Update categoryId when categories are loaded (for editing)
  useEffect(() => {
    if (categoriesLoaded && transaction && !form.getValues('categoryId')) {
      const cat = getCategoryByName(transaction.category, transaction.type);
      if (cat) {
        form.setValue('categoryId', cat.id);
      }
    }
  }, [categoriesLoaded, transaction, getCategoryByName, form]);

  const handleCategoryCreated = (categoryId: string) => {
    form.setValue('categoryId', categoryId);
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      // Find the category name from ID
      const category = categories.find(c => c.id === data.categoryId);
      if (!category) {
        throw new Error('Categoria não encontrada');
      }

      const transactionData = {
        type: data.type as TransactionType,
        category: category.name,
        amount: parseFloat(data.amount),
        date: data.date,
        description: data.description?.trim() || undefined,
      };

      if (isEditing && transaction) {
        await updateTransaction(transaction.id, transactionData);
        toast({
          title: 'Transação atualizada',
          description: 'A transação foi atualizada com sucesso.',
        });
      } else {
        await addTransaction(transactionData);
        toast({
          title: 'Transação adicionada',
          description: 'A transação foi registrada com sucesso.',
        });
      }

      setOpen(false);
      form.reset({
        type: 'expense',
        categoryId: '',
        amount: '',
        date: getCurrentDate(),
        description: '',
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar a transação.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
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
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Categoria</FormLabel>
                    <QuickCategoryModal 
                      type={selectedType} 
                      onCategoryCreated={handleCategoryCreated}
                    />
                  </div>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currentCategories.map((cat) => (
                        <div key={cat.id}>
                          <SelectItem value={cat.id}>
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: cat.color }} 
                              />
                              {cat.name}
                            </div>
                          </SelectItem>
                          {cat.children.map((child) => (
                            <SelectItem key={child.id} value={child.id}>
                              <div className="flex items-center gap-2 pl-4">
                                <span 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: child.color }} 
                                />
                                {child.name}
                              </div>
                            </SelectItem>
                          ))}
                        </div>
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
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  isEditing ? 'Salvar' : 'Adicionar'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
