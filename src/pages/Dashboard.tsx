import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  PiggyBank,
  LayoutDashboard,
  History,
  PieChart,
  Menu,
  LogOut,
  User,
  Tags,
} from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { useCategoryContext } from '@/contexts/CategoryContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { StatCard } from '@/components/finance/StatCard';
import { TransactionForm } from '@/components/finance/TransactionForm';
import { TransactionList } from '@/components/finance/TransactionList';
import { CategoryBreakdownChart } from '@/components/finance/CategoryBreakdownChart';
import { IncomeExpenseChart } from '@/components/finance/IncomeExpenseChart';
import { BalanceTrendChart } from '@/components/finance/BalanceTrendChart';
import { GoalProgress } from '@/components/finance/GoalProgress';
import { FinancialInsights } from '@/components/finance/FinancialInsights';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  getCurrentMonth, 
  formatMonth, 
  getMonthOptions 
} from '@/lib/formatters';
import { TransactionType } from '@/types/finance';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, signOut } = useAuthContext();
  const { categories } = useCategoryContext();
  const { 
    transactions, 
    isLoaded, 
    getMonthlyStats, 
    getCategoryBreakdown, 
    getMonthlyTrend,
    filterTransactions,
    totalBalance,
  } = useFinance();

  // Filters state
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const monthlyStats = getMonthlyStats(selectedMonth);
  const categoryBreakdown = getCategoryBreakdown(selectedMonth);
  const monthlyTrend = getMonthlyTrend();
  const monthOptions = getMonthOptions();

  // Filtered transactions
  const filteredTransactions = filterTransactions({
    month: selectedMonth,
    type: selectedType !== 'all' ? selectedType : undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: searchQuery || undefined,
  });

  // Calculate trend compared to previous month
  const currentMonthIndex = monthlyTrend.findIndex(t => t.month === selectedMonth);
  const previousMonth = currentMonthIndex > 0 ? monthlyTrend[currentMonthIndex - 1] : null;

  const incomeTrend = previousMonth && previousMonth.totalIncome > 0
    ? ((monthlyStats.totalIncome - previousMonth.totalIncome) / previousMonth.totalIncome) * 100
    : 0;

  const expenseTrend = previousMonth && previousMonth.totalExpense > 0
    ? ((monthlyStats.totalExpense - previousMonth.totalExpense) / previousMonth.totalExpense) * 100
    : 0;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Até logo!',
        description: 'Você saiu da sua conta.',
      });
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível sair.',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const NavigationContent = () => (
    <nav className="space-y-2">
      <Button variant="ghost" className="w-full justify-start gap-3">
        <LayoutDashboard className="h-5 w-5" />
        Dashboard
      </Button>
      <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => navigate('/categories')}>
        <Tags className="h-5 w-5" />
        Categorias
      </Button>
      <Button variant="ghost" className="w-full justify-start gap-3">
        <History className="h-5 w-5" />
        Histórico
      </Button>
      <Button variant="ghost" className="w-full justify-start gap-3">
        <PieChart className="h-5 w-5" />
        Relatórios
      </Button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="flex items-center gap-2 mb-8">
                  <div className="rounded-lg bg-primary p-2">
                    <Wallet className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-lg">Finance Controller</span>
                </div>
                <NavigationContent />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary p-2">
                <Wallet className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl hidden sm:inline">Finance Controller Pro</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TransactionForm />
            <ThemeToggle />
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(profile?.display_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{profile?.display_name || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground">Minha conta</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2">
                  <User className="h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-destructive" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Saldo Total"
            value={totalBalance}
            icon={Wallet}
            variant="balance"
            delay={0}
          />
          <StatCard
            title="Entradas do Mês"
            value={monthlyStats.totalIncome}
            icon={ArrowUpCircle}
            variant="income"
            trend={incomeTrend}
            delay={100}
          />
          <StatCard
            title="Saídas do Mês"
            value={monthlyStats.totalExpense}
            icon={ArrowDownCircle}
            variant="expense"
            trend={expenseTrend}
            delay={200}
          />
          <StatCard
            title="Economia do Mês"
            value={monthlyStats.balance}
            icon={PiggyBank}
            delay={300}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4 hidden sm:inline" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <History className="h-4 w-4 hidden sm:inline" />
              Transações
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <PieChart className="h-4 w-4 hidden sm:inline" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Goal Progress */}
              <GoalProgress />
              
              {/* Financial Insights */}
              <FinancialInsights />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Category Breakdown */}
              <div className="finance-card animate-slide-up" style={{ animationDelay: '500ms' }}>
                <h3 className="font-semibold mb-4">Gastos por Categoria</h3>
                <CategoryBreakdownChart data={categoryBreakdown} />
              </div>

              {/* Income vs Expense */}
              <div className="finance-card animate-slide-up" style={{ animationDelay: '550ms' }}>
                <h3 className="font-semibold mb-4">Entradas vs Saídas</h3>
                <IncomeExpenseChart data={monthlyTrend} />
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="finance-card animate-slide-up" style={{ animationDelay: '600ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Transações Recentes</h3>
                <Button variant="link" className="text-primary">
                  Ver todas
                </Button>
              </div>
              <TransactionList transactions={transactions.slice(0, 5)} />
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            {/* Filters */}
            <div className="finance-card">
              <h3 className="font-semibold mb-4">Filtros</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Mês</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo</label>
                  <Select 
                    value={selectedType} 
                    onValueChange={(v) => setSelectedType(v as TransactionType | 'all')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="income">Entradas</SelectItem>
                      <SelectItem value="expense">Saídas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Categoria</label>
                  <Select 
                    value={selectedCategory} 
                    onValueChange={(v) => setSelectedCategory(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categories.filter(c => !c.parentId).map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Buscar</label>
                  <Input
                    placeholder="Buscar por descrição..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Transaction List */}
            <div className="finance-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  Transações - {formatMonth(selectedMonth)}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {filteredTransactions.length} transações
                </span>
              </div>
              <TransactionList transactions={filteredTransactions} />
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            {/* Balance Trend */}
            <div className="finance-card">
              <h3 className="font-semibold mb-4">Evolução do Saldo (Últimos 6 meses)</h3>
              <BalanceTrendChart data={monthlyTrend} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Category Breakdown */}
              <div className="finance-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Gastos por Categoria</h3>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <CategoryBreakdownChart data={categoryBreakdown} />
              </div>

              {/* Income vs Expense Comparison */}
              <div className="finance-card">
                <h3 className="font-semibold mb-4">Comparativo Mensal</h3>
                <IncomeExpenseChart data={monthlyTrend} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-12">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>Finance Controller Pro © {new Date().getFullYear()}</p>
          <p className="mt-1">Seu controle financeiro pessoal</p>
        </div>
      </footer>
    </div>
  );
}
