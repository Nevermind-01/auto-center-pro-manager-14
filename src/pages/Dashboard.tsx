import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, 
  Package, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  TrendingDown
} from "lucide-react";
import { useVendas, useProdutos, useClientes } from "@/hooks/useSupabaseQueries";
import { DateRangePicker } from "@/components/DateRangePicker";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { startOfDay, endOfDay, subDays } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Default to last 30 days
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(subDays(new Date(), 30)),
    to: endOfDay(new Date())
  });

  // Calculate filters for the hook
  const filters = useMemo(() => {
    if (!dateRange?.from) return undefined;
    return {
      startDate: dateRange.from,
      endDate: dateRange.to || dateRange.from
    };
  }, [dateRange]);

  const { data: vendas, isLoading: vendasLoading } = useVendas(filters);
  const { data: produtos, isLoading: produtosLoading } = useProdutos();
  const { data: clientes, isLoading: clientesLoading } = useClientes();

  // Get all sales for growth calculation
  const { data: allVendas } = useVendas();

  // Calculate sales statistics for the selected period
  const vendasStats = useMemo(() => {
    if (!vendas || !dateRange?.from) return { totalVendas: 0, crescimento: 0 };

    const vendasPagas = vendas.filter(v => v.status === 'finalizada');
    const totalVendas = vendasPagas.reduce((acc, v) => acc + Number(v.valor_total), 0);

    // Calculate growth compared to previous period of same length
    const periodDays = dateRange.to 
      ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 1000)) + 1
      : 1;
    
    const previousStart = new Date(dateRange.from.getTime() - (periodDays * 24 * 60 * 60 * 1000));
    const previousEnd = new Date(dateRange.from.getTime() - (24 * 60 * 60 * 1000));

    // For growth calculation, we need all sales (not filtered by date range)
    const vendasPreviousPeriod = allVendas?.filter(v => {
      const dataVenda = new Date(v.created_at);
      return v.status === 'finalizada' && 
             dataVenda >= previousStart && 
             dataVenda <= previousEnd;
    }) || [];

    const totalVendasAnterior = vendasPreviousPeriod.reduce((acc, v) => acc + Number(v.valor_total), 0);
    
    const crescimento = totalVendasAnterior > 0 
      ? ((totalVendas - totalVendasAnterior) / totalVendasAnterior) * 100 
      : totalVendas > 0 ? 100 : 0;

    return {
      totalVendas,
      crescimento: Math.round(crescimento * 10) / 10
    };
  }, [vendas, allVendas, dateRange]);

  // Calculate product statistics
  const produtosStats = useMemo(() => {
    if (!produtos) return { total: 0, estoqueBaixo: 0 };

    const produtosAtivos = produtos.filter(p => p.status === 'ativo');
    const produtosEstoqueBaixo = produtosAtivos.filter(p => 
      p.quantidade < (p.estoque_minimo || 5)
    );

    return {
      total: produtosAtivos.length,
      estoqueBaixo: produtosEstoqueBaixo.length
    };
  }, [produtos]);

  // Calculate client growth for the selected period
  const clientesStats = useMemo(() => {
    if (!clientes || !dateRange?.from) return { total: 0, crescimento: 0 };

    const clientesPeriodo = clientes.filter(c => {
      const dataCliente = new Date(c.created_at);
      return dataCliente >= dateRange.from! && 
             dataCliente <= (dateRange.to || dateRange.from!);
    });

    // Calculate growth compared to previous period
    const periodDays = dateRange.to 
      ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
      : 1;
    
    const previousStart = new Date(dateRange.from.getTime() - (periodDays * 24 * 60 * 60 * 1000));
    const previousEnd = new Date(dateRange.from.getTime() - 1);

    const clientesPeriodoAnterior = clientes.filter(c => {
      const dataCliente = new Date(c.created_at);
      return dataCliente >= previousStart && dataCliente <= previousEnd;
    });

    const crescimento = clientesPeriodoAnterior.length > 0 
      ? ((clientesPeriodo.length - clientesPeriodoAnterior.length) / clientesPeriodoAnterior.length) * 100 
      : clientesPeriodo.length > 0 ? 100 : 0;

    return {
      total: clientes.length,
      crescimento: Math.round(crescimento * 10) / 10
    };
  }, [clientes, dateRange]);

  // Recent sales (3 most recent from filtered data)
  const vendasRecentes = useMemo(() => {
    if (!vendas) return [];
    
    return vendas
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .map(venda => ({
        id: venda.id,
        cliente: venda.cliente_nome,
        produto: venda.observacoes || "Serviço Automotivo",
        valor: Number(venda.valor_total),
        status: venda.status === 'finalizada' ? 'Pago' : 
                venda.status === 'pendente' ? 'Pendente' : 'Cancelado'
      }));
  }, [vendas]);

  // Products with low stock
  const produtosBaixoEstoque = useMemo(() => {
    if (!produtos) return [];
    
    return produtos
      .filter(p => p.status === 'ativo' && p.quantidade < (p.estoque_minimo || 5))
      .map(produto => ({
        id: produto.id,
        nome: produto.nome,
        estoque: produto.quantidade,
        minimo: produto.estoque_minimo || 5
      }));
  }, [produtos]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu auto center</p>
        </div>
        <DateRangePicker 
          value={dateRange} 
          onChange={setDateRange}
          className="w-full sm:w-auto"
        />
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {vendasLoading ? (
              <Skeleton className="h-8 w-32 mb-2" />
            ) : (
              <div className="text-2xl font-bold">R$ {vendasStats.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            )}
            {vendasLoading ? (
              <Skeleton className="h-4 w-40" />
            ) : (
              <p className="text-xs text-muted-foreground flex items-center">
                {vendasStats.crescimento >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 text-destructive" />
                )}
                {vendasStats.crescimento >= 0 ? '+' : ''}{vendasStats.crescimento}% em relação ao mês anterior
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos em Estoque</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {produtosLoading ? (
              <Skeleton className="h-8 w-16 mb-2" />
            ) : (
              <div className="text-2xl font-bold">{produtosStats.total}</div>
            )}
            {produtosLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <p className="text-xs text-muted-foreground">
                {produtosStats.estoqueBaixo} produto{produtosStats.estoqueBaixo !== 1 ? 's' : ''} com estoque baixo
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {clientesLoading ? (
              <Skeleton className="h-8 w-16 mb-2" />
            ) : (
              <div className="text-2xl font-bold">{clientesStats.total}</div>
            )}
            {clientesLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <p className="text-xs text-muted-foreground">
                Cadastrados no sistema
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
            {clientesStats.crescimento >= 0 ? (
              <TrendingUp className="h-4 w-4 text-primary" />
            ) : (
              <TrendingDown className="h-4 w-4 text-primary" />
            )}
          </CardHeader>
          <CardContent>
            {clientesLoading ? (
              <Skeleton className="h-8 w-20 mb-2" />
            ) : (
              <div className={`text-2xl font-bold ${clientesStats.crescimento >= 0 ? 'text-success' : 'text-destructive'}`}>
                {clientesStats.crescimento >= 0 ? '+' : ''}{clientesStats.crescimento}%
              </div>
            )}
            {clientesLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <p className="text-xs text-muted-foreground">
                Comparado ao mês anterior
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas Recentes */}
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
            <CardDescription>Últimas transações realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            {vendasLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="text-right space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {vendasRecentes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma venda encontrada
                    </p>
                  ) : (
                    vendasRecentes.map((venda) => (
                      <div key={venda.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{venda.cliente}</p>
                          <p className="text-sm text-muted-foreground">{venda.produto}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">R$ {venda.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <Badge 
                            variant={venda.status === "Pago" ? "default" : venda.status === "Pendente" ? "outline" : "destructive"}
                            className="text-xs"
                          >
                            {venda.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => navigate('/sales')}
                >
                  Ver Todas as Vendas
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Produtos com Estoque Baixo */}
      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <span>Produtos com Estoque Baixo</span>
          </CardTitle>
          <CardDescription>
            Produtos que precisam de reposição urgente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {produtosLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {produtosBaixoEstoque.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Todos os produtos estão com estoque adequado
                </p>
              ) : (
                produtosBaixoEstoque.map((produto) => (
                  <div key={produto.id} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                    <div>
                      <p className="font-medium">{produto.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        Estoque atual: {produto.estoque} | Mínimo: {produto.minimo}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/inventory-supabase')}
                    >
                      Reabastecer
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;