import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCarteiraCliente } from "@/hooks/useCarteiraCliente";
import { CarteiraClienteModal } from "@/components/CarteiraClienteModal";
import { formatCurrency } from "@/lib/utils";
import { Search, Wallet, Users, TrendingUp, Plus } from "lucide-react";

export const GestaoCarteiras = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);
  const [showCarteiraModal, setShowCarteiraModal] = useState(false);

  const { getTodosClientesComCarteira } = useCarteiraCliente();
  const clientesQuery = getTodosClientesComCarteira();

  const clientes = clientesQuery.data || [];

  // Filtrar clientes baseado na busca
  const clientesFiltrados = clientes.filter((cliente: any) => {
    const searchLower = searchTerm.toLowerCase();
    
    return (
      cliente?.nome?.toLowerCase().includes(searchLower) ||
      cliente?.email?.toLowerCase().includes(searchLower) ||
      cliente?.telefone?.toLowerCase().includes(searchLower)
    );
  });

  // Estatísticas
  const totalCarteiras = clientes.filter((cliente: any) => 
    cliente.clientes_carteira && cliente.clientes_carteira.length > 0
  ).length;
  
  const totalSaldo = clientes.reduce((total: number, cliente: any) => {
    const carteira = cliente.clientes_carteira?.[0];
    return total + (Number(carteira?.saldo_atual) || 0);
  }, 0);
  
  const carteirasAtivas = clientes.filter((cliente: any) => {
    const carteira = cliente.clientes_carteira?.[0];
    return Number(carteira?.saldo_atual) > 0;
  }).length;

  const handleOpenCarteira = (cliente: any) => {
    setClienteSelecionado({
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone
    });
    setShowCarteiraModal(true);
  };

  return (
    <div className="container flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Carteiras</h2>
          <p className="text-muted-foreground">
            Gerencie as carteiras digitais dos seus clientes
          </p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Carteiras</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCarteiras}</div>
            <p className="text-xs text-muted-foreground">
              Clientes com carteira
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carteiras Ativas</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{carteirasAtivas}</div>
            <p className="text-xs text-muted-foreground">
              Com saldo positivo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSaldo)}</div>
            <p className="text-xs text-muted-foreground">
              Em todas as carteiras
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes e Carteiras</CardTitle>
          <CardDescription>
            {clientesFiltrados.length} cliente(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientesQuery.isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando clientes...</p>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum cliente encontrado com os filtros aplicados' : 'Nenhum cliente cadastrado ainda'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {clientesFiltrados.map((cliente: any) => {
                const carteira = cliente.clientes_carteira?.[0];
                const saldo = Number(carteira?.saldo_atual) || 0;
                const temCarteira = carteira && carteira.id;
                
                return (
                  <div
                    key={cliente.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{cliente.nome}</h3>
                        <p className="text-sm text-muted-foreground">
                          {cliente.email || cliente.telefone || 'Contato não disponível'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          {formatCurrency(saldo)}
                        </p>
                        <Badge variant={temCarteira ? (saldo > 0 ? "default" : "secondary") : "outline"}>
                          {temCarteira ? (saldo > 0 ? "Ativo" : "Sem saldo") : "Sem carteira"}
                        </Badge>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenCarteira(cliente)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {temCarteira ? "Gerenciar" : "Criar Carteira"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal da Carteira */}
      <CarteiraClienteModal
        open={showCarteiraModal}
        onOpenChange={setShowCarteiraModal}
        cliente={clienteSelecionado}
      />
    </div>
  );
};