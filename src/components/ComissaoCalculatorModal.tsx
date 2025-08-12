import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ComissaoCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinalized: () => void;
  vendaId: string;
  mecanicoId: string;
  mecanicoNome: string;
  valorServicos: number;
  valorTotal: number;
  // Dados necessários para finalizar a OS
  osData?: {
    clienteSelecionado: any;
    veiculoSelecionado: any;
    servicosSelecionados: any[];
    produtosSelecionados: any[];
    formaPagamento: string;
    parcelas: number;
    valorDesconto: number;
    observacoes: string;
    numeroOS: string;
    isEditing: boolean;
    editingVenda?: any;
  };
}

export const ComissaoCalculatorModal = ({
  isOpen,
  onClose,
  onFinalized,
  vendaId,
  mecanicoId,
  mecanicoNome,
  valorServicos,
  valorTotal,
  osData
}: ComissaoCalculatorModalProps) => {
  const { toast } = useToast();

  const [tipoCalculo, setTipoCalculo] = useState<"percentual" | "fixo">("percentual");
  const [baseCalculo, setBaseCalculo] = useState<"servicos" | "total" | "manual">("servicos");
  const [percentual, setPercentual] = useState<number>(10);
  const [valorFixo, setValorFixo] = useState<number>(0);
  const [valorManual, setValorManual] = useState<number>(0);
  const [observacoes, setObservacoes] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Calcular base de cálculo
  const getBaseCalculoValue = () => {
    switch (baseCalculo) {
      case "servicos":
        return valorServicos;
      case "total":
        return valorTotal;
      case "manual":
        return valorManual;
      default:
        return 0;
    }
  };

  // Calcular valor final da comissão
  const getValorFinalComissao = () => {
    const base = getBaseCalculoValue();
    
    if (tipoCalculo === "percentual") {
      return (base * percentual) / 100;
    } else {
      return valorFixo;
    }
  };


  const handleFinalizar = async () => {
    setIsProcessing(true);

    try {
      // Validar pré-requisitos
      if (!osData) {
        throw new Error("Dados da OS não fornecidos");
      }

      const { clienteSelecionado, veiculoSelecionado, servicosSelecionados, produtosSelecionados, 
              formaPagamento, parcelas, valorDesconto, observacoes, numeroOS } = osData;

      // Validações básicas
      if (!clienteSelecionado || !numeroOS || !mecanicoId) {
        throw new Error("Dados obrigatórios ausentes: cliente, número OS ou mecânico");
      }

      if (!formaPagamento) {
        throw new Error("Forma de pagamento é obrigatória");
      }

      if (servicosSelecionados.length === 0) {
        throw new Error("É necessário ter pelo menos um serviço para calcular comissão");
      }

      // Validar cálculo de comissão
      if (tipoCalculo !== "percentual" && tipoCalculo !== "fixo") {
        throw new Error("Tipo de cálculo inválido");
      }

      if (tipoCalculo === "percentual" && (percentual <= 0 || percentual > 100)) {
        throw new Error("Percentual deve estar entre 0,01% e 100%");
      }

      if (tipoCalculo === "fixo" && valorFixo <= 0) {
        throw new Error("Valor fixo deve ser maior que zero");
      }

      // Preparar payload para o RPC
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error("Usuário não autenticado");
      }

      const payload = {
        numeroOS,
        clienteId: clienteSelecionado.id,
        veiculoId: veiculoSelecionado?.id || null,
        mecanicoId,
        userId: user.data.user.id,
        valorTotal: valorTotal,
        valorDesconto,
        valorFinal: valorTotal - valorDesconto,
        formaPagamento,
        parcelas,
        observacoes: observacoes || "",
        produtos: produtosSelecionados.map(p => ({
          id: p.id,
          nome: p.nome,
          valor: p.valor,
          quantidade: p.quantidade
        })),
        servicos: servicosSelecionados.map(s => ({
          id: s.id || null,
          nome: s.nome,
          valor: s.valor
        })),
        comissao: {
          tipoCalculo,
          percentual: tipoCalculo === "percentual" ? percentual : null,
          valorFixo: tipoCalculo === "fixo" ? valorFixo : null,
          observacoes: observacoes || ""
        }
      };

      // Verificar se a OS já existe
      const { data: osExistente, error: osExistenteError } = await supabase
        .from('vendas')
        .select('id')
        .eq('numero_os', numeroOS)
        .maybeSingle();

      if (osExistenteError) {
        throw new Error("Erro ao verificar OS existente");
      }

      if (osExistente) {
        throw new Error("Esta OS já foi criada. Use o modo de edição.");
      }

      // Verificar autenticação
      const response = await supabase.auth.getSession();
      if (!response.data.session) {
        throw new Error("Sessão expirada");
      }

      // Criar a venda primeiro
      const { data: vendaCriada, error: vendaError } = await supabase
        .from("vendas")
        .insert({
          numero_os: numeroOS,
          cliente_id: clienteSelecionado.id,
          cliente_nome: clienteSelecionado.nome,
          veiculo_id: veiculoSelecionado?.id || null,
          mecanico_id: mecanicoId,
          forma_pagamento: formaPagamento as any,
          parcelas,
          valor_total: valorTotal,
          valor_desconto: valorDesconto,
          valor_final: valorTotal - valorDesconto,
          observacoes: observacoes || "",
          status: "finalizada",
          finalizado_em: new Date().toISOString(),
          user_id: user.data.user.id,
        })
        .select()
        .single();

      if (vendaError) {
        console.error("Erro ao criar venda:", vendaError);
        throw new Error("Erro ao criar OS: " + vendaError.message);
      }

      const novaVendaId = vendaCriada.id;

      try {
        // Inserir produtos e baixar estoque
        for (const produto of produtosSelecionados) {
          // Verificar estoque
          const { data: produtoEstoque, error: estoqueError } = await supabase
            .from("produtos")
            .select("quantidade")
            .eq("id", produto.id)
            .single();

          if (estoqueError || !produtoEstoque) {
            throw new Error(`Produto ${produto.nome} não encontrado`);
          }

          if (produtoEstoque.quantidade < produto.quantidade) {
            throw new Error(`Estoque insuficiente para ${produto.nome}. Disponível: ${produtoEstoque.quantidade}`);
          }

          // Inserir venda_produto
          const { error: vendaProdutoError } = await supabase
            .from("venda_produtos")
            .insert({
              venda_id: novaVendaId,
              produto_id: produto.id,
              produto_nome: produto.nome,
              quantidade: produto.quantidade,
              preco_unitario: produto.valor,
              preco_total: produto.valor * produto.quantidade,
            });

          if (vendaProdutoError) {
            throw new Error(`Erro ao inserir produto ${produto.nome}`);
          }

          // Baixar estoque
          const { error: updateEstoqueError } = await supabase
            .from("produtos")
            .update({
              quantidade: produtoEstoque.quantidade - produto.quantidade
            })
            .eq("id", produto.id);

          if (updateEstoqueError) {
            throw new Error(`Erro ao baixar estoque de ${produto.nome}`);
          }

          // Registrar movimentação
          const { error: movimentacaoError } = await supabase
            .from("movimentacoes")
            .insert({
              produto_id: produto.id,
              tipo: "saida",
              quantidade: produto.quantidade,
              quantidade_anterior: produtoEstoque.quantidade,
              motivo: `Venda - OS ${numeroOS}`,
              os_numero: numeroOS,
              valor_unitario: produto.valor,
              user_id: user.data.user.id,
            });

          if (movimentacaoError) {
            console.error("Erro ao registrar movimentação:", movimentacaoError);
          }
        }

        // Inserir serviços
        for (const servico of servicosSelecionados) {
          const { error: vendaServicoError } = await supabase
            .from("venda_servicos")
            .insert({
              venda_id: novaVendaId,
              servico_id: servico.id,
              servico_nome: servico.nome,
              preco: servico.valor,
            });

          if (vendaServicoError) {
            throw new Error(`Erro ao inserir serviço ${servico.nome}`);
          }
        }

        // Calcular e inserir comissão
        const baseCalculo = servicosSelecionados.reduce((total, s) => total + s.valor, 0);
        const valorComissao = tipoCalculo === "percentual" 
          ? (baseCalculo * percentual) / 100
          : valorFixo;

        const { error: comissaoError } = await supabase
          .from("comissoes_mecanicos")
          .insert({
            venda_id: novaVendaId,
            mecanico_id: mecanicoId,
            tipo_calculo: tipoCalculo,
            percentual: tipoCalculo === "percentual" ? percentual : null,
            valor_fixo: tipoCalculo === "fixo" ? valorFixo : null,
            valor_final: valorComissao,
            base_calculo: baseCalculo,
            observacoes: observacoes || null,
            user_id: user.data.user.id,
          });

        if (comissaoError) {
          throw new Error("Erro ao registrar comissão");
        }

        // Registrar logs
        const logs = [
          { tipo: "criacao", obs: `OS ${numeroOS} criada com valor total R$ ${(valorTotal - valorDesconto).toFixed(2)}` },
          { tipo: "edicao", obs: `Estoque baixado para OS ${numeroOS} - ${produtosSelecionados.length} produtos` },
          { tipo: "finalizacao", obs: `OS ${numeroOS} finalizada com pagamento ${formaPagamento}` },
          { tipo: "edicao", obs: `Comissão registrada. Base: R$ ${baseCalculo.toFixed(2)}, Valor: R$ ${valorComissao.toFixed(2)}` }
        ];

        for (const log of logs) {
          await supabase
            .from("log_movimentacoes")
            .insert({
              os_id: novaVendaId,
              tipo: log.tipo,
              usuario: "Sistema",
              observacoes: log.obs,
              user_id: user.data.user.id,
            });
        }

        // Sucesso
        toast({
          title: "Sucesso",
          description: `OS ${numeroOS} finalizada com comissão de R$ ${valorComissao.toFixed(2)}`,
        });

      } catch (innerError) {
        // Em caso de erro, tentar deletar a venda criada
        await supabase.from("vendas").delete().eq("id", novaVendaId);
        throw innerError;
      }

      onFinalized();

    } catch (error) {
      console.error("Erro ao finalizar OS com comissão:", error);
      
      let errorMessage = "Erro desconhecido";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Mensagens específicas para erros comuns
      if (errorMessage.includes("estoque insuficiente")) {
        errorMessage = "Estoque insuficiente para um ou mais produtos";
      } else if (errorMessage.includes("já existe")) {
        errorMessage = "Esta OS já foi finalizada";
      } else if (errorMessage.includes("não encontrado")) {
        errorMessage = "Dados não encontrados no sistema";
      }

      toast({
        title: "Erro ao finalizar OS",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calcular Comissão - {mecanicoNome}</DialogTitle>
          <DialogDescription>
            Configure os parâmetros para calcular a comissão do mecânico.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo dos valores */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Valor dos Serviços:</p>
                  <p className="font-medium">R$ {valorServicos.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor Total:</p>
                  <p className="font-medium">R$ {valorTotal.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * Valores serão recalculados no momento da confirmação
              </p>
            </CardContent>
          </Card>

          {/* Base de cálculo */}
          <div className="space-y-2">
            <Label>Base de Cálculo</Label>
            <Select value={baseCalculo} onValueChange={(value: "servicos" | "total" | "manual") => setBaseCalculo(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="servicos">Apenas Serviços (R$ {valorServicos.toFixed(2)})</SelectItem>
                <SelectItem value="total">Valor Total (R$ {valorTotal.toFixed(2)})</SelectItem>
                <SelectItem value="manual">Valor Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Valor manual */}
          {baseCalculo === "manual" && (
            <div className="space-y-2">
              <Label htmlFor="valorManual">Valor Base Manual (R$)</Label>
              <Input
                id="valorManual"
                type="number"
                step="0.01"
                min="0"
                value={valorManual}
                onChange={(e) => setValorManual(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
          )}

          {/* Tipo de cálculo */}
          <div className="space-y-2">
            <Label>Tipo de Cálculo</Label>
            <Select value={tipoCalculo} onValueChange={(value: "percentual" | "fixo") => setTipoCalculo(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentual">Percentual</SelectItem>
                <SelectItem value="fixo">Valor Fixo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Configurações do cálculo */}
          {tipoCalculo === "percentual" ? (
            <div className="space-y-2">
              <Label htmlFor="percentual">Percentual (%)</Label>
              <Input
                id="percentual"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={percentual}
                onChange={(e) => setPercentual(Number(e.target.value))}
                placeholder="10"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="valorFixo">Valor Fixo (R$)</Label>
              <Input
                id="valorFixo"
                type="number"
                step="0.01"
                min="0"
                value={valorFixo}
                onChange={(e) => setValorFixo(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre a comissão..."
              rows={3}
            />
          </div>

          <Separator />

          {/* Resultado */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Valor da Comissão:</span>
                <span className="text-lg font-bold text-primary">
                  R$ {getValorFinalComissao().toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {tipoCalculo === "percentual" 
                  ? `${percentual}% sobre R$ ${getBaseCalculoValue().toFixed(2)}`
                  : `Valor fixo`
                }
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handleFinalizar} disabled={isProcessing}>
            {isProcessing ? "Processando..." : "Finalizar com Comissão"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};