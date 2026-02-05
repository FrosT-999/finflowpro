import { TrendingUp, TrendingDown, AlertTriangle, Sparkles } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { getCurrentMonth, formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export function FinancialInsights() {
  const { getMonthlyTrend, getCategoryBreakdown } = useFinance();
  const { categories } = useCategoryContext();

  const trend = getMonthlyTrend();
  const currentMonth = getCurrentMonth();
  const categoryBreakdown = getCategoryBreakdown(currentMonth);

  // Find the highest expense category
  const highestExpenseCategory = categoryBreakdown.reduce(
    (max, item) => (item.amount > max.amount ? item : max),
    { category: '', amount: 0 }
  );

  // Get category display name
  const getCategoryName = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.name || categoryName;
  };

  // Calculate month-over-month change
  const currentMonthData = trend.find(t => t.month === currentMonth);
  const previousMonthIndex = trend.findIndex(t => t.month === currentMonth) - 1;
  const previousMonthData = previousMonthIndex >= 0 ? trend[previousMonthIndex] : null;

  const expenseChange = previousMonthData && previousMonthData.totalExpense > 0
    ? ((currentMonthData?.totalExpense || 0) - previousMonthData.totalExpense) / previousMonthData.totalExpense * 100
    : 0;

  // Check for consecutive growth
  const consecutiveGrowth = trend.filter((t, i) => i > 0 && t.balance > trend[i - 1].balance).length;

  const insights = [];

  // Expense change insight
  if (expenseChange > 10) {
    insights.push({
      type: 'warning',
      icon: AlertTriangle,
      message: `Seus gastos aumentaram ${expenseChange.toFixed(0)}% em relação ao mês anterior.`,
    });
  } else if (expenseChange < -10) {
    insights.push({
      type: 'success',
      icon: TrendingDown,
      message: `Parabéns! Você reduziu seus gastos em ${Math.abs(expenseChange).toFixed(0)}% este mês.`,
    });
  }

  // Highest expense category
  if (highestExpenseCategory.amount > 0) {
    insights.push({
      type: 'info',
      icon: Sparkles,
      message: `Sua maior categoria de gastos é ${getCategoryName(highestExpenseCategory.category)} (${formatCurrency(highestExpenseCategory.amount)}).`,
    });
  }

  // Consecutive growth
  if (consecutiveGrowth >= 3) {
    insights.push({
      type: 'success',
      icon: TrendingUp,
      message: `Seu saldo está crescendo há ${consecutiveGrowth} meses consecutivos!`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'info',
      icon: Sparkles,
      message: 'Continue registrando suas transações para receber insights personalizados.',
    });
  }

  return (
    <div className="finance-card animate-slide-up" style={{ animationDelay: '450ms' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-xl bg-primary/10 p-3">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-semibold">Insights Financeiros</h3>
      </div>
      <div className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div
              key={index}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg',
                insight.type === 'warning' && 'bg-warning/10',
                insight.type === 'success' && 'bg-income/10',
                insight.type === 'info' && 'bg-primary/10'
              )}
            >
              <Icon className={cn(
                'h-5 w-5 mt-0.5',
                insight.type === 'warning' && 'text-warning',
                insight.type === 'success' && 'text-income',
                insight.type === 'info' && 'text-primary'
              )} />
              <p className="text-sm">{insight.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
