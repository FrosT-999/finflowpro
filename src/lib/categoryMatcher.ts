/**
 * Category auto-detection based on transaction description keywords
 */

interface CategoryKeywords {
  category: string;
  type: 'income' | 'expense';
  keywords: string[];
}

const DEFAULT_KEYWORD_MAP: CategoryKeywords[] = [
  // Expense categories
  {
    category: 'Alimentação',
    type: 'expense',
    keywords: [
      'supermercado', 'mercado', 'padaria', 'restaurante', 'lanchonete',
      'ifood', 'rappi', 'uber eats', 'pizzaria', 'açougue', 'hortifruti',
      'feira', 'carrefour', 'pao de acucar', 'extra', 'assai', 'atacadao',
      'burger', 'mcdonalds', 'subway', 'starbucks', 'cafe', 'bar ',
      'churrascaria', 'sushi', 'delivery', 'alimentacao', 'refeicao',
      'almoço', 'jantar', 'lanche', 'comida',
    ],
  },
  {
    category: 'Transporte',
    type: 'expense',
    keywords: [
      'uber', '99', '99app', 'combustivel', 'gasolina', 'etanol', 'diesel',
      'estacionamento', 'pedagio', 'onibus', 'metro', 'trem', 'passagem',
      'bilhete unico', 'sem parar', 'auto posto', 'posto', 'shell', 'ipiranga',
      'br distribuidora', 'oficina', 'mecanico', 'pneu', 'seguro auto',
      'taxi', 'cabify', 'transporte',
    ],
  },
  {
    category: 'Lazer',
    type: 'expense',
    keywords: [
      'netflix', 'spotify', 'cinema', 'teatro', 'show', 'ingresso',
      'amazon prime', 'disney', 'hbo', 'youtube premium', 'steam',
      'playstation', 'xbox', 'jogo', 'parque', 'viagem', 'hotel',
      'airbnb', 'booking', 'entretenimento', 'diversao', 'clube',
      'academia', 'gym', 'smart fit', 'musica', 'livro', 'livraria',
    ],
  },
  {
    category: 'Aluguel',
    type: 'expense',
    keywords: [
      'aluguel', 'condominio', 'iptu', 'agua', 'luz', 'energia',
      'gas', 'internet', 'telefone', 'celular', 'claro', 'vivo', 'tim',
      'oi', 'net', 'enel', 'sabesp', 'copasa', 'cemig', 'cpfl',
      'moradia', 'habitacao',
    ],
  },
  {
    category: 'Investimentos',
    type: 'expense',
    keywords: [
      'investimento', 'aplicacao', 'poupanca', 'cdb', 'tesouro direto',
      'fundo', 'acao', 'acoes', 'bolsa', 'corretora', 'xp', 'nuinvest',
      'rico', 'clear', 'btg', 'cripto', 'bitcoin',
    ],
  },
  // Income categories
  {
    category: 'Salário',
    type: 'income',
    keywords: [
      'salario', 'folha', 'pagamento', 'remuneracao', 'pro-labore',
      'prolabore', 'holerite', 'contra-cheque', 'vencimento', 'ordenado',
      'decimo terceiro', '13o', 'ferias', 'bonificacao', 'bonus',
      'participacao lucros', 'plr', 'vale', 'beneficio',
    ],
  },
  {
    category: 'Freelance',
    type: 'income',
    keywords: [
      'freelance', 'freela', 'projeto', 'consultoria', 'servico prestado',
      'nota fiscal', 'nf-e', 'mei', 'pj', 'contrato',
    ],
  },
  {
    category: 'Investimentos',
    type: 'income',
    keywords: [
      'rendimento', 'dividendo', 'juros', 'resgate', 'lucro',
      'rentabilidade', 'yield', 'provento',
    ],
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Match a transaction description to a category.
 * Optionally accepts user categories to prioritize them.
 */
export function matchCategory(
  description: string,
  type: 'income' | 'expense',
  userCategories?: string[]
): string {
  const normalizedDesc = normalize(description);

  // Filter keyword map by type
  const relevantMappings = DEFAULT_KEYWORD_MAP.filter(m => m.type === type);

  for (const mapping of relevantMappings) {
    // If user has this category, use it
    if (userCategories && !userCategories.some(c => normalize(c) === normalize(mapping.category))) {
      continue;
    }

    for (const keyword of mapping.keywords) {
      if (normalizedDesc.includes(normalize(keyword))) {
        return mapping.category;
      }
    }
  }

  // Second pass: try without filtering by user categories
  for (const mapping of relevantMappings) {
    for (const keyword of mapping.keywords) {
      if (normalizedDesc.includes(normalize(keyword))) {
        return mapping.category;
      }
    }
  }

  return 'Outros';
}
