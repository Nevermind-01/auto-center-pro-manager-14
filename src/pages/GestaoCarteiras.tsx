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

  const { getCarteirasEmpresas } = useCarteiraCliente();
  const carteirasQuery = getCarteirasEmpresas();

  const carteiras = carteirasQuery.data || [];

  // Filtrar carteiras baseado na busca
  const carteirasFiltradas = carteiras.filter((carteira: any) => {
    const cliente = carteira.clientes;
    const searchLower = searchTerm.toLowerCase();
    
    return (
      cliente?.nome?.toLowerCase().includes(searchLower) ||
      cliente?.email?.toLowerCase().includes(searchLower) ||
      cliente?.telefone?.toLowerCase().includes(searchLower)
    );
  });

  // Estatísticas
  const totalCarteiras = carteiras.length;
  const totalSaldo = carteiras.reduce((total: number, carteira: any) => 
    total + (Number(carteira.saldo_atual) || 0), 0
  );
  const carteirasAtivas = carteiras.filter((carteira: any) => 
    Number(carteira.saldo_atual) > 0
  ).length;

  const handleOpenCarteira = (carteira: any) => {
    setClienteSelecionado({
      id: carteira.cliente_id,
      nome: carteira.clientes?.nome || 'Cliente',
      email: carteira.clientes?.email,
      telefone: carteira.clientes?.telefone
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

      {/* Lista de Carteiras */}
      <Card>
        <CardHeader>
          <CardTitle>Carteiras dos Clientes</CardTitle>
          <CardDescription>
            {carteirasFiltradas.length} carteira(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carteirasQuery.isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando carteiras...</p>
            </div>
          ) : carteirasFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhuma carteira encontrada com os filtros aplicados' : 'Nenhuma carteira criada ainda'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {carteirasFiltradas.map((carteira: any) => {
                const cliente = carteira.clientes;
                const saldo = Number(carteira.saldo_atual) || 0;
                
                return (
                  <div
                    key={carteira.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{cliente?.nome || 'Nome não disponível'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {cliente?.email || cliente?.telefone || 'Contato não disponível'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          {formatCurrency(saldo)}
                        </p>
                        <Badge variant={saldo > 0 ? "default" : "secondary"}>
                          {saldo > 0 ? "Ativo" : "Sem saldo"}
                        </Badge>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenCarteira(carteira)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Gerenciar
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