import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  FolderPlus,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useToast } from '@/hooks/use-toast';
import { CustomCategory, CategoryWithChildren } from '@/types/category';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
  '#f43f5e', '#6b7280',
];

interface CategoryFormData {
  name: string;
  type: 'income' | 'expense';
  color: string;
  parentId: string | null;
}

function CategoryForm({
  initialData,
  parentOptions,
  onSubmit,
  onCancel,
  isLoading,
  mode,
}: {
  initialData?: Partial<CategoryFormData>;
  parentOptions: CustomCategory[];
  onSubmit: (data: CategoryFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  mode: 'create' | 'edit' | 'subcategory';
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<'income' | 'expense'>(initialData?.type || 'expense');
  const [color, setColor] = useState(initialData?.color || '#6366f1');
  const [parentId, setParentId] = useState<string | null>(initialData?.parentId || null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), type, color, parentId });
  };

  const filteredParentOptions = parentOptions.filter(p => p.type === type && !p.parentId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Nome</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da categoria"
          maxLength={50}
          required
        />
      </div>

      {mode !== 'subcategory' && (
        <div>
          <label className="text-sm font-medium mb-2 block">Tipo</label>
          <Select value={type} onValueChange={(v) => setType(v as 'income' | 'expense')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Despesa</SelectItem>
              <SelectItem value="income">Receita</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <label className="text-sm font-medium mb-2 block">Cor</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={cn(
                'w-8 h-8 rounded-full border-2 transition-all',
                color === c ? 'border-foreground scale-110' : 'border-transparent'
              )}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      {mode === 'create' && filteredParentOptions.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-2 block">Categoria Pai (opcional)</label>
          <Select value={parentId || 'none'} onValueChange={(v) => setParentId(v === 'none' ? null : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Nenhuma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma (categoria principal)</SelectItem>
              {filteredParentOptions.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || !name.trim()}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function CategoryItem({
  category,
  level = 0,
  onEdit,
  onDelete,
  onAddSubcategory,
  isExpanded,
  onToggle,
  children,
}: {
  category: CustomCategory;
  level?: number;
  onEdit: (category: CustomCategory) => void;
  onDelete: (category: CustomCategory) => void;
  onAddSubcategory: (parent: CustomCategory) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
  children?: CategoryWithChildren['children'];
}) {
  const hasChildren = children && children.length > 0;

  return (
    <div className={cn('border-b last:border-b-0', level > 0 && 'ml-6 border-l pl-4')}>
      <div className="flex items-center gap-3 py-3 group">
        {level === 0 && hasChildren && (
          <button onClick={onToggle} className="p-1 hover:bg-muted rounded">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}
        {level === 0 && !hasChildren && <div className="w-6" />}
        
        <div
          className="w-4 h-4 rounded-full shrink-0"
          style={{ backgroundColor: category.color }}
        />
        <span className="flex-1 font-medium">{category.name}</span>
        
        <span className={cn(
          'text-xs px-2 py-0.5 rounded-full',
          category.type === 'income' 
            ? 'bg-income/20 text-income' 
            : 'bg-expense/20 text-expense'
        )}>
          {category.type === 'income' ? 'Receita' : 'Despesa'}
        </span>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {level === 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onAddSubcategory(category)}
              title="Adicionar subcategoria"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(category)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {!category.isDefault && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. As transações com esta categoria 
                    permanecerão, mas a categoria será removida.
                    {hasChildren && ' Todas as subcategorias também serão excluídas.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => onDelete(category)}
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="pb-2">
          {children.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              level={1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubcategory={onAddSubcategory}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    categories,
    categoriesWithChildren,
    isLoaded,
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategoryContext();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [parentForSubcategory, setParentForSubcategory] = useState<CustomCategory | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const handleToggleExpand = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreate = async (data: CategoryFormData) => {
    try {
      await addCategory(data);
      toast({ title: 'Categoria criada', description: `"${data.name}" foi adicionada.` });
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar a categoria.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateSubcategory = async (data: CategoryFormData) => {
    if (!parentForSubcategory) return;
    try {
      await addCategory({
        ...data,
        type: parentForSubcategory.type,
        parentId: parentForSubcategory.id,
      });
      toast({ title: 'Subcategoria criada', description: `"${data.name}" foi adicionada.` });
      setParentForSubcategory(null);
      // Expand parent to show new subcategory
      setExpandedCategories(prev => new Set(prev).add(parentForSubcategory.id));
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar a subcategoria.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async (data: CategoryFormData) => {
    if (!editingCategory) return;
    try {
      await updateCategory(editingCategory.id, {
        name: data.name,
        color: data.color,
      });
      toast({ title: 'Categoria atualizada', description: `"${data.name}" foi salva.` });
      setEditingCategory(null);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar a categoria.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (category: CustomCategory) => {
    try {
      await deleteCategory(category.id);
      toast({ title: 'Categoria excluída', description: `"${category.name}" foi removida.` });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível excluir a categoria.',
        variant: 'destructive',
      });
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const expenseCategories = categoriesWithChildren.filter(c => c.type === 'expense');
  const incomeCategories = categoriesWithChildren.filter(c => c.type === 'income');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-xl">Categorias</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6 max-w-4xl">
        {/* Action Button */}
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Categoria</DialogTitle>
                <DialogDescription>
                  Crie uma nova categoria para organizar suas transações.
                </DialogDescription>
              </DialogHeader>
              <CategoryForm
                parentOptions={categories}
                onSubmit={handleCreate}
                onCancel={() => setDialogOpen(false)}
                isLoading={isLoading}
                mode="create"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Expense Categories */}
        <div className="finance-card">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-expense" />
            Categorias de Despesa
          </h2>
          {expenseCategories.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma categoria de despesa criada.
            </p>
          ) : (
            <div className="divide-y">
              {expenseCategories.map((cat) => (
                <CategoryItem
                  key={cat.id}
                  category={cat}
                  children={cat.children}
                  isExpanded={expandedCategories.has(cat.id)}
                  onToggle={() => handleToggleExpand(cat.id)}
                  onEdit={setEditingCategory}
                  onDelete={handleDelete}
                  onAddSubcategory={setParentForSubcategory}
                />
              ))}
            </div>
          )}
        </div>

        {/* Income Categories */}
        <div className="finance-card">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-income" />
            Categorias de Receita
          </h2>
          {incomeCategories.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma categoria de receita criada.
            </p>
          ) : (
            <div className="divide-y">
              {incomeCategories.map((cat) => (
                <CategoryItem
                  key={cat.id}
                  category={cat}
                  children={cat.children}
                  isExpanded={expandedCategories.has(cat.id)}
                  onToggle={() => handleToggleExpand(cat.id)}
                  onEdit={setEditingCategory}
                  onDelete={handleDelete}
                  onAddSubcategory={setParentForSubcategory}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Altere o nome ou a cor da categoria.
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              initialData={{
                name: editingCategory.name,
                type: editingCategory.type,
                color: editingCategory.color,
                parentId: editingCategory.parentId,
              }}
              parentOptions={[]}
              onSubmit={handleEdit}
              onCancel={() => setEditingCategory(null)}
              isLoading={isLoading}
              mode="edit"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Subcategory Dialog */}
      <Dialog open={!!parentForSubcategory} onOpenChange={(open) => !open && setParentForSubcategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Subcategoria</DialogTitle>
            <DialogDescription>
              Criar subcategoria em "{parentForSubcategory?.name}"
            </DialogDescription>
          </DialogHeader>
          {parentForSubcategory && (
            <CategoryForm
              initialData={{ type: parentForSubcategory.type }}
              parentOptions={[]}
              onSubmit={handleCreateSubcategory}
              onCancel={() => setParentForSubcategory(null)}
              isLoading={isLoading}
              mode="subcategory"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
