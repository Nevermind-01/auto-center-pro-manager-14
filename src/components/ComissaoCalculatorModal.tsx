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
import { mapVendaToCaixaFormaPagamento, type VendaFormaPagamento } from "@/lib/paymentMethodMapper";
import { useCaixa } from "@/hooks/useCaixa";

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
  const { caixaAtual } = useCaixa();

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
      // Validar pré-requisitos críticos
      if (!osData) {
        throw new Error("Dados da OS não fornecidos");
      }

      const { clienteSelecionado, veiculoSelecionado, servicosSelecionados, produtosSelecionados,
              formaPagamento, parcelas, valorDesconto, observacoes, numeroOS } = osData;

      const valorFinal = valorTotal - (valorDesconto || 0);

      // Validações obrigatórias mais específicas
      if (!clienteSelecionado?.id || !clienteSelecionado?.nome) {
        throw new Error("Cliente não selecionado ou dados incompletos");
      }

      if (!numeroOS || numeroOS.trim() === "") {
        throw new Error("Número da OS não foi gerado");
      }

      if (!mecanicoId || mecanicoId === "none") {
        throw new Error("Mecânico não selecionado");
      }

      if (!formaPagamento || formaPagamento.trim() === "") {
        throw new Error("Forma de pagamento não selecionada");
      }

      if (!servicosSelecionados || servicosSelecionados.length === 0) {
        throw new Error("É necessário ter pelo menos um serviço para calcular comissão");
      }

      // Validar cálculo de comissão
      if (tipoCalculo !== "percentual" && tipoCalculo !== "fixo") {
        throw new Error("Tipo de cálculo de comissão inválido");
      }

      if (tipoCalculo === "percentual" && (percentual <= 0 || percentual > 100)) {
        throw new Error("Percentual deve estar entre 0,01% e 100%");
      }

      if (tipoCalculo === "fixo" && valorFixo <= 0) {
        throw new Error("Valor fixo deve ser maior que zero");
      }

      // Validar base de cálculo
      const baseCalculada = getBaseCalculoValue();
      if (baseCalculada <= 0) {
        throw new Error("Base de cálculo deve ser maior que zero");
      }

      // Obter usuário autenticado
      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) {
        throw new Error("Usuário não autenticado");
      }

      // Preparar payload para o RPC
      const caixaFormaPagamento = mapVendaToCaixaFormaPagamento(
        formaPagamento as VendaFormaPagamento
      );

      const payload: any = {
        numeroOS: numeroOS.trim(),
        clienteId: clienteSelecionado.id,
        veiculoId: veiculoSelecionado?.id || null,
        mecanicoId,
        userId: user.data.user.id,
        valorTotal: valorTotal,
        valorDesconto: valorDesconto || 0,
        valorFinal,
        formaPagamento,
        parcelas: parcelas || 1,
        observacoes: observacoes || "",
        produtos: (produtosSelecionados || []).map((p) => ({
          id: p.id,
          nome: p.nome,
          valor: Number(p.valor) || 0,
          quantidade: Number(p.quantidade) || 0,
        })),
        servicos: servicosSelecionados.map((s) => ({
          id: s.id || null,
          nome: s.nome,
          valor: Number(s.valor) || 0,
        })),
        comissao: {
          tipoCalculo,
          percentual: tipoCalculo === "percentual" ? percentual : null,
          valorFixo: tipoCalculo === "fixo" ? valorFixo : null,
          observacoes: observacoes || "",
        },
      };

      if (caixaAtual?.id) {
        payload.caixa = {
          caixaId: caixaAtual.id,
          formaPagamento: caixaFormaPagamento,
        };
      }

      console.log("📋 Enviando payload para RPC:", payload);

      // Usar RPC para finalizar OS com comissão (integração completa e atômica)
      const { data: resultado, error: rpcError } = await supabase.rpc(
        'rpc_finalizar_os_com_comissao',
        { payload }
      );

      if (rpcError) {
        console.error("Erro no RPC:", rpcError);
        throw new Error(rpcError.message || "Erro ao finalizar OS");
      }

      const resultadoData = resultado as any;
      if (!resultadoData?.success) {
        throw new Error(
          resultadoData?.error || "Falha ao processar finalização da OS",
        );
      }

      if (!resultadoData.caixaRegistrado) {
        toast({
          title: "Atenção",
          description:
            "OS finalizada, mas não foi possível registrar movimentação no caixa.",
          variant: "destructive",
        });
      }

      toast({
        title: "Sucesso",
        description: `OS ${resultadoData.numeroOS} finalizada. Venda ${resultadoData.vendaId} registrada com comissão de R$ ${Number(
          resultadoData.valorComissao,
        ).toFixed(2)}`,
      });

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
      } else if (errorMessage.includes("row-level security")) {
        errorMessage = "Erro de permissão. Verifique se você tem acesso aos dados da empresa";
      } else if (errorMessage.includes("não selecionado") || errorMessage.includes("não foi gerado")) {
        errorMessage = "Dados obrigatórios não preenchidos: " + errorMessage;
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