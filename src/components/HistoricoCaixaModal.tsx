import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DateRangePicker } from '@/components/DateRangePicker';
import { useHistoricoCaixa, obterPeriodo, TipoPeriodo, FiltrosPeriodo } from '@/hooks/useHistoricoCaixa';
import { Search, Calendar, TrendingUp, DollarSign, FileText, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface HistoricoCaixaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HistoricoCaixaModal({ open, onOpenChange }: HistoricoCaixaModalProps) {
  const [periodoSelecionado, setPeriodoSelecionado] = useState<TipoPeriodo>('hoje');
  const [filtrosPeriodo, setFiltrosPeriodo] = useState<FiltrosPeriodo>(obterPeriodo('hoje'));
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [numeroOS, setNumeroOS] = useState('');

  const { historico, totalizadores, isLoading } = useHistoricoCaixa(filtrosPeriodo, numeroOS);

  const handlePeriodoChange = (tipo: TipoPeriodo) => {
    setPeriodoSelecionado(tipo);
    if (tipo !== 'personalizado') {
      const novoPeriodo = obterPeriodo(tipo);
      setFiltrosPeriodo(novoPeriodo);
      setDateRange(undefined);
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setPeriodoSelecionado('personalizado');
      setFiltrosPeriodo(obterPeriodo('personalizado', { 
        inicio: range.from, 
        fim: range.to 
      }));
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarFormaPagamento = (forma: string) => {
    const formas: { [key: string]: string } = {
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'debito': 'Cartão de Débito',
      'credito': 'Cartão de Crédito',
      'cheque': 'Cheque',
      'boleto': 'Boleto Bancário',
      'carteira': 'Carteira Digital',
      'outros': 'Outros',
      // Compatibilidade com valores antigos
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'transferencia': 'Transferência'
    };
    return formas[forma] || forma;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico do Caixa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtros */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={periodoSelecionado === 'hoje' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePeriodoChange('hoje')}
              >
                Hoje
              </Button>
              <Button
                variant={periodoSelecionado === 'semana' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePeriodoChange('semana')}
              >
                Esta Semana
              </Button>
              <Button
                variant={periodoSelecionado === 'mes' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePeriodoChange('mes')}
              >
                Este Mês
              </Button>
              <Button
                variant={periodoSelecionado === 'ano' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePeriodoChange('ano')}
              >
                Este Ano
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <DateRangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                className="w-full sm:w-auto"
              />
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número da OS..."
                  value={numeroOS}
                  onChange={(e) => setNumeroOS(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Período: {format(filtrosPeriodo.dataInicio, 'dd/MM/yyyy')} até {format(filtrosPeriodo.dataFim, 'dd/MM/yyyy')}
            </div>
          </div>

          {/* Totalizadores */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Vendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalizadores.totalVendas}</p>
                <p className="text-xs text-muted-foreground">
                  {totalizadores.totalVendasBruto} pagas • {totalizadores.totalVendasCarteira} carteira
                  {totalizadores.totalPagamentosPosteriores > 0 && ` • ${totalizadores.totalPagamentosPosteriores} pag. posteriores`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Total Bruto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-primary">
                  {formatarMoeda(totalizadores.valorFinalBrutoReal)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Vendas pagas + Pag. posteriores + Carteira
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1 text-blue-700">
                  <CreditCard className="h-4 w-4" />
                  Carteira
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-blue-600">
                  {formatarMoeda(totalizadores.valorFinalCarteira)}
                </p>
                <p className="text-xs text-blue-600">
                  Vendas em carteira
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Descontos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-orange-600">
                  {formatarMoeda(totalizadores.valorDesconto)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Total Líquido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-green-600">
                  {formatarMoeda(totalizadores.valorFinal)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Apenas valores efetivamente recebidos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  Comissões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-purple-600">
                  {formatarMoeda(totalizadores.valorComissao)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Lista de Vendas */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Vendas do Período ({historico.length})
            </h3>

            {isLoading ? (
              <div className="text-center py-8">
                <p>Carregando histórico...</p>
              </div>
            ) : historico.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma venda encontrada no período selecionado.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {historico.map((venda) => (
                  <div key={venda.id} className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{venda.numero_os}</h4>
                          <Badge variant="outline" className="capitalize">
                            {venda.status}
                          </Badge>
                          {venda.tipo_entrada === 'pagamento_posterior' && (
                            <Badge variant="default" className="bg-orange-100 text-orange-700">
                              Pagamento Posterior
                            </Badge>
                          )}
                          {venda.tipo_transacao === 'carteira' && venda.tipo_entrada === 'finalizacao' && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              Carteira Digital
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {venda.cliente_nome}
                          {venda.tipo_entrada === 'pagamento_posterior' && ' • Pagamento de OS anterior'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(venda.finalizado_em), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                        <div className="text-right space-y-1">
                          <div className="flex justify-between sm:justify-end gap-2">
                            <span className="text-sm text-muted-foreground sm:hidden">Total:</span>
                            <span className="font-medium">
                              {formatarMoeda(venda.valor_total)}
                            </span>
                          </div>
                          {venda.valor_desconto > 0 && (
                            <div className="flex justify-between sm:justify-end gap-2">
                              <span className="text-sm text-muted-foreground sm:hidden">Desconto:</span>
                              <span className="text-sm text-orange-600">
                                -{formatarMoeda(venda.valor_desconto)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between sm:justify-end gap-2">
                            <span className="text-sm text-muted-foreground sm:hidden">Final:</span>
                            <span className="font-bold text-green-600">
                              {formatarMoeda(venda.valor_final)}
                            </span>
                          </div>
                          {venda.valor_comissao > 0 && (
                            <div className="flex justify-between sm:justify-end gap-2">
                              <span className="text-sm text-muted-foreground sm:hidden">Comissão:</span>
                              <span className="text-sm text-blue-600">
                                {formatarMoeda(venda.valor_comissao)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          {venda.formas_pagamento && venda.formas_pagamento.length > 0 ? (
                            <div className="flex flex-col gap-1 items-end">
                              {venda.formas_pagamento.map((forma: any, idx: number) => (
                                <Badge 
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs whitespace-nowrap"
                                >
                                  {formatarFormaPagamento(forma.forma_pagamento)}: {formatarMoeda(forma.valor)}
                                  {forma.parcelas > 1 && ` (${forma.parcelas}x)`}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <Badge variant="secondary" className="capitalize">
                              {formatarFormaPagamento(venda.forma_pagamento)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}