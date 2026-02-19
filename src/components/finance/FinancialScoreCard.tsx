import { useState } from 'react';
import {
  Zap, CalendarCheck, Shield, AlertTriangle, TrendingUp,
  Info, ChevronRight, Award, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinancialScore, PillarScore } from '@/hooks/useFinancialScore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  CalendarCheck,
  Shield,
  AlertTriangle,
  TrendingUp,
};

const STATUS_CONFIG = {
  Crítico:   { color: 'text-expense',  bg: 'bg-expense/10',  border: 'border-expense/30',  bar: 'bg-expense',        dot: 'bg-expense' },
  Atenção:   { color: 'text-warning',  bg: 'bg-warning/10',  border: 'border-warning/30',  bar: 'bg-warning',        dot: 'bg-warning' },
  Saudável:  { color: 'text-primary',  bg: 'bg-primary/10',  border: 'border-primary/30',  bar: 'bg-primary',        dot: 'bg-primary' },
  Excelente: { color: 'text-income',   bg: 'bg-income/10',   border: 'border-income/30',   bar: 'bg-income',         dot: 'bg-income' },
};

const OVERALL_GRADIENT = {
  Crítico:   'from-expense to-red-400',
  Atenção:   'from-warning to-amber-400',
  Saudável:  'from-primary to-blue-400',
  Excelente: 'from-income to-emerald-400',
};

function PillarModal({ pillar, open, onClose }: { pillar: PillarScore; open: boolean; onClose: () => void }) {
  const Icon = ICON_MAP[pillar.icon] || Info;
  const cfg = STATUS_CONFIG[pillar.status];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn('rounded-xl p-2.5', cfg.bg)}>
              <Icon className={cn('h-5 w-5', cfg.color)} />
            </div>
            <span>{pillar.name}</span>
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4 pt-2">
              {/* Score display */}
              <div className={cn('rounded-xl p-4 border', cfg.bg, cfg.border)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Sua pontuação</span>
                  <span className={cn('text-2xl font-bold', cfg.color)}>{pillar.score}</span>
                </div>
                <Progress value={pillar.score} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0</span>
                  <span className={cn('font-medium', cfg.color)}>{pillar.status}</span>
                  <span>100</span>
                </div>
              </div>

              {/* Details sections */}
              <div className="space-y-3">
                <section>
                  <h4 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-primary" />
                    Como é calculado
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{pillar.details.how}</p>
                </section>

                <section>
                  <h4 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-income" />
                    O que melhorar
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{pillar.details.improve}</p>
                </section>

                <section>
                  <h4 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-warning" />
                    Impacto no score geral
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{pillar.details.impact}</p>
                </section>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

function PillarCard({ pillar, onClick }: { pillar: PillarScore; onClick: () => void }) {
  const Icon = ICON_MAP[pillar.icon] || Info;
  const cfg = STATUS_CONFIG[pillar.status];

  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex flex-col gap-3 p-4 rounded-xl border transition-all duration-300 text-left w-full',
        'bg-card hover:shadow-md hover:-translate-y-0.5',
        cfg.border,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className={cn('rounded-lg p-2', cfg.bg)}>
          <Icon className={cn('h-4 w-4', cfg.color)} />
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>

      {/* Name + score */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">{pillar.name}</p>
        <p className={cn('text-2xl font-bold', cfg.color)}>{pillar.score}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', cfg.bar)}
          style={{ width: `${pillar.score}%` }}
        />
      </div>

      {/* Status badge + phrase */}
      <div className="space-y-1">
        <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
          {pillar.status}
        </span>
        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{pillar.phrase}</p>
      </div>
    </button>
  );
}

export function FinancialScoreCard() {
  const score = useFinancialScore();
  const [selectedPillar, setSelectedPillar] = useState<PillarScore | null>(null);

  const overallCfg = STATUS_CONFIG[score.status];
  const gradientClass = OVERALL_GRADIENT[score.status];

  return (
    <div className="space-y-4 animate-slide-up" style={{ animationDelay: '50ms' }}>
      {/* Main Score Card */}
      <div className={cn(
        'relative overflow-hidden rounded-2xl p-6 text-white',
        `bg-gradient-to-br ${gradientClass}`,
      )}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-12 translate-x-12 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-8 -translate-x-8 pointer-events-none" />

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-white/80" />
              <p className="text-sm font-medium text-white/80">Score Comportamental</p>
            </div>

            {score.hasData ? (
              <>
                <div className="flex items-end gap-3 mb-2">
                  <span className="text-6xl font-black tracking-tight">{score.overall}</span>
                  <span className="text-xl font-medium text-white/60 mb-2">/100</span>
                </div>
                <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-sm font-semibold px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  {score.status}
                </span>
              </>
            ) : (
              <div className="text-2xl font-bold mt-2 text-white/90">—</div>
            )}

            <p className="mt-3 text-sm text-white/80 leading-relaxed max-w-xs">
              {score.phrase}
            </p>
          </div>

          {/* Circular score indicator */}
          {score.hasData && (
            <div className="relative shrink-0 w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />
                <circle
                  cx="18" cy="18" r="15.9"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeDasharray={`${score.overall} ${100 - score.overall}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Award className="h-8 w-8 text-white/90" />
              </div>
            </div>
          )}
        </div>

        {/* Pillar weight summary */}
        {score.hasData && (
          <div className="relative mt-4 pt-4 border-t border-white/20 grid grid-cols-5 gap-1">
            {score.pillars.map(p => (
              <div key={p.id} className="text-center">
                <div className="text-xs font-bold text-white">{p.score}</div>
                <div className="text-[10px] text-white/60 leading-tight truncate">{p.name.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pillar Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {score.pillars.map(pillar => (
          <PillarCard
            key={pillar.id}
            pillar={pillar}
            onClick={() => setSelectedPillar(pillar)}
          />
        ))}
      </div>

      {/* Modal */}
      {selectedPillar && (
        <PillarModal
          pillar={selectedPillar}
          open={!!selectedPillar}
          onClose={() => setSelectedPillar(null)}
        />
      )}
    </div>
  );
}
