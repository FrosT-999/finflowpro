import { useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';

export interface PillarScore {
  id: string;
  name: string;
  score: number;
  status: 'Crítico' | 'Atenção' | 'Saudável' | 'Excelente';
  phrase: string;
  icon: string;
  weight: number;
  details: {
    how: string;
    improve: string;
    impact: string;
  };
}

export interface FinancialScore {
  overall: number;
  status: 'Crítico' | 'Atenção' | 'Saudável' | 'Excelente';
  phrase: string;
  pillars: PillarScore[];
  hasData: boolean;
}

function getStatus(score: number): 'Crítico' | 'Atenção' | 'Saudável' | 'Excelente' {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Saudável';
  if (score >= 40) return 'Atenção';
  return 'Crítico';
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

// Heuristic: identify "impulse" categories (lazer, outros, entretenimento, etc.)
const IMPULSE_KEYWORDS = ['lazer', 'entretenimento', 'outros', 'impulso', 'compras', 'shopping'];
function isImpulseCategory(category: string): boolean {
  const lower = category.toLowerCase();
  return IMPULSE_KEYWORDS.some(k => lower.includes(k));
}

export function useFinancialScore(): FinancialScore {
  const { transactions, getMonthlyStats } = useFinance();

  return useMemo(() => {
    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7);

    // Build previous month string
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevDate.toISOString().substring(0, 7);

    const currentMonthTxs = transactions.filter(t => t.date.substring(0, 7) === currentMonth);
    const prevMonthTxs = transactions.filter(t => t.date.substring(0, 7) === prevMonth);

    const hasData = currentMonthTxs.length > 0;

    if (!hasData) {
      return {
        overall: 0,
        status: 'Crítico',
        phrase: 'Registre suas transações para desbloquear seu score completo.',
        hasData: false,
        pillars: buildEmptyPillars(),
      };
    }

    const currentStats = getMonthlyStats(currentMonth);
    const prevStats = getMonthlyStats(prevMonth);

    // ─── A) Controle de Impulso ───────────────────────────────────────────────
    const totalExpense = currentStats.totalExpense;
    const totalImpulse = currentMonthTxs
      .filter(t => t.type === 'expense' && isImpulseCategory(t.category))
      .reduce((sum, t) => sum + t.amount, 0);

    const impulsePercent = totalExpense > 0 ? totalImpulse / totalExpense : 0;

    let impulseScore: number;
    if (impulsePercent > 0.4) impulseScore = 20;
    else if (impulsePercent > 0.3) impulseScore = 40;
    else if (impulsePercent > 0.2) impulseScore = 60;
    else if (impulsePercent > 0.1) impulseScore = 80;
    else impulseScore = 100;

    // Bonus: reduced impulse % vs prev month
    const prevImpulse = prevMonthTxs
      .filter(t => t.type === 'expense' && isImpulseCategory(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    const prevImpulsePercent = prevStats.totalExpense > 0 ? prevImpulse / prevStats.totalExpense : 0;
    if (impulsePercent < prevImpulsePercent) {
      impulseScore = clamp(impulseScore + 5);
    }

    // ─── B) Consistência ─────────────────────────────────────────────────────
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = Math.min(now.getDate(), daysInMonth);
    const uniqueDays = new Set(
      currentMonthTxs.map(t => t.date.substring(0, 10))
    ).size;

    const consistencyBase = (uniqueDays / daysElapsed) * 100;

    // Check for extreme spike (any single day > 3x daily average)
    const dailyAmounts: Record<string, number> = {};
    currentMonthTxs
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const day = t.date.substring(0, 10);
        dailyAmounts[day] = (dailyAmounts[day] || 0) + t.amount;
      });

    const dailyValues = Object.values(dailyAmounts);
    const avgDaily = dailyValues.length > 0
      ? dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length
      : 0;
    const hasSpike = dailyValues.some(v => v > avgDaily * 3);

    let consistencyScore = clamp(consistencyBase);
    if (hasSpike) consistencyScore = clamp(consistencyScore - 10);

    // ─── C) Reserva ──────────────────────────────────────────────────────────
    // Use all-time balance as proxy for emergency fund
    const allTimeIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const allTimeExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const reserveBalance = allTimeIncome - allTimeExpense;

    // Average monthly expense over last 3 months
    const last3Months = [-2, -1, 0].map(i => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return d.toISOString().substring(0, 7);
    });
    const avgMonthlyExpense = last3Months.reduce((sum, m) => {
      return sum + getMonthlyStats(m).totalExpense;
    }, 0) / 3;

    const reserveMonths = avgMonthlyExpense > 0 ? reserveBalance / avgMonthlyExpense : 0;

    let reserveScore: number;
    if (reserveMonths < 0.5) reserveScore = 20;
    else if (reserveMonths < 1) reserveScore = 40;
    else if (reserveMonths < 2) reserveScore = 70;
    else if (reserveMonths < 3) reserveScore = 90;
    else reserveScore = 100;

    // ─── D) Risco Financeiro ──────────────────────────────────────────────────
    const commitment = currentStats.totalIncome > 0
      ? currentStats.totalExpense / currentStats.totalIncome
      : 1;

    let riskScore: number;
    if (commitment > 1.0) riskScore = 20;
    else if (commitment > 0.9) riskScore = 40;
    else if (commitment > 0.7) riskScore = 60;
    else if (commitment > 0.5) riskScore = 80;
    else riskScore = 100;

    // ─── E) Crescimento ──────────────────────────────────────────────────────
    // Compare pillars vs prev month (need prev month scores)
    const prevImpulsePercent2 = prevStats.totalExpense > 0
      ? prevImpulse / prevStats.totalExpense : 0;
    let prevImpulseScore2 = prevImpulsePercent2 > 0.4 ? 20
      : prevImpulsePercent2 > 0.3 ? 40
      : prevImpulsePercent2 > 0.2 ? 60
      : prevImpulsePercent2 > 0.1 ? 80 : 100;

    const prevCommitment = prevStats.totalIncome > 0
      ? prevStats.totalExpense / prevStats.totalIncome : 1;
    const prevRiskScore = prevCommitment > 1.0 ? 20
      : prevCommitment > 0.9 ? 40
      : prevCommitment > 0.7 ? 60
      : prevCommitment > 0.5 ? 80 : 100;

    // Count improved pillars (impulse, consistency, reserve, risk)
    const improved = [
      impulseScore > prevImpulseScore2,
      // consistency: current vs prev month unique days ratio
      uniqueDays / daysElapsed > (new Set(prevMonthTxs.map(t => t.date.substring(0, 10))).size / 28),
      reserveScore >= 70,
      riskScore > prevRiskScore,
    ].filter(Boolean).length;

    let growthScore: number;
    if (improved >= 3) growthScore = 90;
    else if (improved >= 1) growthScore = 75;
    else if (improved === 0) growthScore = 65;
    else growthScore = 40;

    // Check if prev month had no data (first month - treat as improving)
    if (prevMonthTxs.length === 0) growthScore = 75;

    // ─── Overall Score ────────────────────────────────────────────────────────
    const overall = Math.round(
      impulseScore * 0.25 +
      consistencyScore * 0.20 +
      reserveScore * 0.20 +
      riskScore * 0.20 +
      growthScore * 0.15
    );

    const overallStatus = getStatus(overall);
    const overallPhrase = overall >= 80
      ? 'Sua saúde financeira está excelente! Continue assim.'
      : overall >= 60
      ? 'Você está no caminho certo. Pequenos ajustes farão grande diferença.'
      : overall >= 40
      ? 'Atenção necessária. Revise seus hábitos financeiros.'
      : 'Situação crítica. Agir agora pode mudar seu cenário rapidamente.';

    // ─── Pillar objects ───────────────────────────────────────────────────────
    const pillars: PillarScore[] = [
      {
        id: 'impulso',
        name: 'Controle de Impulso',
        score: impulseScore,
        status: getStatus(impulseScore),
        icon: 'Zap',
        weight: 25,
        phrase: impulseScore >= 80
          ? 'Você está controlando bem seus impulsos.'
          : impulseScore >= 60
          ? 'Seus gastos por impulso estão moderados.'
          : 'Seus gastos por impulso estão elevados.',
        details: {
          how: `Calculado com base na proporção de gastos em categorias de impulso (lazer, compras, outros) em relação ao total de saídas do mês. Quanto menor essa proporção, maior a pontuação. Sua taxa atual é ${(impulsePercent * 100).toFixed(0)}%.`,
          improve: 'Evite compras por impulso. Crie uma regra de espera de 24h antes de qualquer compra não planejada. Reduza os gastos em categorias de lazer e entretenimento.',
          impact: `Este pilar representa 25% do seu score geral. Melhorar de "${getStatus(impulseScore)}" para "Saudável" adicionaria até 10 pontos ao seu score final.`,
        },
      },
      {
        id: 'consistencia',
        name: 'Consistência',
        score: consistencyScore,
        status: getStatus(consistencyScore),
        icon: 'CalendarCheck',
        weight: 20,
        phrase: consistencyScore >= 80
          ? 'Você mantém registro disciplinado.'
          : consistencyScore >= 60
          ? 'Seu registro está regular, mas pode melhorar.'
          : 'Registrar diariamente melhora sua precisão financeira.',
        details: {
          how: `Calculado com base nos dias com registros em relação aos dias transcorridos do mês. Você registrou transações em ${uniqueDays} de ${daysElapsed} dias (${consistencyBase.toFixed(0)}%). Picos extremos de gasto reduzem a pontuação.`,
          improve: 'Registre suas transações diariamente, mesmo as pequenas. Use o botão "Nova Transação" sempre que realizar um pagamento.',
          impact: `Este pilar representa 20% do seu score geral. Manter registros diários pode elevar este pilar para "Excelente".`,
        },
      },
      {
        id: 'reserva',
        name: 'Reserva',
        score: reserveScore,
        status: getStatus(reserveScore),
        icon: 'Shield',
        weight: 20,
        phrase: reserveScore >= 80
          ? 'Você tem proteção financeira sólida.'
          : reserveScore >= 60
          ? 'Sua reserva está crescendo.'
          : 'Sua reserva está vulnerável.',
        details: {
          how: `Calculado dividindo seu saldo acumulado pela média de gastos mensais dos últimos 3 meses. Você tem aproximadamente ${reserveMonths.toFixed(1)} mês(es) de reserva. O ideal é ter ao menos 3 meses.`,
          improve: 'Separe ao menos 10% da sua renda mensalmente para reserva de emergência. Considere uma conta separada exclusiva para este fim.',
          impact: `Este pilar representa 20% do seu score geral. Atingir 3 meses de reserva elevaria sua pontuação para 100 neste pilar.`,
        },
      },
      {
        id: 'risco',
        name: 'Risco Financeiro',
        score: riskScore,
        status: getStatus(riskScore),
        icon: 'AlertTriangle',
        weight: 20,
        phrase: riskScore >= 80
          ? 'Sua estrutura financeira está equilibrada.'
          : riskScore >= 60
          ? 'Seu comprometimento está moderado.'
          : 'Seu comprometimento de renda está elevado.',
        details: {
          how: `Calculado pela proporção entre saídas e entradas do mês. Você comprometeu ${(commitment * 100).toFixed(0)}% da sua renda. Abaixo de 50% é o ideal para ter segurança financeira.`,
          improve: 'Reduza gastos fixos e variáveis. Busque fontes de renda adicional. Evite parcelamentos que aumentem o comprometimento mensal.',
          impact: `Este pilar representa 20% do seu score geral. Reduzir o comprometimento abaixo de 50% elevaria este pilar para "Excelente".`,
        },
      },
      {
        id: 'crescimento',
        name: 'Crescimento',
        score: growthScore,
        status: getStatus(growthScore),
        icon: 'TrendingUp',
        weight: 15,
        phrase: growthScore >= 80
          ? 'Você evoluiu significativamente em relação ao mês anterior.'
          : growthScore >= 65
          ? 'Sua performance está estável.'
          : 'Sua performance caiu este mês.',
        details: {
          how: `Calculado comparando sua evolução nos outros pilares em relação ao mês anterior. Você melhorou em ${improved} pilar(es) comparado ao mês passado.`,
          improve: 'Foque em melhorar ao menos 3 pilares a cada mês. Revise seus hábitos financeiros mensalmente e estabeleça metas pequenas e alcançáveis.',
          impact: `Este pilar representa 15% do seu score geral. Melhorar 3 ou mais pilares consecutivamente resultaria em pontuação máxima aqui.`,
        },
      },
    ];

    return { overall, status: overallStatus, phrase: overallPhrase, pillars, hasData };
  }, [transactions, getMonthlyStats]);
}

function buildEmptyPillars(): PillarScore[] {
  return [
    {
      id: 'impulso', name: 'Controle de Impulso', score: 0, status: 'Crítico',
      icon: 'Zap', weight: 25,
      phrase: 'Registre transações para calcular.',
      details: { how: '', improve: '', impact: '' },
    },
    {
      id: 'consistencia', name: 'Consistência', score: 0, status: 'Crítico',
      icon: 'CalendarCheck', weight: 20,
      phrase: 'Registre transações para calcular.',
      details: { how: '', improve: '', impact: '' },
    },
    {
      id: 'reserva', name: 'Reserva', score: 0, status: 'Crítico',
      icon: 'Shield', weight: 20,
      phrase: 'Registre transações para calcular.',
      details: { how: '', improve: '', impact: '' },
    },
    {
      id: 'risco', name: 'Risco Financeiro', score: 0, status: 'Crítico',
      icon: 'AlertTriangle', weight: 20,
      phrase: 'Registre transações para calcular.',
      details: { how: '', improve: '', impact: '' },
    },
    {
      id: 'crescimento', name: 'Crescimento', score: 0, status: 'Crítico',
      icon: 'TrendingUp', weight: 15,
      phrase: 'Registre transações para calcular.',
      details: { how: '', improve: '', impact: '' },
    },
  ];
}
