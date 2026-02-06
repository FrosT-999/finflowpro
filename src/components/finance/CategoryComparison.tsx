import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { formatCurrency, formatMonth, getMonthOptions } from '@/lib/formatters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function CategoryComparison() {
  const { getCategoryBreakdown } = useFinance();
  const { categories } = useCategoryContext();
  const monthOptions = getMonthOptions();

  const [monthA, setMonthA] = useState(monthOptions[1]?.value || monthOptions[0]?.value);
  const [monthB, setMonthB] = useState(monthOptions[0]?.value);

  const breakdownA = useMemo(() => getCategoryBreakdown(monthA), [getCategoryBreakdown, monthA]);
  const breakdownB = useMemo(() => getCategoryBreakdown(monthB), [getCategoryBreakdown, monthB]);

  const getCategoryColor = (name: string) =>
    categories.find(c => c.name === name)?.color || '#6b7280';

  // Merge all categories from both months
  const comparison = useMemo(() => {
    const allCategories = new Set([
      ...breakdownA.map(b => b.category),
      ...breakdownB.map(b => b.category),
    ]);

    return Array.from(allCategories).map(cat => {
      const amountA = breakdownA.find(b => b.category === cat)?.amount || 0;
      const amountB = breakdownB.find(b => b.category === cat)?.amount || 0;
      const diff = amountB - amountA;
      const pct = amountA > 0 ? ((diff / amountA) * 100) : (amountB > 0 ? 100 : 0);

      return { category: cat, amountA, amountB, diff, pct, color: getCategoryColor(cat) };
    }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  }, [breakdownA, breakdownB, categories]);

  // Chart data
  const chartData = useMemo(() =>
    comparison.map(c => ({
      name: c.category,
      [formatMonth(monthA)]: c.amountA,
      [formatMonth(monthB)]: c.amountB,
    })),
    [comparison, monthA, monthB]
  );

  const totalA = breakdownA.reduce((s, b) => s + b.amount, 0);
  const totalB = breakdownB.reduce((s, b) => s + b.amount, 0);
  const totalDiff = totalB - totalA;
  const totalPct = totalA > 0 ? ((totalDiff / totalA) * 100) : 0;

  const hasData = comparison.length > 0;

  return (
    <div className="space-y-6">
      {/* Month selectors */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block text-muted-foreground">Mês Base</label>
          <Select value={monthA} onValueChange={setMonthA}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end pb-2 text-muted-foreground font-medium">vs</div>
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block text-muted-foreground">Mês Comparação</label>
          <Select value={monthB} onValueChange={setMonthB}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Total summary */}
      <div className="rounded-lg border bg-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="text-sm text-muted-foreground">Total {formatMonth(monthA)}</p>
          <p className="text-lg font-semibold">{formatCurrency(totalA)}</p>
        </div>
        <div className="text-center">
          <DiffBadge diff={totalDiff} pct={totalPct} />
        </div>
        <div className="text-center sm:text-right">
          <p className="text-sm text-muted-foreground">Total {formatMonth(monthB)}</p>
          <p className="text-lg font-semibold">{formatCurrency(totalB)}</p>
        </div>
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center h-[200px] text-muted-foreground">
          Sem dados para comparar nos meses selecionados
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(v) => `R$${v}`}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  color: 'hsl(var(--card-foreground))',
                }}
              />
              <Legend />
              <Bar dataKey={formatMonth(monthA)} fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              <Bar dataKey={formatMonth(monthB)} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Detail table */}
          <div className="space-y-2">
            {comparison.map(c => (
              <div
                key={c.category}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="font-medium text-sm">{c.category}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground w-24 text-right">{formatCurrency(c.amountA)}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium w-24 text-right">{formatCurrency(c.amountB)}</span>
                  <DiffBadge diff={c.diff} pct={c.pct} compact />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DiffBadge({ diff, pct, compact }: { diff: number; pct: number; compact?: boolean }) {
  const isUp = diff > 0;
  const isZero = diff === 0;
  const Icon = isZero ? Minus : isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1',
        compact ? 'text-xs px-2 py-0.5 w-20 justify-center' : 'text-sm px-3 py-1',
        isZero
          ? 'border-muted-foreground/30 text-muted-foreground'
          : isUp
            ? 'border-expense/30 text-expense'
            : 'border-income/30 text-income'
      )}
    >
      <Icon className={cn(compact ? 'h-3 w-3' : 'h-4 w-4')} />
      {isZero ? '0%' : `${pct > 0 ? '+' : ''}${pct.toFixed(0)}%`}
    </Badge>
  );
}
