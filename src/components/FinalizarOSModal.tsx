import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useVendaMutations, useLogMovimentacaoMutations } from "@/hooks/useSupabaseQueries";
import { useSupabaseEstoque } from "@/lib/supabaseEstoque";
import { DollarSign, Package, Wrench, ShoppingCart, AlertTriangle, User, FileText, Calculator, Wallet } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useComissoesMutations } from "@/hooks/useComissoes";
import { useMecanicos } from "@/hooks/useMecanicos";
import { supabase } from "@/integrations/supabase/client";
import { PrintModal } from "@/components/print/PrintModal";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useMovimentacoesCaixa } from "@/hooks/useMovimentacoesCaixa";
import { useCarteiraCliente } from "@/hooks/useCarteiraCliente";
import { useMultiplePaymentForms } from "@/hooks/useMultiplePaymentForms";
import { MultiplePaymentForms, type FormaPagamentoMultipla } from "@/components/MultiplePaymentForms";
import { type FormaPagamento, isValidFormaPagamento, getAvailablePaymentMethods } from "@/lib/paymentMethodMapper";
import { formatCurrency } from "@/lib/utils";
import { ProdutoOnlyWarningModal } from "@/components/ProdutoOnlyWarningModal";
import { ServiceWarningModal } from "@/components/ServiceWarningModal";
import { MecanicoWarningModal } from "@/components/MecanicoWarningModal";
import { ComissaoWarningModal } from "@/components/ComissaoWarningModal";

interface FinalizarOSModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venda: any;
}

export const FinalizarOSModal = ({ open, onOpenChange, venda }: FinalizarOSModalProps) => {
  const { toast } = useToast();
  const { updateVenda } = useVendaMutations();
  const { createLog } = useLogMovimentacaoMutations();
  const { createComissao } = useComissoesMutations();
  const { criarMovimentacaoAsync } = useMovimentacoesCaixa();
  const { getCarteiraCliente, debitarCarteira } = useCarteiraCliente();
  const { criarFormaPadrao, validarFormas, salvarFormasPagamento } = useMultiplePaymentForms();
  const estoqueManager = useSupabaseEstoque();

  // Estados para a finalização
  const [tipoDesconto, setTipoDesconto] = useState<'percentual' | 'fixo'>('percentual');
  const [descontoPercentual, setDescontoPercentual] = useState(0);
  const [descontoFixo, setDescontoFixo] = useState(0);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamentoMultipla[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Estados para comissão do mecânico
  const [registrarComissao, setRegistrarComissao] = useState(false);
  const [temComissaoRegistrada, setTemComissaoRegistrada] = useState(false);
  const [tipoCalculo, setTipoCalculo] = useState<'percentual' | 'fixo' | null>(null);
  const [valorPercentual, setValorPercentual] = useState<number | ''>('');
  const [valorFixo, setValorFixo] = useState<number | ''>('');
  const [obsComissao, setObsComissao] = useState("");

  // Estados para impressão
  const [imprimirAposFinalizacao, setImprimirAposFinalizacao] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [osFinalizadaData, setOsFinalizadaData] = useState(null);

  // Estados para modais de confirmação
  const [showProdutoOnlyWarning, setShowProdutoOnlyWarning] = useState(false);
  const [showServiceWarning, setShowServiceWarning] = useState(false);
  const [showMecanicoWarning, setShowMecanicoWarning] = useState(false);
  const [showComissaoWarning, setShowComissaoWarning] = useState(false);
  const [pendingFinalization, setPendingFinalization] = useState(false);

  // Hook da carteira do cliente
  const carteiraQuery = getCarteiraCliente(venda?.cliente_id || '');
  const saldoCarteira = carteiraQuery.data?.saldo_atual || 0;

  // Verificar se tem carteira nas formas de pagamento
  const temCarteira = formasPagamento.some(forma => forma.forma_pagamento === 'carteira');
  const valorCarteira = formasPagamento
    .filter(forma => forma.forma_pagamento === 'carteira')
    .reduce((total, forma) => total + forma.valor, 0);

  // Resetar valores quando a modal abrir/fechar ou venda mudar
  useEffect(() => {
    if (open && venda) {
      // Carregamento inicial - por padrão tratar como percentual  
      const descontoPercentualCalculado = venda.valor_total > 0 
        ? (venda.valor_desconto || 0) / venda.valor_total * 100
        : 0;
      setTipoDesconto('percentual');
      setDescontoPercentual(descontoPercentualCalculado);
      setDescontoFixo(0);
      
      // Criar forma padrão baseada na venda existente
      const formaPagamentoExistente = venda.forma_pagamento as FormaPagamento || "dinheiro";
      const formasPadrao = criarFormaPadrao(venda.valor_final || 0, formaPagamentoExistente);
      if (venda.parcelas && venda.parcelas > 1) {
        formasPadrao[0].parcelas = venda.parcelas;
      }
      setFormasPagamento(formasPadrao);
      
      setObservacoes(venda.observacoes || '');
      
      // Reset comissão
      setRegistrarComissao(false);
      setTipoCalculo(null);
      setValorPercentual('');
      setValorFixo('');
      setObsComissao('');

      // Verificar se já existe comissão para esta OS
      const checkComissaoExistente = async () => {
        const { data: comissaoExistente } = await supabase
          .from('comissoes_mecanicos')
          .select('id')
          .eq('venda_id', venda.id)
          .maybeSingle();
        
        setTemComissaoRegistrada(!!comissaoExistente);
      };
      
      checkComissaoExistente();
    } else {
      // Reset quando fechar
      setTipoDesconto('percentual');
      setDescontoPercentual(0);
      setDescontoFixo(0);
      setFormasPagamento([]);
      setObservacoes("");
      setRegistrarComissao(false);
      setTemComissaoRegistrada(false);
      setTipoCalculo(null);
      setValorPercentual('');
      setValorFixo('');
      setObsComissao('');
    }
  }, [open, venda, criarFormaPadrao]);

  // Cálculos de valores
  const produtos = venda?.venda_produtos || [];
  const servicos = venda?.venda_servicos || [];
  
  const valorProdutos = produtos.reduce((total: number, produto: any) => 
    total + (Number(produto.preco_total) || 0), 0
  );
  
  const valorServicos = servicos.reduce((total: number, servico: any) => 
    total + (Number(servico.preco) || 0), 0
  );
  
const valorTotal = valorProdutos + valorServicos;
const valorDesconto = tipoDesconto === 'percentual'
  ? (valorTotal * descontoPercentual) / 100
  : descontoFixo;
const valorFinal = valorTotal - valorDesconto;

  // Cálculos de comissão
  const baseCalculo = valorServicos;
  const comissaoPreview = tipoCalculo === 'percentual'
    ? baseCalculo * ((typeof valorPercentual === 'number' ? valorPercentual : 0) / 100)
    : tipoCalculo === 'fixo'
    ? (typeof valorFixo === 'number' ? valorFixo : 0)
    : 0;

  const hasMecanico = Boolean(venda?.mecanico_id);
  const hasServicos = servicos.length > 0;

  // Hook para proteção contra múltiplos cliques
  const { execute: executarFinalizacao, isLoading: finalizandoOS } = useAsyncAction(
    async () => {
      // Validações obrigatórias das formas de pagamento
      const validacao = validarFormas(formasPagamento, valorFinal, saldoCarteira);
      if (!validacao.isValid) {
        toast({
          title: "Erro nas formas de pagamento", 
          description: validacao.errors.join(". "),
          variant: "destructive",
        });
        return;
      }

      const produtos = venda?.venda_produtos || [];
      const hasProdutos = produtos.length > 0;

      // Validações inteligentes - mostrar modais de confirmação ao invés de bloquear
      if (!pendingFinalization) {
        // Cenário 1: Apenas produtos (sem serviços e sem mecânico)
        if (hasProdutos && !hasServicos && !hasMecanico) {
          setShowProdutoOnlyWarning(true);
          setPendingFinalization(true);
          return;
        }
        
        // Cenário 2: Tem serviços mas não tem mecânico
        if (hasServicos && !hasMecanico) {
          setShowServiceWarning(true);
          setPendingFinalization(true);
          return;
        }
        
        // Cenário 3: Tem mecânico mas não tem serviços
        if (hasMecanico && !hasServicos) {
          setShowMecanicoWarning(true);
          setPendingFinalization(true);
          return;
        }
        
        // Cenário 4: Tem mecânico e serviços mas comissão não está marcada
        if (hasMecanico && hasServicos && !registrarComissao && !temComissaoRegistrada) {
          setShowComissaoWarning(true);
          setPendingFinalization(true);
          return;
        }
      }

      // Validações de comissão apenas se estiver habilitada
      if (registrarComissao) {
        if (!tipoCalculo) {
          toast({
            title: "Erro", 
            description: "Selecione o tipo de cálculo da comissão.",
            variant: "destructive",
          });
          return;
        }

      if (tipoCalculo === 'percentual') {
        if (!valorPercentual || valorPercentual <= 0 || valorPercentual > 100) {
          toast({
            title: "Erro", 
            description: "O percentual deve ser maior que 0 e até 100%.",
            variant: "destructive",
          });
          return;
        }
      } else if (tipoCalculo === 'fixo') {
        if (!valorFixo || valorFixo <= 0) {
          toast({
            title: "Erro", 
            description: "O valor fixo deve ser maior que 0.",
            variant: "destructive",
          });
          return;
        }
        }
      }

      setIsLoading(true);

      try {
        // Validar estoque dos produtos
        if (produtos.length > 0) {
          for (const item of produtos) {
            const temEstoque = await estoqueManager.verificarEstoque(item.produto_id, item.quantidade);
            if (!temEstoque) {
              const produto = await estoqueManager.buscarProdutoPorId(item.produto_id);
              toast({
                title: "Estoque insuficiente",
                description: `Não há estoque suficiente para o produto ${produto?.nome || item.produto_nome}. Disponível: ${produto?.quantidade || 0}, Necessário: ${item.quantidade}`,
                variant: "destructive",
              });
              return;
            }
          }

          // Dar baixa no estoque
          const produtosParaBaixa = produtos.map((item: any) => ({
            id: item.produto_id,
            nome: item.produto_nome,
            marca: null,
            valor: item.preco_unitario,
            quantidade: item.quantidade
          }));

          const sucessoEstoque = await estoqueManager.processarVenda(produtosParaBaixa, venda.numero_os);
          if (!sucessoEstoque) {
            toast({
              title: "Erro no estoque",
              description: "Erro ao dar baixa no estoque. Tente novamente.",
              variant: "destructive",
            });
            return;
          }
        }

        // Validar forma de pagamento antes de salvar
        const formasValidas = formasPagamento.filter(f => f.forma_pagamento && f.valor > 0);
        if (formasValidas.length === 0) {
          toast({
            title: "Erro",
            description: "Pelo menos uma forma de pagamento é obrigatória.",
            variant: "destructive",
          });
          return;
        }

        // Determinar o novo status baseado se tem carteira
        const novoStatus: "finalizada" | "finalizada-carteira" = temCarteira 
          ? "finalizada-carteira" 
          : "finalizada";

        // Atualizar a venda com os novos valores e status
        await updateVenda.mutateAsync({
          id: venda.id,
          valor_total: valorTotal,
          valor_desconto: valorDesconto,
          valor_final: valorFinal,
          forma_pagamento: formasValidas[0].forma_pagamento as FormaPagamento, // Primeira forma para compatibilidade
          parcelas: formasValidas[0].forma_pagamento === 'credito' ? formasValidas[0].parcelas : 1,
          observacoes: observacoes || null,
          status: novoStatus,
          finalizado_em: new Date().toISOString()
        });

        // Registrar comissão se especificada
        if (registrarComissao && tipoCalculo && hasMecanico) {
          await createComissao.mutateAsync({
            venda_id: venda.id,
            mecanico_id: venda.mecanico_id,
            tipo_calculo: tipoCalculo,
            percentual: tipoCalculo === 'percentual' ? Number(valorPercentual) : null,
            valor_fixo: tipoCalculo === 'fixo' ? Number(valorFixo) : null,
            valor_final: comissaoPreview,
            base_calculo: baseCalculo,
            observacoes: obsComissao || null
          });
        }

        // Salvar múltiplas formas de pagamento
        await salvarFormasPagamento(venda.id, formasPagamento);

        // NÃO debitar da carteira - o valor fica pendente para pagamento posterior

        // Processar movimentações de caixa apenas para formas não-carteira
        try {
          for (const forma of formasValidas) {
            // Pular formas "carteira" - não registram movimento de caixa pois ficam pendentes
            if (forma.forma_pagamento === 'carteira') {
              continue;
            }
            
            // Para outras formas de pagamento, registrar valor real
            await criarMovimentacaoAsync({
              tipo: 'entrada',
              tipo_origem: 'OS',
              forma_pagamento: forma.forma_pagamento as FormaPagamento,
              valor_bruto: forma.valor,
              valor_liquido: forma.valor,
              descricao: `OS ${venda.numero_os} - ${venda.cliente_nome} (${forma.forma_pagamento})`,
              referencia_id: venda.id,
            });
          }

          // Criar registro inicial em pagamentos_os se tem carteira
          if (temCarteira) {
            const { data: { user } } = await supabase.auth.getUser();
            const empresaAtual = await supabase.from('profiles').select('empresa_atual_id').eq('user_id', user?.id).single();
            
            // Calcular quanto já foi pago em outras formas (não-carteira)
            const valorPagoOutrasFormas = formasValidas
              .filter(f => f.forma_pagamento !== 'carteira')
              .reduce((total, f) => total + f.valor, 0);
            
            // Apenas o valor da carteira fica pendente
            const valorPendenteCarteira = valorCarteira;
            
            const { error: pagamentoError } = await supabase
              .from('pagamentos_os')
              .insert({
                os_id: venda.id,
                valor_pago: valorPagoOutrasFormas,
                forma_pagamento: formasValidas[0].forma_pagamento as any, // Primeira forma não-carteira
                valor_restante: valorPendenteCarteira,
                tipo_entrada: 'finalizacao',
                usuario_id: user?.id,
                empresa_id: empresaAtual?.data?.empresa_atual_id,
                observacoes: valorPagoOutrasFormas > 0 
                  ? `Pagamento inicial - R$ ${valorPagoOutrasFormas.toFixed(2)} em outras formas. Restante em carteira: R$ ${valorPendenteCarteira.toFixed(2)}`
                  : 'Registro inicial - aguardando pagamento'
              });

            if (pagamentoError) {
              throw pagamentoError;
            }
          }
        } catch (caixaError) {
          console.error('Erro ao registrar movimentação no caixa:', caixaError);
          // Note: We don't throw here to avoid full rollback, just log the error
          // The OS is already finalized successfully
          toast({
            title: "Atenção",
            description: "OS finalizada com sucesso, mas houve um problema ao registrar no caixa. Verifique as movimentações.",
            variant: "destructive",
          });
        }

        // Registrar log de finalização
        const formasDescricao = formasValidas.map(f => 
          f.forma_pagamento === 'credito' ? `${f.forma_pagamento} (${f.parcelas}x)` : f.forma_pagamento
        ).join(', ');
        
        const logDescricao = registrarComissao && tipoCalculo
          ? `OS ${venda.numero_os} finalizada com comissão registrada - ${formasDescricao}`
          : `OS ${venda.numero_os} finalizada via modal - ${formasDescricao}`;

        await createLog.mutateAsync({
          os_id: venda.id,
          tipo: 'finalizacao',
          usuario: 'Admin',
          observacoes: logDescricao
        });

        const successMessage = registrarComissao && tipoCalculo
          ? `OS ${venda.numero_os} finalizada e comissão registrada com sucesso.`
          : `OS ${venda.numero_os} foi finalizada com sucesso.`;

        toast({
          title: "Sucesso",
          description: successMessage,
        });

        // Preparar dados da OS finalizada para impressão
        if (imprimirAposFinalizacao) {
          const osData = {
            ...venda,
            valor_total: valorTotal,
            valor_desconto: valorDesconto,
            valor_final: valorFinal,
            forma_pagamento: formasValidas[0].forma_pagamento,
            parcelas: formasValidas[0].forma_pagamento === 'credito' ? formasValidas[0].parcelas : 1,
            observacoes: observacoes || null,
            status: 'finalizada',
            finalizado_em: new Date().toISOString()
          };
          setOsFinalizadaData(osData);
          setShowPrintModal(true);
        }

        onOpenChange(false);

      } catch (error) {
        console.error('Erro ao finalizar OS:', error);
        toast({
          title: "Erro",
          description: "Erro ao finalizar a OS. Tente novamente.",
          variant: "destructive",
        });
        throw error;
      }
    },
    'finalizar-os'
  );

  const handleFinalizarOS = () => executarFinalizacao();

  // Handlers para modais de confirmação
  const handleConfirmProdutoOnly = () => {
    setShowProdutoOnlyWarning(false);
    setPendingFinalization(false);
    executarFinalizacao();
  };

  const handleRejectProdutoOnly = () => {
    setShowProdutoOnlyWarning(false);
    setPendingFinalization(false);
  };

  const handleConfirmService = () => {
    setShowServiceWarning(false);
    setPendingFinalization(false);
    executarFinalizacao();
  };

  const handleRejectService = () => {
    setShowServiceWarning(false);
    setPendingFinalization(false);
  };

  const handleConfirmMecanico = () => {
    setShowMecanicoWarning(false);
    setPendingFinalization(false);
    executarFinalizacao();
  };

  const handleRejectMecanico = () => {
    setShowMecanicoWarning(false);
    setPendingFinalization(false);
  };

  const handleConfirmComissao = () => {
    setShowComissaoWarning(false);
    setPendingFinalization(false);
    executarFinalizacao();
  };

  const handleRejectComissao = () => {
    setShowComissaoWarning(false);
    setPendingFinalization(false);
  };

  if (!venda) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erro</DialogTitle>
          </DialogHeader>
          <p>Nenhuma OS selecionada.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Finalizar OS - {venda.numero_os}
          </DialogTitle>
          <DialogDescription>
            Revise os detalhes, aplique descontos e escolha a forma de pagamento para finalizar a ordem de serviço.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1: Produtos e Serviços */}
          <div className="space-y-4">
            {/* Produtos */}
            {produtos.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold">Produtos</h3>
                    <Badge variant="secondary">{produtos.length} item(s)</Badge>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {produtos.map((produto: any) => (
                      <div key={produto.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{produto.produto_nome}</div>
                          <div className="text-xs text-muted-foreground">
                            {produto.quantidade}x R$ {Number(produto.preco_unitario).toFixed(2)}
                          </div>
                        </div>
                        <div className="font-medium text-sm">
                          R$ {Number(produto.preco_total).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Serviços */}
            {servicos.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="h-4 w-4 text-green-600" />
                    <h3 className="font-semibold">Serviços</h3>
                    <Badge variant="secondary">{servicos.length} item(s)</Badge>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {servicos.map((servico: any) => (
                      <div key={servico.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{servico.servico_nome}</div>
                        </div>
                        <div className="font-medium text-sm">
                          R$ {Number(servico.preco).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna 2: Comissão do Mecânico */}
          <div className="space-y-4">
            {hasMecanico && hasServicos && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-4 w-4 text-purple-600" />
                    <h3 className="font-semibold">Comissão do Mecânico</h3>
                  </div>

                  {temComissaoRegistrada ? (
                    <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                      ✓ Já existe uma comissão registrada para esta OS.
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <Label htmlFor="registrar-comissao" className="text-sm font-medium">
                          Registrar comissão
                        </Label>
                        <Switch
                          id="registrar-comissao"
                          checked={registrarComissao}
                          onCheckedChange={(checked) => {
                            setRegistrarComissao(checked);
                            if (!checked) {
                              setTipoCalculo(null);
                              setValorPercentual('');
                              setValorFixo('');
                              setObsComissao('');
                            }
                          }}
                        />
                      </div>

                      {registrarComissao && (
                        <div className="space-y-4">
                          <div className="bg-blue-50 p-3 rounded-lg text-sm">
                            <div className="flex justify-between items-center">
                              <span>Base de cálculo (serviços):</span>
                              <span className="font-medium">R$ {baseCalculo.toFixed(2)}</span>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Tipo de Cálculo</Label>
                            <RadioGroup 
                              value={tipoCalculo || ''} 
                              onValueChange={(value) => {
                                setTipoCalculo(value as 'percentual' | 'fixo' || null);
                                setValorPercentual('');
                                setValorFixo('');
                              }}
                              className="mt-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="percentual" id="percentual" />
                                <Label htmlFor="percentual" className="text-sm cursor-pointer">Percentual (%)</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="fixo" id="fixo" />
                                <Label htmlFor="fixo" className="text-sm cursor-pointer">Valor Fixo (R$)</Label>
                              </div>
                            </RadioGroup>
                          </div>

                          {tipoCalculo === 'percentual' && (
                            <div>
                              <Label htmlFor="valor-percentual" className="text-sm">Percentual (%)</Label>
                              <Input
                                id="valor-percentual"
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={valorPercentual}
                                onChange={(e) => setValorPercentual(parseFloat(e.target.value) || '')}
                                placeholder="Ex: 10"
                                className="mt-1"
                              />
                            </div>
                          )}

                          {tipoCalculo === 'fixo' && (
                            <div>
                              <Label htmlFor="valor-fixo" className="text-sm">Valor Fixo (R$)</Label>
                              <Input
                                id="valor-fixo"
                                type="number"
                                min="0"
                                step="0.01"
                                value={valorFixo}
                                onChange={(e) => setValorFixo(parseFloat(e.target.value) || '')}
                                placeholder="Ex: 100.00"
                                className="mt-1"
                              />
                            </div>
                          )}

                          {comissaoPreview > 0 && (
                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="flex justify-between items-center text-sm">
                                <span>Valor da comissão:</span>
                                <span className="font-bold text-green-700">R$ {comissaoPreview.toFixed(2)}</span>
                              </div>
                            </div>
                          )}

                          <div>
                            <Label htmlFor="obs-comissao" className="text-sm">Observações</Label>
                            <Textarea
                              id="obs-comissao"
                              value={obsComissao}
                              onChange={(e) => setObsComissao(e.target.value)}
                              placeholder="Observações sobre a comissão..."
                              rows={2}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {!hasMecanico && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4" />
                Vincule um mecânico à OS para registrar comissão
              </div>
            )}

            {!hasServicos && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4" />
                Adicione pelo menos um serviço para calcular comissão
              </div>
            )}
          </div>

          {/* Coluna 3: Pagamento */}
          <div className="space-y-4">
            {/* Resumo de valores */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <h3 className="font-semibold">Resumo Financeiro</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Produtos:</span>
                    <span>R$ {valorProdutos.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Serviços:</span>
                    <span>R$ {valorServicos.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm font-medium">
                    <span>Subtotal:</span>
                    <span>R$ {valorTotal.toFixed(2)}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">Tipo de Desconto:</Label>
                      <Select value={tipoDesconto} onValueChange={(value: 'percentual' | 'fixo') => setTipoDesconto(value)}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentual">Percentual</SelectItem>
                          <SelectItem value="fixo">Valor Fixo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {tipoDesconto === 'percentual' ? (
                      <div className="flex justify-between items-center">
                        <Label htmlFor="desconto-percentual" className="text-sm">Desconto (%):</Label>
                        <Input
                          id="desconto-percentual"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={descontoPercentual}
                          onChange={(e) => setDescontoPercentual(parseFloat(e.target.value) || 0)}
                          className="w-20 h-8"
                        />
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <Label htmlFor="desconto-fixo" className="text-sm">Desconto (R$):</Label>
                        <Input
                          id="desconto-fixo"
                          type="number"
                          min="0"
                          step="0.01"
                          value={descontoFixo}
                          onChange={(e) => setDescontoFixo(parseFloat(e.target.value) || 0)}
                          className="w-20 h-8"
                        />
                      </div>
                    )}
                  </div>
                  {valorDesconto > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Desconto:</span>
                      <span>- R$ {valorDesconto.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>R$ {valorFinal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Múltiplas Formas de Pagamento */}
            <MultiplePaymentForms
              formasPagamento={formasPagamento}
              onChange={setFormasPagamento}
              valorTotal={valorFinal}
              saldoCarteira={saldoCarteira}
              clienteSelecionado={venda?.cliente}
              disabled={finalizandoOS}
            />

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações adicionais..."
                rows={3}
                disabled={finalizandoOS}
              />
            </div>

            {/* Opção de imprimir após finalização */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                id="imprimir-finalizacao"
                checked={imprimirAposFinalizacao}
                onChange={(e) => setImprimirAposFinalizacao(e.target.checked)}
                className="rounded"
                disabled={finalizandoOS}
              />
              <Label htmlFor="imprimir-finalizacao" className="text-sm cursor-pointer">
                🖨️ Abrir impressão da fatura após finalizar
              </Label>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={finalizandoOS}>
            Cancelar
          </Button>
          <Button 
            onClick={handleFinalizarOS} 
            disabled={formasPagamento.length === 0 || !formasPagamento.some(f => f.forma_pagamento && f.valor > 0) || finalizandoOS}
          >
            {finalizandoOS ? "Finalizando..." : (registrarComissao && tipoCalculo ? "Finalizar OS e Registrar Comissão" : "Finalizar OS")}
          </Button>
        </div>

        {/* Print Modal */}
        <PrintModal
          open={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          type="os_finalizada"
          data={osFinalizadaData}
          title={`Fatura de OS ${venda?.numero_os}`}
        />

        {/* Warning Modals */}
        <ProdutoOnlyWarningModal
          isOpen={showProdutoOnlyWarning}
          onClose={handleRejectProdutoOnly}
          onConfirm={handleConfirmProdutoOnly}
          onReject={handleRejectProdutoOnly}
        />

        <ServiceWarningModal
          isOpen={showServiceWarning}
          onClose={handleRejectService}
          onConfirm={handleConfirmService}
          onReject={handleRejectService}
        />

        <MecanicoWarningModal
          isOpen={showMecanicoWarning}
          onClose={handleRejectMecanico}
          onConfirm={handleConfirmMecanico}
          onReject={handleRejectMecanico}
        />

        <ComissaoWarningModal
          isOpen={showComissaoWarning}
          onClose={handleRejectComissao}
          onConfirm={handleConfirmComissao}
          onReject={handleRejectComissao}
          mecanicoNome={venda?.mecanico_nome}
        />
      </DialogContent>
    </Dialog>
  );
};