/**
 * Smart CSV parser with auto-detection of delimiter, columns, date/amount formats
 */
import { matchCategory } from './categoryMatcher';

export interface SmartParsedTransaction {
  date: string; // YYYY-MM-DD
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
}

export interface SmartParseResult {
  transactions: SmartParsedTransaction[];
  warnings: string[];
  detectedDelimiter: string;
  detectedColumns: DetectedColumns;
  summary: {
    total: number;
    income: number;
    expense: number;
    byMonth: Record<string, { income: number; expense: number; count: number }>;
  };
}

export interface DetectedColumns {
  date?: number;
  description?: number;
  amount?: number;
  credit?: number;
  debit?: number;
  type?: number;
  category?: number;
}

// Header name patterns for column detection
const HEADER_PATTERNS: Record<keyof DetectedColumns, RegExp> = {
  date: /^(data|date|dt|dia|vencimento|lancamento|data\s*lanc)/i,
  description: /^(descri|description|historico|hist|detalhe|memo|observa|complement|titulo|nome)/i,
  amount: /^(valor|value|amount|quantia|total|vlr|montante)/i,
  credit: /^(credito|credit|entrada|receita|cr[eé]d)/i,
  debit: /^(debito|debit|saida|despesa|d[eé]b)/i,
  type: /^(tipo|type|natureza|mov)/i,
  category: /^(categoria|category|cat|class)/i,
};

/**
 * Detect the best delimiter for a CSV string
 */
function detectDelimiter(content: string): string {
  const firstLines = content.split(/\r?\n/).slice(0, 5).filter(l => l.trim());
  const delimiters = [';', ',', '\t', '|'];
  
  let bestDelimiter = ',';
  let bestScore = 0;

  for (const d of delimiters) {
    const counts = firstLines.map(line => line.split(d).length);
    if (counts[0] < 2) continue;
    // Score = consistency (all lines same column count) * column count
    const allSame = counts.every(c => c === counts[0]);
    const score = allSame ? counts[0] * 10 : counts[0];
    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = d;
    }
  }

  return bestDelimiter;
}

/**
 * Parse a CSV line handling quoted fields with a given delimiter
 */
function parseLine(line: string, delimiter: string): string[] {
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
      } else if (char === delimiter) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Detect column mapping from headers
 */
function detectColumns(headers: string[]): DetectedColumns {
  const columns: DetectedColumns = {};
  const normalizedHeaders = headers.map(h =>
    h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim()
  );

  for (const [key, pattern] of Object.entries(HEADER_PATTERNS)) {
    const idx = normalizedHeaders.findIndex(h => pattern.test(h));
    if (idx !== -1) {
      (columns as any)[key] = idx;
    }
  }

  return columns;
}

/**
 * Parse a date string in multiple formats, return YYYY-MM-DD or null
 */
function parseDate(dateStr: string): string | null {
  const cleaned = dateStr.trim();

  // DD/MM/YYYY or DD-MM-YYYY
  let m = cleaned.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m) {
    const [, day, month, year] = m;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // YYYY-MM-DD
  m = cleaned.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (m) {
    const [, year, month, day] = m;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // DD/MM/YY
  m = cleaned.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})$/);
  if (m) {
    const [, day, month, yearShort] = m;
    const year = parseInt(yearShort) > 50 ? `19${yearShort}` : `20${yearShort}`;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return null;
}

/**
 * Parse an amount string, handling Brazilian format (R$ 1.234,56), negatives, etc.
 */
function parseAmount(amountStr: string): number | null {
  let cleaned = amountStr.trim();
  
  // Remove currency symbols
  cleaned = cleaned.replace(/R\$\s*/gi, '').replace(/[US$€£]/g, '').trim();
  
  // Remove spaces
  cleaned = cleaned.replace(/\s/g, '');
  
  // Detect if comma is decimal separator (Brazilian format)
  // Pattern: 1.234,56 or 1234,56
  if (/\d+\.\d{3}/.test(cleaned) && cleaned.includes(',')) {
    // Brazilian: dots are thousands, comma is decimal
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    // Simple comma decimal: 1234,56
    cleaned = cleaned.replace(',', '.');
  } else if (cleaned.includes(',') && cleaned.includes('.')) {
    // Could be ambiguous, check position
    const commaPos = cleaned.lastIndexOf(',');
    const dotPos = cleaned.lastIndexOf('.');
    if (commaPos > dotPos) {
      // Comma is decimal: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
    // else dot is decimal: 1,234.56 — already fine
  }

  // Handle parentheses for negatives: (123.45)
  if (/^\(.*\)$/.test(cleaned)) {
    cleaned = '-' + cleaned.replace(/[()]/g, '');
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Main smart parser
 */
export function parseSmartCSV(
  content: string,
  userCategories?: string[]
): SmartParseResult {
  const warnings: string[] = [];
  const transactions: SmartParsedTransaction[] = [];

  // Remove BOM
  const cleanContent = content.replace(/^\uFEFF/, '');
  const lines = cleanContent.split(/\r?\n/).filter(l => l.trim());

  if (lines.length < 2) {
    return {
      transactions: [],
      warnings: ['Arquivo vazio ou sem dados suficientes.'],
      detectedDelimiter: ',',
      detectedColumns: {},
      summary: { total: 0, income: 0, expense: 0, byMonth: {} },
    };
  }

  const delimiter = detectDelimiter(cleanContent);
  const headers = parseLine(lines[0], delimiter);
  const columns = detectColumns(headers);

  // Validate minimum columns detected
  if (columns.date === undefined) {
    // Try to find date column by data inspection
    const firstDataRow = parseLine(lines[1], delimiter);
    for (let i = 0; i < firstDataRow.length; i++) {
      if (parseDate(firstDataRow[i])) {
        columns.date = i;
        break;
      }
    }
  }

  if (columns.date === undefined) {
    warnings.push('Não foi possível detectar a coluna de data.');
  }

  if (columns.amount === undefined && columns.credit === undefined && columns.debit === undefined) {
    // Try to find amount column by data inspection
    const firstDataRow = parseLine(lines[1], delimiter);
    for (let i = 0; i < firstDataRow.length; i++) {
      if (i === columns.date || i === columns.description) continue;
      const val = parseAmount(firstDataRow[i]);
      if (val !== null && val !== 0) {
        columns.amount = i;
        break;
      }
    }
  }

  // Find description column if not detected
  if (columns.description === undefined) {
    const firstDataRow = parseLine(lines[1], delimiter);
    for (let i = 0; i < firstDataRow.length; i++) {
      if (i === columns.date || i === columns.amount || i === columns.credit || i === columns.debit) continue;
      // Heuristic: description is usually the longest text field
      if (firstDataRow[i].length > 3 && parseAmount(firstDataRow[i]) === null && !parseDate(firstDataRow[i])) {
        columns.description = i;
        break;
      }
    }
  }

  const byMonth: Record<string, { income: number; expense: number; count: number }> = {};
  let incomeCount = 0;
  let expenseCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i], delimiter);
    if (row.length < 2) continue;

    // Parse date
    const dateStr = columns.date !== undefined ? row[columns.date] : '';
    const date = parseDate(dateStr);
    if (!date) {
      if (dateStr.trim()) warnings.push(`Linha ${i + 1}: data inválida "${dateStr}"`);
      continue;
    }

    // Parse amount and determine type
    let amount: number;
    let type: 'income' | 'expense';

    if (columns.credit !== undefined && columns.debit !== undefined) {
      // Separate credit/debit columns
      const creditVal = parseAmount(row[columns.credit] || '0') || 0;
      const debitVal = parseAmount(row[columns.debit] || '0') || 0;
      
      if (creditVal > 0) {
        amount = creditVal;
        type = 'income';
      } else if (debitVal > 0) {
        amount = debitVal;
        type = 'expense';
      } else {
        continue; // Skip zero rows
      }
    } else if (columns.amount !== undefined) {
      const rawAmount = parseAmount(row[columns.amount] || '');
      if (rawAmount === null || rawAmount === 0) {
        warnings.push(`Linha ${i + 1}: valor inválido "${row[columns.amount]}"`);
        continue;
      }
      
      // Check if type column exists
      if (columns.type !== undefined) {
        const typeStr = (row[columns.type] || '').toLowerCase().trim();
        if (typeStr.includes('receita') || typeStr.includes('income') || typeStr.includes('credit') || typeStr.includes('entrada')) {
          type = 'income';
        } else {
          type = 'expense';
        }
        amount = Math.abs(rawAmount);
      } else {
        // Determine by sign
        type = rawAmount >= 0 ? 'income' : 'expense';
        amount = Math.abs(rawAmount);
      }
    } else {
      warnings.push(`Linha ${i + 1}: não foi possível extrair o valor.`);
      continue;
    }

    // Get description
    const description = columns.description !== undefined ? row[columns.description] || '' : '';

    // Get category
    let category: string;
    if (columns.category !== undefined && row[columns.category]?.trim()) {
      category = row[columns.category].trim();
    } else {
      category = matchCategory(description, type, userCategories);
    }

    transactions.push({ date, type, category, amount, description });

    // Track stats
    const month = date.substring(0, 7);
    if (!byMonth[month]) byMonth[month] = { income: 0, expense: 0, count: 0 };
    byMonth[month].count++;
    if (type === 'income') {
      byMonth[month].income += amount;
      incomeCount++;
    } else {
      byMonth[month].expense += amount;
      expenseCount++;
    }
  }

  return {
    transactions,
    warnings,
    detectedDelimiter: delimiter,
    detectedColumns: columns,
    summary: {
      total: transactions.length,
      income: incomeCount,
      expense: expenseCount,
      byMonth,
    },
  };
}
