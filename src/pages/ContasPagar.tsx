import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useContasPagar, ContaPagar } from '@/hooks/useContasPagar';
import { ContasPagarDashboard } from '@/components/ContasPagarDashboard';
import { ContasPagarTable } from '@/components/ContasPagarTable';
import { ContaEditModal } from '@/components/ContaEditModal';
import { 
  Plus, 
  Filter, 
  ChevronDown, 
  LayoutGrid, 
  Table2,
  Download,
  Calendar,
  Building,
  DollarSign
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function ContasPagar() {
  const { 
    contas, 
    loading, 
    filters, 
    setFilters, 
    createConta, 
    updateConta,
    updateContaStatus, 
    deleteConta,
    uploadComprovante 
  } = useContasPagar();

  const [formData, setFormData] = useState({
    empresa: '',
    descricao: '',
    valor: '',
    vencimento: '',
    status: 'pendente' as const,
    forma_pagamento: '',
    fixa: false
  });
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'table'>('dashboard');
  const [editingConta, setEditingConta] = useState<ContaPagar | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.empresa || !formData.valor || !formData.vencimento) {
      return;
    }

    setIsSubmitting(true);
    try {
      let comprovante_url = '';
      if (comprovante) {
        comprovante_url = await uploadComprovante(comprovante);
      }

      await createConta({
        empresa: formData.empresa,
        descricao: formData.descricao || undefined,
        valor: parseFloat(formData.valor),
        vencimento: formData.vencimento,
        status: formData.status,
        forma_pagamento: formData.forma_pagamento || undefined,
        comprovante_url: comprovante_url || undefined,
        fixa: formData.fixa
      });

      // Reset form
      setFormData({
        empresa: '',
        descricao: '',
        valor: '',
        vencimento: '',
        status: 'pendente',
        forma_pagamento: '',
        fixa: false
      });
      setComprovante(null);
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'paga' | 'cancelada') => {
    await updateContaStatus(id, status);
  };

  const handleEdit = (conta: ContaPagar) => {
    setEditingConta(conta);
  };

  const contasPendentes = contas.filter(c => c.status === 'pendente');
  const contasPagas = contas.filter(c => c.status === 'paga');
  const contasCanceladas = contas.filter(c => c.status === 'cancelada');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Contas a Pagar
          </h1>
          <p className="text-muted-foreground">Gerencie suas contas a pagar e comprovantes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'dashboard' ? 'table' : 'dashboard')}
          >
            {viewMode === 'dashboard' ? <Table2 className="h-4 w-4 mr-2" /> : <LayoutGrid className="h-4 w-4 mr-2" />}
            {viewMode === 'dashboard' ? 'Visualizar Tabela' : 'Visualizar Cards'}
          </Button>
          <Button size="sm" className="bg-gradient-primary">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="nova-conta">Nova Conta</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Filtros colapsáveis */}
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filtros
                      {(filters.status || filters.empresa || filters.vencimento_inicio || filters.vencimento_fim) && (
                        <Badge variant="secondary" className="ml-2">
                          Ativos
                        </Badge>
                      )}
                    </CardTitle>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={filters.status || 'todas'}
                        onValueChange={(value) => setFilters({ ...filters, status: value === 'todas' ? undefined : value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todas">Todas</SelectItem>
                          <SelectItem value="pendente">Pendentes</SelectItem>
                          <SelectItem value="paga">Pagas</SelectItem>
                          <SelectItem value="cancelada">Canceladas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Empresa</Label>
                      <Input
                        value={filters.empresa || ''}
                        onChange={(e) => setFilters({ ...filters, empresa: e.target.value || undefined })}
                        placeholder="Filtrar por empresa"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Vencimento (De)</Label>
                      <Input
                        type="date"
                        value={filters.vencimento_inicio || ''}
                        onChange={(e) => setFilters({ ...filters, vencimento_inicio: e.target.value || undefined })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Vencimento (Até)</Label>
                      <Input
                        type="date"
                        value={filters.vencimento_fim || ''}
                        onChange={(e) => setFilters({ ...filters, vencimento_fim: e.target.value || undefined })}
                      />
                    </div>
                  </div>

                  {(filters.status || filters.empresa || filters.vencimento_inicio || filters.vencimento_fim) && (
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setFilters({})}
                      >
                        Limpar Filtros
                      </Button>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Dashboard ou Tabela */}
          {viewMode === 'dashboard' ? (
            <div className="space-y-6">
              <ContasPagarDashboard contas={contas} />
              
              {/* Seções por status */}
              <Tabs defaultValue="pendentes" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="pendentes" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pendentes ({contasPendentes.length})
                  </TabsTrigger>
                  <TabsTrigger value="pagas" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Pagas ({contasPagas.length})
                  </TabsTrigger>
                  <TabsTrigger value="canceladas" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Canceladas ({contasCanceladas.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pendentes">
                  <ContasPagarTable 
                    contas={contasPendentes} 
                    onStatusUpdate={handleStatusUpdate}
                    onEdit={handleEdit}
                  />
                </TabsContent>

                <TabsContent value="pagas">
                  <ContasPagarTable 
                    contas={contasPagas} 
                    onStatusUpdate={handleStatusUpdate}
                    onEdit={handleEdit}
                  />
                </TabsContent>

                <TabsContent value="canceladas">
                  <ContasPagarTable 
                    contas={contasCanceladas} 
                    onStatusUpdate={handleStatusUpdate}
                    onEdit={handleEdit}
                  />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <ContasPagarTable 
              contas={contas} 
              onStatusUpdate={handleStatusUpdate}
              onEdit={handleEdit}
            />
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <p>Carregando contas...</p>
              </div>
            </div>
          )}

          {!loading && contas.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Nenhuma conta encontrada.</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => {
                    const tabTrigger = document.querySelector('[value="nova-conta"]') as HTMLButtonElement;
                    if (tabTrigger) tabTrigger.click();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar primeira conta
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="nova-conta">
          {/* Formulário de Cadastro */}
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Nova Conta a Pagar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="empresa">Empresa *</Label>
                    <Input
                      id="empresa"
                      value={formData.empresa}
                      onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                      placeholder="Nome da empresa"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor *</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vencimento">Data de Vencimento *</Label>
                    <Input
                      id="vencimento"
                      type="date"
                      value={formData.vencimento}
                      onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="paga">Paga</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                    <Select
                      value={formData.forma_pagamento}
                      onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comprovante">Comprovante</Label>
                    <Input
                      id="comprovante"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setComprovante(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição da conta (opcional)"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fixa"
                    checked={formData.fixa}
                    onCheckedChange={(checked) => setFormData({ ...formData, fixa: !!checked })}
                  />
                  <Label htmlFor="fixa">Conta fixa (recorrente mensalmente)</Label>
                </div>

                <Separator />

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        empresa: '',
                        descricao: '',
                        valor: '',
                        vencimento: '',
                        status: 'pendente',
                        forma_pagamento: '',
                        fixa: false
                      });
                      setComprovante(null);
                    }}
                  >
                    Limpar
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-gradient-primary min-w-[120px]">
                    {isSubmitting ? 'Salvando...' : 'Salvar Conta'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Edição */}
      <ContaEditModal
        conta={editingConta}
        isOpen={!!editingConta}
        onClose={() => setEditingConta(null)}
        onUpdate={updateConta}
        onDelete={deleteConta}
        uploadComprovante={uploadComprovante}
      />
    </div>
  );
}