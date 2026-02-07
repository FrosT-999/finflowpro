import { useState } from 'react';
import { Plus, Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

interface GoalFormDialogProps {
  onSubmit: (data: { name: string; description?: string; targetAmount: number; deadline: string }) => Promise<void>;
}

export function GoalFormDialog({ onSubmit }: GoalFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState<Date>();
  const { toast } = useToast();

  const resetForm = () => {
    setName('');
    setDescription('');
    setTargetAmount('');
    setDeadline(undefined);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' });
      return;
    }
    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Valor inválido', description: 'Informe um valor maior que zero.', variant: 'destructive' });
      return;
    }
    if (!deadline) {
      toast({ title: 'Prazo obrigatório', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        targetAmount: amount,
        deadline: format(deadline, 'yyyy-MM-dd'),
      });
      toast({ title: 'Meta criada!', description: `"${name}" adicionada com sucesso.` });
      resetForm();
      setOpen(false);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Meta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Meta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium">Nome da meta</label>
            <Input
              placeholder="Comprar um carro"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              maxLength={100}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Descrição</label>
            <Textarea
              placeholder="Ex: Juntar dinheiro para comprar meu primeiro carro, incluindo documentação e seguro."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
              maxLength={500}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Valor alvo (R$)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="50000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Prazo</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !deadline && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "PPP", { locale: ptBR }) : "Dezembro 2026"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Criar Meta'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
