import { useState, useEffect } from "react";
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
import { CheckCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useComissoesMutations } from "@/hooks/useComissoes";
import { useQueryClient } from "@tanstack/react-query";

interface AdicionarComissaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  osId: string;
  osNumero: string;
  mecanicoId: string;
  mecanicoNome: string;
  dataFinalizacao: string;
}

export const AdicionarComissaoModal = ({
  isOpen,
  onClose,
  osId,
  osNumero,
  mecanicoId,
  mecanicoNome,
  dataFinalizacao
}: AdicionarComissaoModalProps) => {
  const { toast } = useToast();
  const { createComissao } = useComissoesMutations();
  const queryClient = useQueryClient();

  const [tipoCalculo, setTipoCalculo] = useState<"percentual" | "fixo">("percentual");
  const [percentual, setPercentual] = useState<number>(10);
  const [valorFixo, setValorFixo] = useState<number>(0);
  const [observacoes, setObservacoes] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [valorServicos, setValorServicos] = useState<number>(0);
  const [valorTotalOS, setValorTotalOS] = useState<number>(0);
  const [baseCalculo, setBaseCalculo] = useState<"servicos" | "total">("servicos");
  const [isLoadingServicos, setIsLoadingServicos] = useState(true);

  useEffect(() => {
    if (isOpen && osId) {
      buscarDadosOS();
    }
  }, [isOpen, osId]);

  const buscarDadosOS = async () => {
    setIsLoadingServicos(true);
    try {
      // Buscar serviços
      const { data: servicosData, error: servicosError } = await supabase
        .from("venda_servicos")
        .select("preco")
        .eq("venda_id", osId);

      if (servicosError) throw servicosError;

      const totalServicos = (servicosData || []).reduce((acc, item) => acc + Number(item.preco || 0), 0);
      setValorServicos(totalServicos);

      // Buscar valor total da OS
      const { data: vendaData, error: vendaError } = await supabase
        .from("vendas")
        .select("valor_final")
        .eq("id", osId)
        .single();

      if (vendaError) throw vendaError;

      setValorTotalOS(vendaData?.valor_final || 0);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da OS",
        variant: "destructive",
      });
    } finally {
      setIsLoadingServicos(false);
    }
  };

  const getValorFinalComissao = () => {
    const baseValor = baseCalculo === "servicos" ? valorServicos : valorTotalOS;
    
    if (tipoCalculo === "percentual") {
      return (baseValor * percentual) / 100;
    } else {
      return valorFixo;
    }
  };

  const handleSalvar = async () => {
    setIsProcessing(true);

    try {
      const valorBase = baseCalculo === "servicos" ? valorServicos : valorTotalOS;

      // Validações
      if (valorBase <= 0) {
        throw new Error(`A OS não possui ${baseCalculo === "servicos" ? "serviços" : "valor"} para calcular comissão`);
      }

      if (tipoCalculo === "percentual" && (percentual <= 0 || percentual > 100)) {
        throw new Error("Percentual deve estar entre 0,01% e 100%");
      }

      if (tipoCalculo === "fixo" && (valorFixo <= 0 || valorFixo > valorBase)) {
        throw new Error(`Valor fixo deve ser maior que zero e não pode exceder ${baseCalculo === "servicos" ? "o valor dos serviços" : "o valor total"}`);
      }

      const valorFinal = getValorFinalComissao();

      // Verificar se já existe comissão para esta OS
      const { data: comissaoExistente } = await supabase
        .from("comissoes_mecanicos")
        .select("id")
        .eq("venda_id", osId)
        .maybeSingle();

      if (comissaoExistente) {
        throw new Error("Esta OS já possui uma comissão registrada");
      }

      const valorBaseCalculo = baseCalculo === "servicos" ? valorServicos : valorTotalOS;

      // Criar comissão
      await createComissao.mutateAsync({
        venda_id: osId,
        mecanico_id: mecanicoId,
        tipo_calculo: tipoCalculo,
        percentual: tipoCalculo === "percentual" ? percentual : null,
        valor_fixo: tipoCalculo === "fixo" ? valorFixo : null,
        valor_final: valorFinal,
        base_calculo: valorBaseCalculo,
        observacoes: observacoes || null,
      });

      // Atualizar a data de finalização para corresponder à OS original
      const { error: updateError } = await supabase
        .from("comissoes_mecanicos")
        .update({ finalizado_em: dataFinalizacao })
        .eq("venda_id", osId);

      if (updateError) {
        console.warn("Aviso: não foi possível atualizar data de finalização", updateError);
      }

      // Invalidar queries para atualizar as listagens
      queryClient.invalidateQueries({ queryKey: ["os_mecanico", mecanicoId] });
      queryClient.invalidateQueries({ queryKey: ["comissoes_mecanico", mecanicoId] });

      toast({
        title: "Sucesso",
        description: `Comissão de R$ ${valorFinal.toFixed(2)} adicionada à OS ${osNumero}`,
      });

      onClose();
    } catch (error) {
      console.error("Erro ao adicionar comissão:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      
      toast({
        title: "Erro ao adicionar comissão",
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
          <DialogTitle>Adicionar Comissão - OS {osNumero}</DialogTitle>
          <DialogDescription>
            Adicionar comissão retroativa para {mecanicoNome}
          </DialogDescription>
        </DialogHeader>

        {isLoadingServicos ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando dados da OS...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Resumo dos valores */}
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor dos Serviços:</span>
                    <span className="font-medium">R$ {valorServicos.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor Total da OS:</span>
                    <span className="font-medium">R$ {valorTotalOS.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Base de cálculo */}
            <div className="space-y-2">
              <Label>Base de Cálculo</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={baseCalculo === "servicos" ? "default" : "outline"}
                  onClick={() => setBaseCalculo("servicos")}
                  className="flex-1"
                >
                  <CheckCircle className={`h-4 w-4 mr-2 ${baseCalculo === "servicos" ? "opacity-100" : "opacity-0"}`} />
                  Valor dos Serviços
                </Button>
                <Button
                  type="button"
                  variant={baseCalculo === "total" ? "default" : "outline"}
                  onClick={() => setBaseCalculo("total")}
                  className="flex-1"
                >
                  <CheckCircle className={`h-4 w-4 mr-2 ${baseCalculo === "total" ? "opacity-100" : "opacity-0"}`} />
                  Valor Total da OS
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {baseCalculo === "servicos" 
                  ? "* Comissão calculada sobre o valor dos serviços apenas"
                  : "* Comissão calculada sobre o valor total da OS (produtos + serviços)"}
              </p>
            </div>

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
                  max={baseCalculo === "servicos" ? valorServicos : valorTotalOS}
                  value={valorFixo}
                  onChange={(e) => setValorFixo(Number(e.target.value))}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Máximo: R$ {(baseCalculo === "servicos" ? valorServicos : valorTotalOS).toFixed(2)}
                </p>
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
                    ? `${percentual}% sobre R$ ${(baseCalculo === "servicos" ? valorServicos : valorTotalOS).toFixed(2)} (${baseCalculo === "servicos" ? "Serviços" : "Total"})`
                    : `Valor fixo`
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isProcessing || isLoadingServicos}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={isProcessing || isLoadingServicos || (baseCalculo === "servicos" ? valorServicos : valorTotalOS) <= 0}>
            {isProcessing ? "Salvando..." : "Adicionar Comissão"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
