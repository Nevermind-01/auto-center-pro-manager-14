import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Package, 
  Users, 
  TrendingUp, 
  AlertTriangle
} from "lucide-react";

const Dashboard = () => {
  // Dados mockados - substituir por dados reais
  const stats = {
    totalVendas: 12500.00,
    produtosEstoque: 45,
    clientesAtivos: 28,
    crescimento: 12.5
  };


  const vendasRecentes = [
    { id: 1, cliente: "João Silva", produto: "Troca de Óleo", valor: 85.00, status: "Pago" },
    { id: 2, cliente: "Maria Santos", produto: "Alinhamento", valor: 120.00, status: "Pendente" },
    { id: 3, cliente: "Pedro Costa", produto: "Balanceamento", valor: 95.00, status: "Pago" },
  ];

  const produtosBaixoEstoque = [
    { nome: "Óleo Motor 5W30", estoque: 3, minimo: 10 },
    { nome: "Filtro de Ar", estoque: 5, minimo: 15 },
    { nome: "Pastilha de Freio", estoque: 2, minimo: 8 },
  ];

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
            <div className="text-2xl font-bold">R$ {stats.totalVendas.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.crescimento}% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos em Estoque</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.produtosEstoque}</div>
            <p className="text-xs text-muted-foreground">
              3 produtos com estoque baixo
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clientesAtivos}</div>
            <p className="text-xs text-muted-foreground">
              Cadastrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">+{stats.crescimento}%</div>
            <p className="text-xs text-muted-foreground">
              Comparado ao mês anterior
            </p>
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
            <div className="space-y-4">
              {vendasRecentes.map((venda) => (
                <div key={venda.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{venda.cliente}</p>
                    <p className="text-sm text-muted-foreground">{venda.produto}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ {venda.valor.toFixed(2)}</p>
                    <Badge 
                      variant={venda.status === "Pago" ? "default" : "outline"}
                      className="text-xs"
                    >
                      {venda.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Ver Todas as Vendas
            </Button>
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
          <div className="space-y-4">
            {produtosBaixoEstoque.map((produto, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                <div>
                  <p className="font-medium">{produto.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    Estoque atual: {produto.estoque} | Mínimo: {produto.minimo}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Reabastecer
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;