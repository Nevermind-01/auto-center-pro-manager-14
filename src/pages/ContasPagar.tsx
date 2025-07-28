import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useContasPagar, ContaPagar } from '@/hooks/useContasPagar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileUp, Filter, CheckCircle, XCircle, Calendar, Building, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ContasPagar() {
  const { 
    contas, 
    loading, 
    filters, 
    setFilters, 
    createConta, 
    updateContaStatus, 
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { variant: 'secondary' as const, label: 'Pendente' },
      paga: { variant: 'default' as const, label: 'Paga' },
      cancelada: { variant: 'destructive' as const, label: 'Cancelada' }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const contasPendentes = contas.filter(c => c.status === 'pendente');
  const contasPagas = contas.filter(c => c.status === 'paga');
  const contasCanceladas = contas.filter(c => c.status === 'cancelada');
  const contasFixas = contas.filter(c => c.fixa);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Contas a Pagar</h1>
        <p className="text-muted-foreground">Gerencie suas contas a pagar e comprovantes</p>
      </div>

      {/* Formulário de Cadastro */}
      <Card>
        <CardHeader>
          <CardTitle>Nova Conta a Pagar</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="fixa">Conta fixa</Label>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Salvando...' : 'Salvar Conta'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Contas Fixas */}
      {contasFixas.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Contas Fixas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contasFixas.map((conta) => (
              <Card key={conta.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{conta.empresa}</span>
                      </div>
                      {getStatusBadge(conta.status)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-lg font-semibold">
                        R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(conta.vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>

                    {conta.status === 'pendente' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(conta.id, 'paga')}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Pagar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusUpdate(conta.id, 'cancelada')}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Contas */}
      <div className="space-y-6">
        {/* Contas Pendentes */}
        {contasPendentes.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-warning">Contas Pendentes ({contasPendentes.length})</h2>
            <div className="space-y-2">
              {contasPendentes.map((conta) => (
                <ContaCard 
                  key={conta.id} 
                  conta={conta} 
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          </div>
        )}

        {/* Contas Pagas */}
        {contasPagas.length > 0 && (
          <div>
            <Separator />
            <h2 className="text-xl font-semibold mb-4 text-success">Contas Pagas ({contasPagas.length})</h2>
            <div className="space-y-2">
              {contasPagas.map((conta) => (
                <ContaCard 
                  key={conta.id} 
                  conta={conta} 
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          </div>
        )}

        {/* Contas Canceladas */}
        {contasCanceladas.length > 0 && (
          <div>
            <Separator />
            <h2 className="text-xl font-semibold mb-4 text-destructive">Contas Canceladas ({contasCanceladas.length})</h2>
            <div className="space-y-2">
              {contasCanceladas.map((conta) => (
                <ContaCard 
                  key={conta.id} 
                  conta={conta} 
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-8">
          <p>Carregando contas...</p>
        </div>
      )}

      {!loading && contas.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhuma conta encontrada.</p>
        </div>
      )}
    </div>
  );
}

interface ContaCardProps {
  conta: ContaPagar;
  onStatusUpdate: (id: string, status: 'paga' | 'cancelada') => void;
}

function ContaCard({ conta, onStatusUpdate }: ContaCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <h3 className="font-medium">{conta.empresa}</h3>
              {getStatusBadge(conta.status)}
              {conta.fixa && <Badge variant="outline">Fixa</Badge>}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span>Venc: {format(new Date(conta.vencimento), 'dd/MM/yyyy', { locale: ptBR })}</span>
              {conta.forma_pagamento && <span className="capitalize">{conta.forma_pagamento}</span>}
              {conta.data_pagamento && (
                <span>Pago em: {format(new Date(conta.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })}</span>
              )}
            </div>

            {conta.descricao && (
              <p className="text-sm text-muted-foreground">{conta.descricao}</p>
            )}

            {conta.comprovante_url && (
              <a 
                href={conta.comprovante_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <FileUp className="h-4 w-4" />
                Ver comprovante
              </a>
            )}
          </div>

          {conta.status === 'pendente' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusUpdate(conta.id, 'paga')}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Pagar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onStatusUpdate(conta.id, 'cancelada')}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusBadge(status: string) {
  const statusConfig = {
    pendente: { variant: 'secondary' as const, label: 'Pendente' },
    paga: { variant: 'default' as const, label: 'Paga' },
    cancelada: { variant: 'destructive' as const, label: 'Cancelada' }
  };
  const config = statusConfig[status as keyof typeof statusConfig];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}