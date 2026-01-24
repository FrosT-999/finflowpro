import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: number;
  variant?: 'default' | 'income' | 'expense' | 'balance';
  className?: string;
  delay?: number;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  variant = 'default',
  className,
  delay = 0,
}: StatCardProps) {
  const variantStyles = {
    default: 'finance-card',
    income: 'finance-card-income',
    expense: 'finance-card-expense',
    balance: 'finance-card-balance',
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    income: 'bg-income/10 text-income',
    expense: 'bg-expense/10 text-expense',
    balance: 'bg-white/20 text-white',
  };

  const valueStyles = {
    default: 'text-foreground',
    income: 'text-income',
    expense: 'text-expense',
    balance: 'text-white',
  };

  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
  const trendColor = trend && trend > 0 ? 'text-income' : trend && trend < 0 ? 'text-expense' : 'text-muted-foreground';

  return (
    <div 
      className={cn(
        variantStyles[variant],
        'animate-slide-up',
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn(
            'stat-label',
            variant === 'balance' && 'text-white/80'
          )}>
            {title}
          </p>
          <p className={cn('stat-value animate-number', valueStyles[variant])}>
            {formatCurrency(value)}
          </p>
          {trend !== undefined && (
            <div className={cn('stat-trend-up', trendColor, variant === 'balance' && 'text-white/90')}>
              <TrendIcon className="h-4 w-4" />
              <span>{Math.abs(trend).toFixed(1)}% vs mês anterior</span>
            </div>
          )}
        </div>
        <div className={cn(
          'rounded-xl p-3',
          iconStyles[variant]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
