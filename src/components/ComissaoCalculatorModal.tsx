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
import { useComissoesMutations } from "@/hooks/useComissoes";
import { useToast } from "@/hooks/use-toast";

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
  const { createComissao } = useComissoesMutations();

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
    const baseValue = getBaseCalculoValue();
    const valorFinal = getValorFinalComissao();

    if (baseValue <= 0) {
      toast({
        title: "Erro",
        description: "Base de cálculo deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (valorFinal <= 0) {
      toast({
        title: "Erro", 
        description: "Valor da comissão deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      await createComissao.mutateAsync({
        venda_id: vendaId,
        mecanico_id: mecanicoId,
        tipo_calculo: tipoCalculo,
        percentual: tipoCalculo === "percentual" ? percentual : null,
        valor_fixo: tipoCalculo === "fixo" ? valorFixo : null,
        valor_final: valorFinal,
        base_calculo: baseValue,
        observacoes: observacoes || null,
      });

      toast({
        title: "Comissão calculada",
        description: `Comissão de R$ ${valorFinal.toFixed(2)} registrada para ${mecanicoNome}.`,
      });

      onFinalized();
    } catch (error) {
      console.error("Erro ao criar comissão:", error);
      toast({
        title: "Erro",
        description: "Erro ao registrar comissão.",
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