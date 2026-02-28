import { Link } from 'react-router-dom';
import { 
  Wallet, 
  TrendingUp, 
  PieChart, 
  Target, 
  Shield, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2,
  Zap,
  LineChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';

// Fictional chart SVG components for visual appeal
function MiniBarChart() {
  return (
    <svg viewBox="0 0 200 100" className="w-full h-full" preserveAspectRatio="none">
      <rect x="10" y="60" width="20" height="40" rx="4" fill="hsl(var(--chart-1))" opacity="0.8" />
      <rect x="40" y="30" width="20" height="70" rx="4" fill="hsl(var(--chart-2))" opacity="0.8" />
      <rect x="70" y="45" width="20" height="55" rx="4" fill="hsl(var(--chart-1))" opacity="0.8" />
      <rect x="100" y="15" width="20" height="85" rx="4" fill="hsl(var(--chart-2))" opacity="0.8" />
      <rect x="130" y="35" width="20" height="65" rx="4" fill="hsl(var(--chart-1))" opacity="0.8" />
      <rect x="160" y="10" width="20" height="90" rx="4" fill="hsl(var(--chart-2))" opacity="0.8" />
    </svg>
  );
}

function MiniLineChart() {
  return (
    <svg viewBox="0 0 200 100" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0,80 Q30,70 50,55 T100,35 T150,20 T200,10" fill="none" stroke="hsl(var(--chart-1))" strokeWidth="3" />
      <path d="M0,80 Q30,70 50,55 T100,35 T150,20 T200,10 L200,100 L0,100 Z" fill="url(#lineGrad)" />
    </svg>
  );
}

function MiniPieChart() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
      <circle 
        cx="50" cy="50" r="40" fill="none" 
        stroke="hsl(var(--chart-1))" strokeWidth="8" 
        strokeDasharray="125.6 251.2" strokeDashoffset="0" 
        transform="rotate(-90 50 50)" 
      />
      <circle 
        cx="50" cy="50" r="40" fill="none" 
        stroke="hsl(var(--chart-2))" strokeWidth="8" 
        strokeDasharray="75.4 251.2" strokeDashoffset="-125.6" 
        transform="rotate(-90 50 50)" 
      />
      <circle 
        cx="50" cy="50" r="40" fill="none" 
        stroke="hsl(var(--chart-4))" strokeWidth="8" 
        strokeDasharray="50.2 251.2" strokeDashoffset="-201" 
        transform="rotate(-90 50 50)" 
      />
    </svg>
  );
}

function DashboardPreview() {
  return (
    <div className="rounded-xl border bg-card p-4 md:p-6 shadow-xl space-y-4 animate-fade-in">
      {/* Stat cards row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-primary/10 p-3 text-center">
          <p className="text-xs text-muted-foreground">Receitas</p>
          <p className="text-lg font-bold text-income">R$ 8.450</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-3 text-center">
          <p className="text-xs text-muted-foreground">Despesas</p>
          <p className="text-lg font-bold text-expense">R$ 5.230</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-3 text-center">
          <p className="text-xs text-muted-foreground">Saldo</p>
          <p className="text-lg font-bold text-primary">R$ 3.220</p>
        </div>
      </div>
      {/* Chart */}
      <div className="h-28 md:h-36">
        <MiniLineChart />
      </div>
      {/* Transactions */}
      <div className="space-y-2">
        {[
          { label: 'Salário', amount: '+ R$ 5.000', color: 'text-income' },
          { label: 'Mercado', amount: '- R$ 820', color: 'text-expense' },
          { label: 'Freelance', amount: '+ R$ 3.450', color: 'text-income' },
        ].map((t) => (
          <div key={t.label} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
            <span className="text-foreground">{t.label}</span>
            <span className={`font-semibold ${t.color}`}>{t.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const features = [
  {
    icon: BarChart3,
    title: 'Dashboard Completo',
    description: 'Visualize receitas, despesas e saldo em tempo real com gráficos interativos.',
  },
  {
    icon: PieChart,
    title: 'Categorias Inteligentes',
    description: 'Organize suas transações com categorias personalizáveis e análise por categoria.',
  },
  {
    icon: Target,
    title: 'Metas Financeiras',
    description: 'Defina e acompanhe suas metas de economia com progresso visual.',
  },
  {
    icon: TrendingUp,
    title: 'Score Comportamental',
    description: 'Receba uma pontuação baseada nos seus hábitos financeiros em 5 pilares.',
  },
  {
    icon: Shield,
    title: 'Dados Seguros',
    description: 'Seus dados são criptografados e protegidos com autenticação segura.',
  },
  {
    icon: Zap,
    title: 'Insights Automáticos',
    description: 'Receba dicas personalizadas para melhorar sua saúde financeira.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Crie sua conta',
    description: 'Cadastre-se gratuitamente em poucos segundos.',
  },
  {
    number: '02',
    title: 'Registre transações',
    description: 'Adicione suas receitas e despesas facilmente ou importe via CSV.',
  },
  {
    number: '03',
    title: 'Acompanhe seu progresso',
    description: 'Visualize gráficos, defina metas e melhore seu score financeiro.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-2">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">FinFlow Pro</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Começar Grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="space-y-6 animate-slide-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Zap className="h-4 w-4" />
              Controle financeiro simplificado
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Suas finanças no{' '}
              <span className="text-gradient-primary">controle total</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Registre receitas e despesas, acompanhe metas, analise seus gastos por categoria e receba um score comportamental para melhorar sua saúde financeira.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild className="gap-2">
                <Link to="/auth">
                  Começar Agora
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#features">Ver Recursos</a>
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-income" /> Grátis para usar
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-income" /> Sem cartão de crédito
              </span>
            </div>
          </div>
          <div className="animate-scale-in">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/30 py-16 md:py-24">
        <div className="container px-4">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Tudo que você precisa</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ferramentas poderosas para organizar, analisar e otimizar suas finanças pessoais.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 space-y-3">
                  <div className="rounded-lg bg-primary/10 p-3 w-fit group-hover:bg-primary/20 transition-colors">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Charts showcase */}
      <section className="container px-4 py-16 md:py-24">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold">Gráficos e Análises</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Visualize suas finanças de diferentes ângulos com gráficos detalhados.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="overflow-hidden">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Evolução do Saldo</h3>
              </div>
              <div className="h-32">
                <MiniLineChart />
              </div>
              <p className="text-xs text-muted-foreground">Acompanhe a tendência do seu saldo ao longo dos meses.</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Receitas vs Despesas</h3>
              </div>
              <div className="h-32">
                <MiniBarChart />
              </div>
              <p className="text-xs text-muted-foreground">Compare suas receitas e despesas mês a mês.</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Gastos por Categoria</h3>
              </div>
              <div className="h-32 flex items-center justify-center">
                <div className="w-28 h-28">
                  <MiniPieChart />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Veja para onde seu dinheiro está indo.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/30 py-16 md:py-24">
        <div className="container px-4">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Como Funciona</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Em apenas 3 passos simples você já estará no controle das suas finanças.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <div key={s.number} className="text-center space-y-4 relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
                <div className="mx-auto w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold relative z-10">
                  {s.number}
                </div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container px-4 py-16 md:py-24">
        <div className="rounded-2xl p-8 md:p-12 text-center space-y-6" style={{ background: 'var(--gradient-primary)' }}>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
            Pronto para transformar suas finanças?
          </h2>
          <p className="text-primary-foreground/80 max-w-lg mx-auto">
            Junte-se a milhares de pessoas que já organizam suas finanças com o FinFlow Pro.
          </p>
          <Button size="lg" variant="secondary" asChild className="gap-2">
            <Link to="/auth">
              Criar Conta Gratuita
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>FinFlow Pro © {new Date().getFullYear()} — Controle financeiro inteligente</p>
        </div>
      </footer>
    </div>
  );
}
