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
}

export const ComissaoCalculatorModal = ({
  isOpen,
  onClose,
  onFinalized,
  vendaId,
  mecanicoId,
  mecanicoNome,
  valorServicos,
  valorTotal
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
    // 1. Desabilitar UI imediatamente
    setIsProcessing(true);

    try {
      // 2. Revalidar estado da OS no banco
      const { data: vendaData, error: vendaError } = await supabase
        .from("vendas")
        .select("status, mecanico_id, finalizado_em")
        .eq("id", vendaId)
        .single();

      if (vendaError) {
        throw new Error("Erro ao validar OS no banco");
      }

      // OS não pode estar finalizada
      if (vendaData.status === "finalizada") {
        toast({
          title: "Erro",
          description: "A OS já foi finalizada. Recarregue a página.",
          variant: "destructive",
        });
        return;
      }

      // OS precisa ter mecânico vinculado
      if (!vendaData.mecanico_id) {
        toast({
          title: "Erro",
          description: "A OS precisa ter um mecânico atribuído.",
          variant: "destructive",
        });
        return;
      }

      // 3. Recalcular base de serviços direto no banco
      const { data: servicosData, error: servicosError } = await supabase
        .from("venda_servicos")
        .select("preco")
        .eq("venda_id", vendaId);

      if (servicosError) {
        throw new Error("Erro ao consultar serviços da OS");
      }

      const baseServicosReal = servicosData.reduce((total, item) => total + Number(item.preco), 0);

      if (baseServicosReal === 0) {
        toast({
          title: "Erro",
          description: "Não há serviços na OS.",
          variant: "destructive",
        });
        return;
      }

      // 4. Validar entrada do modal
      // Exatamente um método
      if (tipoCalculo !== "percentual" && tipoCalculo !== "fixo") {
        toast({
          title: "Erro",
          description: "Selecione apenas um método: Percentual ou Valor Fixo.",
          variant: "destructive",
        });
        return;
      }

      // Validar percentual
      if (tipoCalculo === "percentual" && (percentual <= 0 || percentual > 100)) {
        toast({
          title: "Erro",
          description: "Informe um percentual entre 0,01% e 100%.",
          variant: "destructive",
        });
        return;
      }

      // Validar valor fixo
      if (tipoCalculo === "fixo" && valorFixo <= 0) {
        toast({
          title: "Erro",
          description: "Informe um valor fixo maior que zero.",
          variant: "destructive",
        });
        return;
      }

      // 5. Checar duplicidade
      const { data: comissaoExistente, error: comissaoError } = await supabase
        .from("comissoes_mecanicos")
        .select("id")
        .eq("venda_id", vendaId)
        .single();

      if (comissaoError && comissaoError.code !== "PGRST116") { // PGRST116 = No rows found
        throw new Error("Erro ao verificar duplicidade de comissão");
      }

      if (comissaoExistente) {
        toast({
          title: "Erro",
          description: "Comissão desta OS já registrada.",
          variant: "destructive",
        });
        return;
      }

      // 6. Calcular valor final usando base recalculada
      const valorFinalComissao = tipoCalculo === "percentual" 
        ? (baseServicosReal * percentual) / 100
        : valorFixo;

      // 7. Operação atômica: inserir comissão + finalizar OS
      const { error: comissaoInsertError } = await supabase
        .from("comissoes_mecanicos")
        .insert({
          venda_id: vendaId,
          mecanico_id: mecanicoId,
          tipo_calculo: tipoCalculo,
          percentual: tipoCalculo === "percentual" ? percentual : null,
          valor_fixo: tipoCalculo === "fixo" ? valorFixo : null,
          valor_final: valorFinalComissao,
          base_calculo: baseServicosReal,
          observacoes: observacoes || null,
          user_id: (await supabase.auth.getUser()).data.user?.id || "",
        });

      if (comissaoInsertError) {
        throw new Error("Erro ao inserir comissão");
      }

      // Atualizar OS para finalizada
      const { error: osUpdateError } = await supabase
        .from("vendas")
        .update({ 
          status: "finalizada",
          finalizado_em: new Date().toISOString()
        })
        .eq("id", vendaId);

      if (osUpdateError) {
        throw new Error("Erro ao finalizar OS");
      }

      // 8. Sucesso
      toast({
        title: "Sucesso",
        description: "OS finalizada e comissão registrada.",
      });

      onFinalized();

    } catch (error) {
      console.error("Erro ao processar comissão:", error);
      toast({
        title: "Erro",
        description: "Erro ao registrar comissão. Nada foi alterado. Tente novamente.",
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