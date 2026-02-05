import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
];

interface QuickCategoryModalProps {
  type: 'income' | 'expense';
  trigger?: React.ReactNode;
  onCategoryCreated?: (categoryId: string) => void;
}

export function QuickCategoryModal({ type, trigger, onCategoryCreated }: QuickCategoryModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [parentId, setParentId] = useState<string | null>(null);
  const { categories, addCategory, isLoading } = useCategoryContext();
  const { toast } = useToast();

  const parentOptions = categories.filter(c => c.type === type && !c.parentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const newCategory = await addCategory({
        name: name.trim(),
        type,
        color,
        parentId,
      });
      toast({
        title: 'Categoria criada',
        description: `"${name}" foi adicionada.`,
      });
      setOpen(false);
      setName('');
      setColor('#6366f1');
      setParentId(null);
      onCategoryCreated?.(newCategory.id);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar a categoria.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
            <Plus className="h-3 w-3" />
            Nova
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            Nova Categoria de {type === 'income' ? 'Receita' : 'Despesa'}
          </DialogTitle>
          <DialogDescription>
            Crie uma nova categoria rapidamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Nome</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da categoria"
              maxLength={50}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Cor</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    'w-7 h-7 rounded-full border-2 transition-all',
                    color === c ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          {parentOptions.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Categoria Pai (opcional)</label>
              <Select value={parentId || 'none'} onValueChange={(v) => setParentId(v === 'none' ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma (categoria principal)</SelectItem>
                  {parentOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
