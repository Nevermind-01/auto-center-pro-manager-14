import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, Wrench, Calendar, DollarSign } from 'lucide-react';
import { Cliente, useVendasByCliente, useOrcamentosByCliente } from '@/hooks/useSupabaseQueries';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClienteHistoricoModalProps {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewOS?: (osId: string) => void;
  onViewOrcamento?: (orcamento: any) => void;
}

export function ClienteHistoricoModal({ 
  cliente, 
  open, 
  onOpenChange, 
  onViewOS, 
  onViewOrcamento 
}: ClienteHistoricoModalProps) {
  const { data: vendas = [], isLoading: loadingVendas } = useVendasByCliente(cliente?.id || null);
  const { data: orcamentos = [], isLoading: loadingOrcamentos } = useOrcamentosByCliente(cliente?.id || null);

  if (!cliente) return null;

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pendente: { color: 'bg-yellow-500', text: 'Pendente' },
      finalizada: { color: 'bg-green-500', text: 'Finalizada' },
      cancelada: { color: 'bg-red-500', text: 'Cancelada' },
      aprovado: { color: 'bg-blue-500', text: 'Aprovado' },
      rejeitado: { color: 'bg-red-500', text: 'Rejeitado' },
      expirado: { color: 'bg-gray-500', text: 'Expirado' },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { color: 'bg-gray-500', text: status };
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Histórico de {cliente.nome}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="os" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="os" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Ordens de Serviço ({vendas.length})
            </TabsTrigger>
            <TabsTrigger value="orcamentos" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Orçamentos ({orcamentos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="os" className="space-y-4">
            {loadingVendas ? (
              <div className="text-center py-8">Carregando ordens de serviço...</div>
            ) : vendas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma ordem de serviço encontrada
              </div>
            ) : (
              vendas.map((venda) => (
                <Card key={venda.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">OS #{venda.numero_os}</CardTitle>
                      {getStatusBadge(venda.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {format(new Date(venda.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">
                          R$ {venda.valor_final?.toFixed(2) || '0,00'}
                        </span>
                      </div>
                    </div>
                    
                    {venda.veiculos && (
                      <div className="text-sm">
                        <span className="font-medium">Veículo:</span> {venda.veiculos.marca} {venda.veiculos.modelo} - {venda.veiculos.placa}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {venda.venda_produtos && venda.venda_produtos.length > 0 && (
                        <div>
                          <span className="font-medium">Produtos ({venda.venda_produtos.length}):</span>
                          <ul className="mt-1 space-y-1 text-muted-foreground">
                            {venda.venda_produtos.slice(0, 2).map((produto) => (
                              <li key={produto.id}>
                                {produto.quantidade}x {produto.produto_nome}
                              </li>
                            ))}
                            {venda.venda_produtos.length > 2 && (
                              <li className="text-xs">+ {venda.venda_produtos.length - 2} mais...</li>
                            )}
                          </ul>
                        </div>
                      )}
                      
                      {venda.venda_servicos && venda.venda_servicos.length > 0 && (
                        <div>
                          <span className="font-medium">Serviços ({venda.venda_servicos.length}):</span>
                          <ul className="mt-1 space-y-1 text-muted-foreground">
                            {venda.venda_servicos.slice(0, 2).map((servico) => (
                              <li key={servico.id}>
                                {servico.servico_nome}
                              </li>
                            ))}
                            {venda.venda_servicos.length > 2 && (
                              <li className="text-xs">+ {venda.venda_servicos.length - 2} mais...</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewOS?.(venda.id)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Ver detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="orcamentos" className="space-y-4">
            {loadingOrcamentos ? (
              <div className="text-center py-8">Carregando orçamentos...</div>
            ) : orcamentos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum orçamento encontrado
              </div>
            ) : (
              orcamentos.map((orcamento) => (
                <Card key={orcamento.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Orçamento #{orcamento.numero_orcamento}</CardTitle>
                      {getStatusBadge(orcamento.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {format(new Date(orcamento.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">
                          R$ {orcamento.valor_final?.toFixed(2) || '0,00'}
                        </span>
                      </div>
                    </div>
                    
                    {orcamento.veiculos && (
                      <div className="text-sm">
                        <span className="font-medium">Veículo:</span> {orcamento.veiculos.marca} {orcamento.veiculos.modelo} - {orcamento.veiculos.placa}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {orcamento.orcamento_produtos && orcamento.orcamento_produtos.length > 0 && (
                        <div>
                          <span className="font-medium">Produtos ({orcamento.orcamento_produtos.length}):</span>
                          <ul className="mt-1 space-y-1 text-muted-foreground">
                            {orcamento.orcamento_produtos.slice(0, 2).map((produto) => (
                              <li key={produto.id}>
                                {produto.quantidade}x {produto.produto_nome}
                              </li>
                            ))}
                            {orcamento.orcamento_produtos.length > 2 && (
                              <li className="text-xs">+ {orcamento.orcamento_produtos.length - 2} mais...</li>
                            )}
                          </ul>
                        </div>
                      )}
                      
                      {orcamento.orcamento_servicos && orcamento.orcamento_servicos.length > 0 && (
                        <div>
                          <span className="font-medium">Serviços ({orcamento.orcamento_servicos.length}):</span>
                          <ul className="mt-1 space-y-1 text-muted-foreground">
                            {orcamento.orcamento_servicos.slice(0, 2).map((servico) => (
                              <li key={servico.id}>
                                {servico.servico_nome}
                              </li>
                            ))}
                            {orcamento.orcamento_servicos.length > 2 && (
                              <li className="text-xs">+ {orcamento.orcamento_servicos.length - 2} mais...</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Validade:</span> {format(new Date(orcamento.validade), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewOrcamento?.(orcamento)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Ver detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}