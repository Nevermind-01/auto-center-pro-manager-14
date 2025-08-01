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
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: vendas, isLoading: vendasLoading } = useVendas();
  const { data: produtos, isLoading: produtosLoading } = useProdutos();
  const { data: clientes, isLoading: clientesLoading } = useClientes();

  // Calcular estatísticas das vendas
  const vendasStats = useMemo(() => {
    if (!vendas) return { totalVendas: 0, crescimento: 0 };

    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();
    
    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoMesAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;

    const vendasPagas = vendas.filter(v => v.status === 'finalizada');
    
    const vendasMesAtual = vendasPagas.filter(v => {
      const dataVenda = new Date(v.created_at);
      return dataVenda.getMonth() === mesAtual && dataVenda.getFullYear() === anoAtual;
    });

    const vendasMesAnterior = vendasPagas.filter(v => {
      const dataVenda = new Date(v.created_at);
      return dataVenda.getMonth() === mesAnterior && dataVenda.getFullYear() === anoMesAnterior;
    });

    const totalMesAtual = vendasMesAtual.reduce((acc, v) => acc + Number(v.valor_total), 0);
    const totalMesAnterior = vendasMesAnterior.reduce((acc, v) => acc + Number(v.valor_total), 0);
    
    const crescimento = totalMesAnterior > 0 
      ? ((totalMesAtual - totalMesAnterior) / totalMesAnterior) * 100 
      : totalMesAtual > 0 ? 100 : 0;

    return {
      totalVendas: totalMesAtual,
      crescimento: Math.round(crescimento * 10) / 10
    };
  }, [vendas]);

  // Calcular estatísticas dos produtos
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

  // Calcular crescimento de clientes
  const clientesStats = useMemo(() => {
    if (!clientes) return { total: 0, crescimento: 0 };

    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();
    
    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoMesAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;

    const clientesMesAtual = clientes.filter(c => {
      const dataCliente = new Date(c.created_at);
      return dataCliente.getMonth() === mesAtual && dataCliente.getFullYear() === anoAtual;
    });

    const clientesMesAnterior = clientes.filter(c => {
      const dataCliente = new Date(c.created_at);
      return dataCliente.getMonth() === mesAnterior && dataCliente.getFullYear() === anoMesAnterior;
    });

    const crescimento = clientesMesAnterior.length > 0 
      ? ((clientesMesAtual.length - clientesMesAnterior.length) / clientesMesAnterior.length) * 100 
      : clientesMesAtual.length > 0 ? 100 : 0;

    return {
      total: clientes.length,
      crescimento: Math.round(crescimento * 10) / 10
    };
  }, [clientes]);

  // Vendas recentes (3 mais recentes)
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

  // Produtos com estoque baixo
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu auto center</p>
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