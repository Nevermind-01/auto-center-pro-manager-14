import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useOrcamentoDetails, type Orcamento } from '@/hooks/useOrcamentos';
import { useState } from 'react';
import { FileText } from 'lucide-react';
import { PrintModal } from './print/PrintModal';

interface VisualizarOrcamentoModalProps {
  open: boolean;
  onClose: () => void;
  orcamento: Orcamento | null;
}

export function VisualizarOrcamentoModal({ open, onClose, orcamento }: VisualizarOrcamentoModalProps) {
  const { data: orcamentoDetails } = useOrcamentoDetails(orcamento?.id || null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const handleOpenPrint = () => {
    setPrintModalOpen(true);
  };

  const formatOrcamentoForPrint = () => {
    if (!orcamentoDetails) return null;

    return {
      numero_orcamento: orcamentoDetails.numero_orcamento,
      cliente_nome: orcamentoDetails.cliente_nome,
      cliente: orcamentoDetails.cliente ? {
        cpf: orcamentoDetails.cliente.cpf,
        cnpj: undefined, // CNPJ não está disponível no tipo cliente
        telefone: orcamentoDetails.cliente.telefone,
        email: undefined, // Email não está disponível no tipo cliente
        endereco: undefined, // Endereço não está disponível no tipo cliente
      } : undefined,
      veiculo: orcamentoDetails.veiculo ? {
        marca: orcamentoDetails.veiculo.marca,
        modelo: orcamentoDetails.veiculo.modelo,
        ano: orcamentoDetails.veiculo.ano,
        cor: orcamentoDetails.veiculo.cor,
        km_atual: orcamentoDetails.veiculo.km_atual,
        placa: orcamentoDetails.veiculo.placa,
      } : undefined,
      mecanico: orcamentoDetails.mecanico ? {
        nome: orcamentoDetails.mecanico.nome,
      } : undefined,
      created_at: orcamentoDetails.created_at,
      validade: orcamentoDetails.validade,
      valor_total: orcamentoDetails.valor_total,
      valor_desconto: orcamentoDetails.valor_desconto || 0,
      valor_final: orcamentoDetails.valor_final,
      observacoes: orcamentoDetails.observacoes,
      produtos: orcamentoDetails.orcamento_produtos?.map(p => ({
        produto_nome: p.produto_nome,
        quantidade: p.quantidade,
        preco_unitario: p.preco_unitario,
        preco_total: p.preco_total,
      })) || [],
      servicos: orcamentoDetails.orcamento_servicos?.map(s => ({
        servico_nome: s.servico_nome,
        preco: s.preco,
      })) || [],
    };
  };

  if (!orcamentoDetails) return null;

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Visualizar Orçamento</DialogTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(orcamentoDetails.status)}
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenPrint}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Imprimir / PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Número</p>
                <p className="font-mono">{orcamentoDetails.numero_orcamento}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(orcamentoDetails.status)}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data de Criação</p>
                <p>{format(new Date(orcamentoDetails.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Validade</p>
                <p>{format(new Date(orcamentoDetails.validade), 'dd/MM/yyyy', { locale: ptBR })}</p>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nome</p>
                  <p>{orcamentoDetails.cliente_nome}</p>
                </div>
                {orcamentoDetails.cliente?.telefone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                    <p>{orcamentoDetails.cliente.telefone}</p>
                  </div>
                )}
                {orcamentoDetails.cliente?.cpf && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">CPF</p>
                    <p>{orcamentoDetails.cliente.cpf}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações do Veículo */}
          {orcamentoDetails.veiculo && (
            <Card>
              <CardHeader>
                <CardTitle>Veículo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Marca/Modelo</p>
                    <p>{orcamentoDetails.veiculo.marca} {orcamentoDetails.veiculo.modelo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Placa</p>
                    <p className="font-mono">{orcamentoDetails.veiculo.placa}</p>
                  </div>
                  {orcamentoDetails.veiculo.ano && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ano</p>
                      <p>{orcamentoDetails.veiculo.ano}</p>
                    </div>
                  )}
                  {orcamentoDetails.veiculo.cor && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cor</p>
                      <p>{orcamentoDetails.veiculo.cor}</p>
                    </div>
                  )}
                  {orcamentoDetails.veiculo.km_atual !== undefined && orcamentoDetails.veiculo.km_atual > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">KM Atual</p>
                      <p>{orcamentoDetails.veiculo.km_atual.toLocaleString('pt-BR')} km</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações do Mecânico */}
          {orcamentoDetails.mecanico && (
            <Card>
              <CardHeader>
                <CardTitle>Mecânico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome</p>
                    <p>{orcamentoDetails.mecanico.nome}</p>
                  </div>
                  {orcamentoDetails.mecanico.especialidade && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Especialidade</p>
                      <p>{orcamentoDetails.mecanico.especialidade}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Produtos */}
          {orcamentoDetails.orcamento_produtos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="w-20">Qtd.</TableHead>
                      <TableHead className="w-32">Valor Unit.</TableHead>
                      <TableHead className="w-32">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orcamentoDetails.orcamento_produtos.map(produto => (
                      <TableRow key={produto.id}>
                        <TableCell>{produto.produto_nome}</TableCell>
                        <TableCell className="text-center">{produto.quantidade}</TableCell>
                        <TableCell>R$ {produto.preco_unitario.toFixed(2).replace('.', ',')}</TableCell>
                        <TableCell>R$ {produto.preco_total.toFixed(2).replace('.', ',')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Serviços */}
          {orcamentoDetails.orcamento_servicos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Serviços</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serviço</TableHead>
                      <TableHead className="w-32">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orcamentoDetails.orcamento_servicos.map(servico => (
                      <TableRow key={servico.id}>
                        <TableCell>{servico.servico_nome}</TableCell>
                        <TableCell>R$ {servico.preco.toFixed(2).replace('.', ',')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          {(orcamentoDetails.observacoes || orcamentoDetails.observacoes_internas) && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orcamentoDetails.observacoes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Observações</p>
                    <p className="whitespace-pre-wrap">{orcamentoDetails.observacoes}</p>
                  </div>
                )}
                {orcamentoDetails.observacoes_internas && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Observações Internas</p>
                    <div className="bg-muted/50 p-3 rounded-md">
                      <p className="whitespace-pre-wrap text-sm">{orcamentoDetails.observacoes_internas}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resumo Financeiro */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {orcamentoDetails.valor_total.toFixed(2).replace('.', ',')}</span>
              </div>
              {orcamentoDetails.valor_desconto > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Desconto:</span>
                  <span>- R$ {orcamentoDetails.valor_desconto.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>R$ {orcamentoDetails.valor_final.toFixed(2).replace('.', ',')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Informações de OS (se convertido) */}
          {orcamentoDetails.status === 'convertido_os' && orcamentoDetails.os_id && (
            <Card>
              <CardHeader>
                <CardTitle>Ordem de Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Este orçamento foi convertido em uma Ordem de Serviço.
                </p>
                <p className="text-sm">
                  <span className="font-medium">ID da OS:</span> {orcamentoDetails.os_id}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>

      {/* Print Modal */}
      <PrintModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        type="orcamento"
        data={formatOrcamentoForPrint()}
        title={`Imprimir Orçamento ${orcamentoDetails?.numero_orcamento || ''}`}
      />
    </Dialog>
  );
}