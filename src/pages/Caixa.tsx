import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/Layout';
import { CaixaModal } from '@/components/CaixaModal';
import { SuprimentoModal } from '@/components/SuprimentoModal';
import { SangriaModal } from '@/components/SangriaModal';
import { FechamentoCaixaModal } from '@/components/FechamentoCaixaModal';
import { HistoricoCaixaModal } from '@/components/HistoricoCaixaModal';
import { useCaixa } from '@/hooks/useCaixa';
import { useMovimentacoesCaixa } from '@/hooks/useMovimentacoesCaixa';
import { useSuprimentosCaixa } from '@/hooks/useSuprimentosCaixa';
import { useSangriasCaixa } from '@/hooks/useSangriasCaixa';
import { 
  Wallet, 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock,
  Plus,
  Minus,
  Settings,
  History
} from 'lucide-react';
import { format } from 'date-fns';

export default function Caixa() {
  const { caixaAtual, isLoading } = useCaixa();
  const { movimentacoes, resumoPorForma } = useMovimentacoesCaixa();
  const { totalSuprimentos } = useSuprimentosCaixa();
  const { totalSangrias } = useSangriasCaixa();

  const [caixaModalOpen, setCaixaModalOpen] = useState(false);
  const [suprimentoModalOpen, setSuprimentoModalOpen] = useState(false);
  const [sangriaModalOpen, setSangriaModalOpen] = useState(false);
  const [fechamentoModalOpen, setFechamentoModalOpen] = useState(false);
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);

  const calcularTotalCaixa = () => {
    if (!caixaAtual || !resumoPorForma) return 0;
    
    const totalMovimentacoes = Object.values(resumoPorForma).reduce(
      (sum: number, forma: any) => sum + forma.total, 0
    );
    
    return caixaAtual.troco_inicial + totalMovimentacoes + (totalSuprimentos || 0) - (totalSangrias || 0);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center py-8">
            <p>Carregando informações do caixa...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sistema de Caixa</h1>
            <p className="text-muted-foreground">
              Gerencie aberturas, fechamentos e movimentações do caixa
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setHistoricoModalOpen(true)}
            >
              <History className="h-4 w-4 mr-2" />
              Histórico
            </Button>
            <Button onClick={() => setCaixaModalOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Gerenciar Caixa
            </Button>
          </div>
        </div>

        {/* Status do Caixa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wallet className="h-6 w-6" />
                Status do Caixa
              </span>
              <Badge variant={caixaAtual ? 'default' : 'secondary'}>
                {caixaAtual ? 'Aberto' : 'Fechado'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {caixaAtual ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Aberto em</p>
                  <p className="font-medium">
                    {format(new Date(caixaAtual.aberto_em), 'dd/MM/yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(caixaAtual.aberto_em), 'HH:mm')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Troco Inicial</p>
                  <p className="font-medium">
                    R$ {caixaAtual.troco_inicial.toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Movimentações</p>
                  <p className="font-medium">
                    {movimentacoes?.length || 0} operações
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total em Caixa</p>
                  <p className="font-bold text-lg text-primary">
                    R$ {calcularTotalCaixa().toFixed(2)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Nenhum caixa aberto no momento
                </p>
                <Button onClick={() => setCaixaModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Abrir Caixa
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {caixaAtual && (
          <>
            {/* Ações Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => setSuprimentoModalOpen(true)}
              >
                <TrendingUp className="h-6 w-6 text-green-600" />
                <span>Suprimento</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => setSangriaModalOpen(true)}
              >
                <TrendingDown className="h-6 w-6 text-red-600" />
                <span>Sangria</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => setFechamentoModalOpen(true)}
              >
                <Calculator className="h-6 w-6 text-blue-600" />
                <span>Fechamento</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => setCaixaModalOpen(true)}
              >
                <Settings className="h-6 w-6" />
                <span>Configurações</span>
              </Button>
            </div>

            {/* Resumo Financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Suprimentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {(totalSuprimentos || 0).toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    Sangrias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">
                    R$ {(totalSangrias || 0).toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Saldo Líquido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    R$ {((totalSuprimentos || 0) - (totalSangrias || 0)).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Resumo por Forma de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-6 w-6" />
                  Resumo por Forma de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resumoPorForma && Object.keys(resumoPorForma).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(resumoPorForma).map(([forma, dados]: [string, any]) => (
                      <div key={forma} className="p-4 border rounded-lg">
                        <h4 className="font-medium capitalize mb-2">{forma}</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-green-600">Entradas:</span>
                            <span className="text-green-600">R$ {dados.entradas.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-600">Saídas:</span>
                            <span className="text-red-600">R$ {dados.saidas.toFixed(2)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-medium">
                            <span>Total:</span>
                            <span>R$ {dados.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma movimentação registrada ainda.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Últimas Movimentações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-6 w-6" />
                  Últimas Movimentações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {movimentacoes && movimentacoes.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {movimentacoes.slice(0, 10).map((mov) => (
                      <div key={mov.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{mov.forma_pagamento}</p>
                          <p className="text-sm text-muted-foreground">
                            {mov.descricao || `${mov.tipo_origem} - ${mov.tipo}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(mov.data_hora), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                            {mov.tipo === 'entrada' ? '+' : '-'} R$ {Number(mov.valor_liquido).toFixed(2)}
                          </p>
                          {mov.conciliado && (
                            <Badge variant="outline" className="text-xs">
                              Conciliado
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma movimentação registrada ainda.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Modals */}
        <CaixaModal
          open={caixaModalOpen}
          onOpenChange={setCaixaModalOpen}
        />
        <SuprimentoModal
          open={suprimentoModalOpen}
          onOpenChange={setSuprimentoModalOpen}
        />
        <SangriaModal
          open={sangriaModalOpen}
          onOpenChange={setSangriaModalOpen}
        />
        <FechamentoCaixaModal
          open={fechamentoModalOpen}
          onOpenChange={setFechamentoModalOpen}
        />
        <HistoricoCaixaModal
          open={historicoModalOpen}
          onOpenChange={setHistoricoModalOpen}
        />
      </div>
    </Layout>
  );
}