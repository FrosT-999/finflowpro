import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

interface IncomeExpenseChartProps {
  data: {
    label: string;
    totalIncome: number;
    totalExpense: number;
    balance: number;
  }[];
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Sem dados para exibir
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="label" 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            formatCurrency(value),
            name === 'totalIncome' ? 'Entradas' : 'Saídas'
          ]}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
          }}
        />
        <Legend 
          formatter={(value) => value === 'totalIncome' ? 'Entradas' : 'Saídas'}
        />
        <Bar 
          dataKey="totalIncome" 
          fill="hsl(142, 71%, 45%)" 
          radius={[4, 4, 0, 0]}
          name="totalIncome"
        />
        <Bar 
          dataKey="totalExpense" 
          fill="hsl(0, 84%, 60%)" 
          radius={[4, 4, 0, 0]}
          name="totalExpense"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
