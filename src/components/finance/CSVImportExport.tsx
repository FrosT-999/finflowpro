import { useState, useRef } from 'react';
import { Download, Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { transactionsToCSV, downloadCSV, parseCSV } from '@/lib/csv';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

export function CSVImportExport() {
  const { transactions, addTransaction } = useFinance();
  const { toast } = useToast();
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ReturnType<typeof parseCSV> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (transactions.length === 0) {
      toast({
        title: 'Nenhuma transação',
        description: 'Não há transações para exportar.',
        variant: 'destructive',
      });
      return;
    }
    const csv = transactionsToCSV(transactions);
    const date = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `transacoes_${date}.csv`);
    toast({
      title: 'Exportação concluída',
      description: `${transactions.length} transações exportadas com sucesso.`,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = parseCSV(content);
      setPreview(result);
    };
    reader.readAsText(file, 'utf-8');

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!preview || preview.transactions.length === 0) return;

    setImporting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const t of preview.transactions) {
      try {
        await addTransaction(t);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setImporting(false);
    setImportOpen(false);
    setPreview(null);

    toast({
      title: 'Importação concluída',
      description: `${successCount} transações importadas${errorCount > 0 ? `, ${errorCount} com erro` : ''}.`,
    });
  };

  const handleCloseImport = () => {
    setImportOpen(false);
    setPreview(null);
  };

  return (
    <div className="flex gap-2">
      {/* Export Button */}
      <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Exportar</span>
      </Button>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={(open) => { if (!open) handleCloseImport(); else setImportOpen(true); }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importar</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Transações</DialogTitle>
            <DialogDescription>
              Selecione um arquivo CSV com o formato: Data, Tipo, Categoria, Valor, Descrição
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Input */}
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Clique para selecionar um arquivo CSV
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Preview */}
            {preview && (
              <div className="space-y-3">
                {preview.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <ScrollArea className="max-h-24">
                        {preview.errors.map((err, i) => (
                          <p key={i} className="text-xs">{err}</p>
                        ))}
                      </ScrollArea>
                    </AlertDescription>
                  </Alert>
                )}

                {preview.transactions.length > 0 && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                      {preview.transactions.length} transações prontas para importar.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleCloseImport}>
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={!preview || preview.transactions.length === 0 || importing}
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
