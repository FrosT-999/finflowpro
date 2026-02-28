import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, ArrowRight, ArrowLeft, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useFinance } from '@/contexts/FinanceContext';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useToast } from '@/hooks/use-toast';
import { transactionsToCSV, downloadCSV } from '@/lib/csv';
import { parseSmartCSV, SmartParseResult, SmartParsedTransaction } from '@/lib/smartCsvParser';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';

type Step = 'upload' | 'preview' | 'importing' | 'done';

export function SmartImportDialog() {
  const { transactions, addTransaction } = useFinance();
  const { categories } = useCategoryContext();
  const { toast } = useToast();

  const [importOpen, setImportOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [parseResult, setParseResult] = useState<SmartParseResult | null>(null);
  const [editedTransactions, setEditedTransactions] = useState<SmartParsedTransaction[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userCategoryNames = categories.map(c => c.name);
  const expenseCategories = categories.filter(c => c.type === 'expense').map(c => c.name);
  const incomeCategories = categories.filter(c => c.type === 'income').map(c => c.name);

  const handleExport = () => {
    if (transactions.length === 0) {
      toast({ title: 'Nenhuma transação', description: 'Não há transações para exportar.', variant: 'destructive' });
      return;
    }
    const csv = transactionsToCSV(transactions);
    const date = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `transacoes_${date}.csv`);
    toast({ title: 'Exportação concluída', description: `${transactions.length} transações exportadas.` });
  };

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = parseSmartCSV(content, userCategoryNames);
      setParseResult(result);
      setEditedTransactions([...result.transactions]);
      setStep('preview');
    };
    reader.readAsText(file, 'utf-8');
  }, [userCategoryNames]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleCategoryChange = (index: number, newCategory: string) => {
    setEditedTransactions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], category: newCategory };
      return updated;
    });
  };

  const handleImport = async () => {
    if (editedTransactions.length === 0) return;
    setStep('importing');
    setImportProgress(0);

    let success = 0;
    let errors = 0;
    const batchSize = 50;
    const total = editedTransactions.length;

    for (let i = 0; i < total; i += batchSize) {
      const batch = editedTransactions.slice(i, i + batchSize);
      for (const t of batch) {
        try {
          await addTransaction(t);
          success++;
        } catch {
          errors++;
        }
      }
      setImportProgress(Math.round(((i + batch.length) / total) * 100));
    }

    setImportProgress(100);
    setImportResult({ success, errors });
    setStep('done');
  };

  const handleClose = () => {
    setImportOpen(false);
    setTimeout(() => {
      setStep('upload');
      setParseResult(null);
      setEditedTransactions([]);
      setImportProgress(0);
      setImportResult(null);
    }, 200);
  };

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const formatMonthLabel = (month: string) => {
    const [y, m] = month.split('-');
    return `${monthNames[parseInt(m) - 1]}/${y}`;
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Exportar</span>
      </Button>

      <Dialog open={importOpen} onOpenChange={(open) => { if (!open) handleClose(); else setImportOpen(true); }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importar</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Importação Inteligente
            </DialogTitle>
            <DialogDescription>
              {step === 'upload' && 'Envie um arquivo CSV de qualquer formato bancário. Detectamos as colunas automaticamente.'}
              {step === 'preview' && 'Revise as transações detectadas e ajuste as categorias se necessário.'}
              {step === 'importing' && 'Importando transações...'}
              {step === 'done' && 'Importação finalizada!'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {/* Step: Upload */}
            {step === 'upload' && (
              <div
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">Arraste um arquivo ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground">
                  Suporta CSV de qualquer banco • Detecção automática de colunas
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx,.txt"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            )}

            {/* Step: Preview */}
            {step === 'preview' && parseResult && (
              <div className="space-y-4">
                {/* Detection Summary */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {parseResult.summary.total} transações
                  </Badge>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                    {parseResult.summary.income} entradas
                  </Badge>
                  <Badge className="bg-red-500/10 text-red-600 border-red-200">
                    {parseResult.summary.expense} saídas
                  </Badge>
                  <Badge variant="outline">
                    Delimitador: {parseResult.detectedDelimiter === '\t' ? 'TAB' : `"${parseResult.detectedDelimiter}"`}
                  </Badge>
                </div>

                {/* Warnings */}
                {parseResult.warnings.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <ScrollArea className="max-h-16">
                        {parseResult.warnings.slice(0, 5).map((w, i) => (
                          <p key={i} className="text-xs">{w}</p>
                        ))}
                        {parseResult.warnings.length > 5 && (
                          <p className="text-xs font-medium">...e mais {parseResult.warnings.length - 5} avisos</p>
                        )}
                      </ScrollArea>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Monthly Breakdown */}
                {Object.keys(parseResult.summary.byMonth).length > 0 && (
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Por mês:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(parseResult.summary.byMonth)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([month, data]) => (
                          <Badge key={month} variant="outline" className="text-xs">
                            {formatMonthLabel(month)}: {data.count} transações
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}

                {/* Transaction Preview Table */}
                <ScrollArea className="h-[280px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="w-20">Tipo</TableHead>
                        <TableHead className="w-36">Categoria</TableHead>
                        <TableHead className="w-28 text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editedTransactions.map((t, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs">{t.date.split('-').reverse().join('/')}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{t.description || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={t.type === 'income' ? 'default' : 'destructive'} className="text-[10px] px-1.5">
                              {t.type === 'income' ? 'Entrada' : 'Saída'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={t.category}
                              onValueChange={(val) => handleCategoryChange(idx, val)}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(t.type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                                  <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className={`text-right text-xs font-medium ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}

            {/* Step: Importing */}
            {step === 'importing' && (
              <div className="py-8 space-y-4 text-center">
                <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Importando transações...</p>
                  <Progress value={importProgress} className="w-full" />
                  <p className="text-xs text-muted-foreground">{importProgress}%</p>
                </div>
              </div>
            )}

            {/* Step: Done */}
            {step === 'done' && importResult && (
              <div className="py-8 space-y-4 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
                <div>
                  <p className="text-lg font-semibold">{importResult.success} transações importadas!</p>
                  {importResult.errors > 0 && (
                    <p className="text-sm text-destructive">{importResult.errors} com erro</p>
                  )}
                </div>
                {parseResult && (
                  <div className="rounded-lg border p-4 text-left max-w-sm mx-auto space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Resumo:</p>
                    {Object.entries(parseResult.summary.byMonth)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([month, data]) => (
                        <div key={month} className="flex justify-between text-xs">
                          <span>{formatMonthLabel(month)}</span>
                          <span className="text-muted-foreground">
                            <span className="text-emerald-600">+{formatCurrency(data.income)}</span>
                            {' / '}
                            <span className="text-red-500">-{formatCurrency(data.expense)}</span>
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            {step === 'preview' && (
              <>
                <Button variant="ghost" onClick={() => setStep('upload')}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
                <Button onClick={handleImport} disabled={editedTransactions.length === 0}>
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Importar {editedTransactions.length} transações
                </Button>
              </>
            )}
            {step === 'done' && (
              <Button onClick={handleClose}>Fechar</Button>
            )}
            {step === 'upload' && (
              <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
