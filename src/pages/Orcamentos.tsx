import { useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Eye, Edit, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useOrcamentos, useOrcamentoMutations, useOrcamentoDetails, type Orcamento } from '@/hooks/useOrcamentos';
import { CriarOrcamentoModal } from '@/components/CriarOrcamentoModal';
import { VisualizarOrcamentoModal } from '@/components/VisualizarOrcamentoModal';
import { ConversaoOSModal } from '@/components/ConversaoOSModal';

export default function Orcamentos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [showCriarModal, setShowCriarModal] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null);
  const [showVisualizarModal, setShowVisualizarModal] = useState(false);
  const [showConversaoModal, setShowConversaoModal] = useState(false);
  const [orcamentoParaEditar, setOrcamentoParaEditar] = useState<any | null>(null);

  const { data: orcamentos = [], isLoading } = useOrcamentos();
  const { updateOrcamentoStatus, convertToOS } = useOrcamentoMutations();
  const { data: orcamentoDetails } = useOrcamentoDetails(orcamentoParaEditar?.id || null);

  const getStatusBadge = (status: Orcamento['status']) => {
    const variants = {
      pendente: { variant: 'secondary' as const, text: 'Pendente' },
      aprovado: { variant: 'default' as const, text: 'Aprovado' },
      rejeitado: { variant: 'destructive' as const, text: 'Rejeitado' },
      convertido_os: { variant: 'outline' as const, text: 'Convertido' },
    };
    
    const config = variants[status];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getStatusColor = (status: Orcamento['status']) => {
    const colors = {
      pendente: 'bg-orange-500',
      aprovado: 'bg-green-500',
      rejeitado: 'bg-red-500',
      convertido_os: 'bg-blue-500',
    };
    return colors[status];
  };

  const handleStatusChange = async (orcamentoId: string, newStatus: Orcamento['status']) => {
    await updateOrcamentoStatus.mutateAsync({ id: orcamentoId, status: newStatus });
  };

  const handleEditOrcamento = (orcamento: any) => {
    setOrcamentoParaEditar(orcamento);
    setShowCriarModal(true);
  };

  const handleCloseEditModal = () => {
    setShowCriarModal(false);
    setOrcamentoParaEditar(null);
  };

  const handleConvertToOS = async (orcamentoId: string) => {
    await convertToOS.mutateAsync(orcamentoId);
    setShowConversaoModal(false);
    setSelectedOrcamento(null);
  };

  const filteredOrcamentos = orcamentos.filter(orcamento => {
    const matchesSearch = orcamento.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         orcamento.numero_orcamento.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || orcamento.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orcamentos.length,
    pendentes: orcamentos.filter(o => o.status === 'pendente').length,
    aprovados: orcamentos.filter(o => o.status === 'aprovado').length,
    convertidos: orcamentos.filter(o => o.status === 'convertido_os').length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Carregando orçamentos...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Orçamentos</h1>
              <p className="text-muted-foreground">Gerencie seus orçamentos e converta em OS</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowCriarModal(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Orçamento
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
              <div className="text-2xl font-bold text-orange-600">{stats.pendentes}</div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aprovados</CardTitle>
              <div className="text-2xl font-bold text-green-600">{stats.aprovados}</div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Convertidos</CardTitle>
              <div className="text-2xl font-bold text-blue-600">{stats.convertidos}</div>
            </CardHeader>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Busque por cliente ou número do orçamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="aprovado">Aprovados</SelectItem>
                  <SelectItem value="rejeitado">Rejeitados</SelectItem>
                  <SelectItem value="convertido_os">Convertidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Orçamentos */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Orçamentos</CardTitle>
            <CardDescription>
              {filteredOrcamentos.length} orçamento(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredOrcamentos.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'todos' 
                    ? 'Nenhum orçamento encontrado com os filtros aplicados.' 
                    : 'Nenhum orçamento cadastrado. Clique em "Novo Orçamento" para começar.'
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrcamentos.map((orcamento) => (
                    <TableRow key={orcamento.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(orcamento.status)}`} />
                          {orcamento.numero_orcamento}
                        </div>
                      </TableCell>
                      <TableCell>{orcamento.cliente_nome}</TableCell>
                      <TableCell>
                        {format(new Date(orcamento.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(orcamento.validade), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        R$ {orcamento.valor_final.toFixed(2).replace('.', ',')}
                      </TableCell>
                      <TableCell>{getStatusBadge(orcamento.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrcamento({
                                ...orcamento,
                                cliente: orcamento.clientes || null,
                                veiculo: orcamento.veiculos || null,
                                mecanico: orcamento.mecanicos || null,
                                orcamento_produtos: [],
                                orcamento_servicos: [],
                                creator: null,
                              });
                              setShowVisualizarModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                           {orcamento.status === 'pendente' && (
                             <>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleEditOrcamento(orcamento)}
                                 className="text-blue-600 hover:text-blue-700"
                               >
                                 <Edit className="h-4 w-4" />
                               </Button>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleStatusChange(orcamento.id, 'aprovado')}
                                 className="text-green-600 hover:text-green-700"
                               >
                                 <CheckCircle className="h-4 w-4" />
                               </Button>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleStatusChange(orcamento.id, 'rejeitado')}
                                 className="text-red-600 hover:text-red-700"
                               >
                                 <XCircle className="h-4 w-4" />
                               </Button>
                             </>
                           )}

                          {orcamento.status === 'aprovado' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOrcamento({
                                  ...orcamento,
                                  cliente: orcamento.clientes || null,
                                  veiculo: orcamento.veiculos || null,
                                  mecanico: orcamento.mecanicos || null,
                                  orcamento_produtos: [],
                                  orcamento_servicos: [],
                                  creator: null,
                                });
                                setShowConversaoModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-700"
                              disabled={convertToOS.isPending}
                            >
                              <RefreshCw className={`h-4 w-4 ${convertToOS.isPending ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <CriarOrcamentoModal 
          open={showCriarModal} 
          onClose={handleCloseEditModal}
          orcamentoParaEditar={orcamentoDetails}
        />

        <VisualizarOrcamentoModal
          open={showVisualizarModal}
          onClose={() => {
            setShowVisualizarModal(false);
            setSelectedOrcamento(null);
          }}
          orcamento={selectedOrcamento}
        />

        <ConversaoOSModal
          open={showConversaoModal}
          onClose={() => {
            setShowConversaoModal(false);
            setSelectedOrcamento(null);
          }}
          orcamento={selectedOrcamento}
          onConfirm={() => selectedOrcamento && handleConvertToOS(selectedOrcamento.id)}
          isLoading={convertToOS.isPending}
        />
      </div>
    </div>
  );
}