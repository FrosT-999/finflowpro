import { Transaction } from '@/types/finance';

/**
 * Export transactions to CSV string
 */
export function transactionsToCSV(transactions: Transaction[]): string {
  const headers = ['Data', 'Tipo', 'Categoria', 'Valor', 'Descrição'];
  const rows = transactions.map(t => [
    t.date,
    t.type === 'income' ? 'Receita' : 'Despesa',
    t.category,
    t.amount.toFixed(2).replace('.', ','),
    t.description || '',
  ]);

  const escape = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const lines = [headers, ...rows].map(row => row.map(escape).join(','));
  return '\uFEFF' + lines.join('\n'); // BOM for Excel UTF-8
}

/**
 * Download a CSV string as a file
 */
export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV file content into transaction data for import
 */
export function parseCSV(content: string): {
  transactions: Array<{
    date: string;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    description?: string;
  }>;
  errors: string[];
} {
  const errors: string[] = [];
  const lines = content.trim().split(/\r?\n/);

  if (lines.length < 2) {
    return { transactions: [], errors: ['O arquivo CSV está vazio ou não tem dados.'] };
  }

  // Skip header
  const dataLines = lines.slice(1);
  const transactions: Array<{
    date: string;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    description?: string;
  }> = [];

  dataLines.forEach((line, index) => {
    const row = parseCSVLine(line);
    if (row.length < 4) {
      errors.push(`Linha ${index + 2}: número insuficiente de colunas.`);
      return;
    }

    const [dateStr, typeStr, category, amountStr, description] = row;

    // Validate date (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
      errors.push(`Linha ${index + 2}: data inválida "${dateStr}". Use o formato AAAA-MM-DD.`);
      return;
    }

    // Validate type
    const typeLower = typeStr.trim().toLowerCase();
    let type: 'income' | 'expense';
    if (typeLower === 'receita' || typeLower === 'income') {
      type = 'income';
    } else if (typeLower === 'despesa' || typeLower === 'expense') {
      type = 'expense';
    } else {
      errors.push(`Linha ${index + 2}: tipo inválido "${typeStr}". Use "Receita" ou "Despesa".`);
      return;
    }

    // Parse amount
    const cleanAmount = amountStr.trim().replace(',', '.');
    const amount = parseFloat(cleanAmount);
    if (isNaN(amount) || amount <= 0) {
      errors.push(`Linha ${index + 2}: valor inválido "${amountStr}".`);
      return;
    }

    transactions.push({
      date: dateStr.trim(),
      type,
      category: category.trim(),
      amount,
      description: description?.trim() || undefined,
    });
  });

  return { transactions, errors };
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}
