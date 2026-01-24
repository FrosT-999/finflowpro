import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

interface BalanceTrendChartProps {
  data: {
    label: string;
    balance: number;
  }[];
}

export function BalanceTrendChart({ data }: BalanceTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Sem dados para exibir
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
          formatter={(value: number) => [formatCurrency(value), 'Saldo']}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
          }}
        />
        <Line 
          type="monotone" 
          dataKey="balance" 
          stroke="hsl(221, 83%, 53%)" 
          strokeWidth={3}
          dot={{ fill: 'hsl(221, 83%, 53%)', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
