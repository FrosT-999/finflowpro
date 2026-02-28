

## Plan: Smart Spreadsheet Import/Export System

The current import only accepts a rigid CSV format (Data, Tipo, Categoria, Valor, Descrição). The user wants an **intelligent** import that can read common bank statement / spreadsheet formats and automatically detect columns, classify entries as income/expense, and match categories.

### Implementation Steps

**1. Enhance `src/lib/csv.ts` - Smart Parser**

Add a new `parseSmartCSV` function that:
- Auto-detects delimiter (comma, semicolon, tab)
- Auto-detects column mapping by scanning header names (e.g., "Data", "Date", "Valor", "Value", "Crédito", "Débito", "Credit", "Debit", "Descrição", "Description", "Histórico")
- Supports common bank statement formats:
  - Single amount column with positive/negative values
  - Separate Credit/Debit columns
  - Date formats: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
- Auto-classifies income vs expense based on amount sign or credit/debit columns
- Auto-categorizes transactions by keyword matching against user's existing categories (e.g., description contains "mercado" → Alimentação, "uber" → Transporte)
- Returns a preview with detected format info, mapped transactions, and any warnings

**2. Enhance `src/components/finance/CSVImportExport.tsx` - Improved UI**

Upgrade the import dialog to:
- Accept `.csv`, `.xls`, `.xlsx` files (CSV only for now, but accept the extensions)
- Show detected format summary (e.g., "Detectamos 45 transações: 12 entradas, 33 saídas")
- Show a preview table of the first 5 parsed transactions with editable category mappings
- Show month-by-month breakdown of how many transactions will be imported
- Add a "category mapping" step where unrecognized categories can be mapped to existing ones
- Progress bar during bulk import
- Summary after import (total imported per month, total income/expense)

**3. Create `src/components/finance/SmartImportDialog.tsx` - New Component**

A dedicated dialog component with multi-step flow:
- **Step 1 - Upload**: Drag-and-drop or file select area
- **Step 2 - Detection**: Show auto-detected columns, let user adjust if needed (column mapping dropdowns)
- **Step 3 - Preview**: Table preview with category auto-assignment, allow bulk edits
- **Step 4 - Import**: Progress bar, batch insert transactions, show summary

**4. Create `src/lib/categoryMatcher.ts` - Category Auto-Detection**

A utility that maps transaction descriptions to categories using keyword matching:
- Build a keyword map from user's existing categories (common Portuguese keywords)
- Default keyword mappings: "supermercado/mercado/padaria" → Alimentação, "uber/99/combustivel/estacionamento" → Transporte, "netflix/spotify/cinema" → Lazer, "aluguel/condomínio/iptu" → Aluguel, etc.
- Return best match or "Outros" as fallback

**5. Update Dashboard to use new SmartImportDialog**

Replace `CSVImportExport` with the enhanced version in the transactions tab.

### Technical Details

- Smart delimiter detection: try splitting first data line by `,`, `;`, `\t` and pick the one producing the most consistent column count
- Date parsing: try multiple formats with regex, normalize to YYYY-MM-DD
- Amount parsing: handle `R$ 1.234,56` format (Brazilian), plain numbers, negative values
- Batch insert: use batches of 50 transactions to avoid timeouts
- No new database tables needed - uses existing `transactions` table

