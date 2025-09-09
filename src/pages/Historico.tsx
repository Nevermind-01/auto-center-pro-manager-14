import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useVendas, useVendaMutations, useLogMovimentacaoMutations } from "@/hooks/useSupabaseQueries";
import { useSupabaseEstoque } from "@/lib/supabaseEstoque";
import { ConfirmCancelModal } from "@/components/ConfirmCancelModal";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { FinalizarOSModal } from "@/components/FinalizarOSModal";
import { VisualizarOSModal } from "@/components/VisualizarOSModal";
import { 
  Search, 
  Edit, 
  X, 
  Eye,
  Calendar,
  DollarSign,
  User,
  FileText,
  Car,
  CheckCircle,
  Wrench,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type StatusFilter = 'todas' | 'pendente' | 'finalizada' | 'cancelada';

const statusOptions = [
  { value: 'todas', label: 'Todas' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'finalizada', label: 'Finalizada' },
  { value: 'cancelada', label: 'Cancelada' }
];

const getStatusBadge = (status: string) => {
  const statusConfig = {
    pendente: { variant: 'secondary' as const, label: 'Pendente' },
    finalizada: { variant: 'default' as const, label: 'Finalizada' },
    cancelada: { variant: 'destructive' as const, label: 'Cancelada' }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || 
    { variant: 'outline' as const, label: status };
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
};

const Historico = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas');
  const [vendaParaCancelar, setVendaParaCancelar] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [vendaParaFinalizar, setVendaParaFinalizar] = useState<any>(null);
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [vendaParaExcluir, setVendaParaExcluir] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [osParaVisualizar, setOsParaVisualizar] = useState<string | null>(null);
  const [showVisualizarModal, setShowVisualizarModal] = useState(false);
  
  const { data: vendas = [], isLoading } = useVendas();
  const { updateVenda, deleteVenda } = useVendaMutations();
  const { createLog } = useLogMovimentacaoMutations();
  const estoqueManager = useSupabaseEstoque();
  
  // Filter vendas based on search term and status
  const vendasFiltradas = useMemo(() => {
    return vendas.filter(venda => {
      // Filter by search term
      const matchesSearch = searchTerm === "" || 
        venda.numero_os.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venda.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by status
      const matchesStatus = statusFilter === 'todas' || venda.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [vendas, searchTerm, statusFilter]);
  
  // Group vendas by status for tabs
  const vendasPorStatus = useMemo(() => {
    return {
      todas: vendasFiltradas,
      pendente: vendasFiltradas.filter(v => v.status === 'pendente'),
      finalizada: vendasFiltradas.filter(v => v.status === 'finalizada'),
      cancelada: vendasFiltradas.filter(v => v.status === 'cancelada')
    };
  }, [vendasFiltradas]);

  const handleEditOS = (venda: any) => {
    if (venda.status === 'finalizada') {
      toast({
        title: "Ação não permitida",
        description: "Não é possível editar uma OS finalizada.",
        variant: "destructive",
      });
      return;
    }
    
    if (venda.status === 'cancelada') {
      toast({
        title: "Ação não permitida",
        description: "Não é possível editar uma OS cancelada.",
        variant: "destructive",
      });
      return;
    }
    
    // Navigate to edit page - this would need to be implemented
    navigate(`/nova-os?edit=${venda.id}`);
  };


  const handleCancelOS = (venda: any) => {
    if (venda.status === 'finalizada') {
      toast({
        title: "Ação não permitida",
        description: "Não é possível cancelar uma OS finalizada.",
        variant: "destructive",
      });
      return;
    }

    setVendaParaCancelar(venda);
    setShowCancelModal(true);
  };

  const confirmCancelOS = async () => {
    if (!vendaParaCancelar) return;

    try {
      await updateVenda.mutateAsync({
        id: vendaParaCancelar.id,
        status: 'cancelada'
      });

      // Registrar log de cancelamento
      await createLog.mutateAsync({
        os_id: vendaParaCancelar.id,
        tipo: 'cancelamento',
        usuario: 'Admin',
        observacoes: `OS ${vendaParaCancelar.numero_os} cancelada via botão`
      });
      
      toast({
        title: "OS cancelada",
        description: `OS ${vendaParaCancelar.numero_os} foi cancelada com sucesso.`,
      });

      setShowCancelModal(false);
      setVendaParaCancelar(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cancelar a OS. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleFinalizarOS = (venda: any) => {
    if (venda.status !== 'pendente') {
      toast({
        title: "Ação não permitida",
        description: "Apenas OS pendentes podem ser finalizadas.",
        variant: "destructive",
      });
      return;
    }

    setVendaParaFinalizar(venda);
    setShowFinalizarModal(true);
  };

  const handleViewDetails = (venda: any) => {
    setOsParaVisualizar(venda.id);
    setShowVisualizarModal(true);
  };

  const handleDeleteOS = (venda: any) => {
    if (venda.status !== 'cancelada') {
      toast({
        title: "Ação não permitida",
        description: "Apenas OS canceladas podem ser excluídas.",
        variant: "destructive",
      });
      return;
    }

    setVendaParaExcluir(venda);
    setShowDeleteModal(true);
  };

  const confirmDeleteOS = async () => {
    if (!vendaParaExcluir) return;

    try {
      await deleteVenda.mutateAsync(vendaParaExcluir.id);
      
      toast({
        title: "OS excluída",
        description: `OS ${vendaParaExcluir.numero_os} foi excluída permanentemente.`,
      });

      setShowDeleteModal(false);
      setVendaParaExcluir(null);
    } catch (error: any) {
      console.error('Erro ao excluir OS:', error);
      
      let errorMessage = "Erro ao excluir a OS. Tente novamente.";
      if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando histórico...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Histórico de OS</h1>
          <p className="text-muted-foreground">Visualize e gerencie todas as ordens de serviço</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            {vendasFiltradas.length} OS encontradas
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por número da OS ou nome do cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-48">
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OS List with Tabs */}
      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todas">
            Todas ({vendasPorStatus.todas.length})
          </TabsTrigger>
          <TabsTrigger value="pendente">
            Pendentes ({vendasPorStatus.pendente.length})
          </TabsTrigger>
          <TabsTrigger value="finalizada">
            Finalizadas ({vendasPorStatus.finalizada.length})
          </TabsTrigger>
          <TabsTrigger value="cancelada">
            Canceladas ({vendasPorStatus.cancelada.length})
          </TabsTrigger>
        </TabsList>

        {statusOptions.map(({ value }) => (
          <TabsContent key={value} value={value} className="space-y-4">
            {vendasPorStatus[value as keyof typeof vendasPorStatus].length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {value === 'todas' 
                      ? "Nenhuma OS encontrada" 
                      : `Nenhuma OS ${value} encontrada`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {vendasPorStatus[value as keyof typeof vendasPorStatus].map((venda) => (
                  <Card key={venda.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{venda.numero_os}</h3>
                              {getStatusBadge(venda.status!)}
                            </div>
                             <div className="space-y-1 text-sm text-muted-foreground">
                               <div className="flex items-center gap-2">
                                 <User className="h-4 w-4" />
                                 <span>{venda.cliente_nome}</span>
                               </div>
                                {venda.veiculo && (
                                  <div className="flex items-center gap-2">
                                    <Car className="h-4 w-4" />
                                    <span>
                                      {venda.veiculo.marca} {venda.veiculo.modelo} - {venda.veiculo.placa}
                                      {venda.veiculo.ano && ` (${venda.veiculo.ano})`}
                                    </span>
                                  </div>
                                )}
                               <div className="flex items-center gap-2">
                                 <DollarSign className="h-4 w-4" />
                                 <span>R$ {Number(venda.valor_final).toFixed(2)}</span>
                                 {venda.forma_pagamento && (
                                   <span className="text-xs bg-muted px-2 py-1 rounded">
                                     {venda.forma_pagamento}
                                   </span>
                                 )}
                               </div>
                               <div className="flex items-center gap-2">
                                 <Calendar className="h-4 w-4" />
                                 <span>{formatDate(venda.created_at)}</span>
                               </div>
                             </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(venda)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          
                          {venda.status === 'cancelada' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteOS(venda)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          )}
                          
                          {venda.status === 'pendente' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditOS(venda)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          )}
                          
                          {venda.status === 'pendente' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleFinalizarOS(venda)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Finalizar OS
                            </Button>
                          )}
                          
                          {venda.status !== 'finalizada' && venda.status !== 'cancelada' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelOS(venda)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Modal de confirmação de cancelamento */}
      <ConfirmCancelModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        onConfirm={confirmCancelOS}
        osNumero={vendaParaCancelar?.numero_os || ''}
      />
      
      {/* Modal de confirmação de exclusão */}
      <ConfirmDeleteModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={confirmDeleteOS}
        osNumero={vendaParaExcluir?.numero_os || ''}
      />
      
      {/* Modal de finalização */}
      <FinalizarOSModal
        open={showFinalizarModal}
        onOpenChange={(open) => {
          setShowFinalizarModal(open);
          if (!open) {
            setVendaParaFinalizar(null);
          }
        }}
        venda={vendaParaFinalizar}
      />
      
      {/* Modal de visualização */}
      <VisualizarOSModal
        open={showVisualizarModal}
        onOpenChange={(open) => {
          setShowVisualizarModal(open);
          if (!open) {
            setOsParaVisualizar(null);
          }
        }}
        osId={osParaVisualizar}
      />
    </div>
  );
};

export default Historico;