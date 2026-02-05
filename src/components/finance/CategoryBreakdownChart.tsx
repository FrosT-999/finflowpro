import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { useCategoryContext } from '@/contexts/CategoryContext';

interface CategoryBreakdownChartProps {
  data: { category: string; amount: number }[];
}

const FALLBACK_COLORS = [
  'hsl(221, 83%, 53%)',  // Primary blue
  'hsl(142, 71%, 45%)',  // Green
  'hsl(0, 84%, 60%)',    // Red
  'hsl(38, 92%, 50%)',   // Yellow
  'hsl(262, 83%, 58%)',  // Purple
  'hsl(199, 89%, 48%)',  // Cyan
  'hsl(330, 81%, 60%)',  // Pink
  'hsl(25, 95%, 53%)',   // Orange
];

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const { categories } = useCategoryContext();

  const getCategoryColor = (categoryName: string, index: number) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Sem dados para exibir
      </div>
    );
  }

  const chartData = data.map((item, index) => ({
    name: item.category,
    value: item.amount,
    color: getCategoryColor(item.category, index),
  }));

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), 'Valor']}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
          }}
        />
        <Legend
          formatter={(value: string, entry: any) => {
            const percentage = ((entry.payload.value / total) * 100).toFixed(1);
            return `${value} (${percentage}%)`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
