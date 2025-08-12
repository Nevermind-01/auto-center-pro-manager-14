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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OSData {
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
}

interface ComissaoCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinalized: () => void;
  vendaId: string; // Vazio para nova OS, preenchido para edição
  mecanicoId: string;
  mecanicoNome: string;
  valorServicos: number;
  valorTotal: number;
  osData: OSData;
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
  const [percentual, setPercentual] = useState<number>(10);
  const [valorFixo, setValorFixo] = useState<number>(0);
  const [observacoes, setObservacoes] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Calcular valor final da comissão (apenas para preview)
  const getValorFinalComissao = () => {
    if (tipoCalculo === "percentual") {
      return (valorServicos * percentual) / 100;
    } else {
      return valorFixo;
    }
  };

  // Validar dados antes de enviar
  const validarDados = (): string | null => {
    if (!mecanicoId || mecanicoId === "none") {
      return "Mecânico é obrigatório para calcular comissão.";
    }

    if (osData.servicosSelecionados.length === 0) {
      return "É necessário ter pelo menos um serviço para calcular comissão.";
    }

    if (!osData.clienteSelecionado) {
      return "Cliente é obrigatório.";
    }

    if (!osData.formaPagamento) {
      return "Forma de pagamento é obrigatória.";
    }

    if (tipoCalculo === "percentual" && (percentual <= 0 || percentual > 100)) {
      return "Informe um percentual entre 0,01% e 100%.";
    }

    if (tipoCalculo === "fixo" && valorFixo <= 0) {
      return "Informe um valor fixo maior que zero.";
    }

    return null;
  };

  // Função principal para finalizar OS com comissão atomicamente
  const handleFinalizarAtomico = async () => {
    // 1. Validar dados
    const erro = validarDados();
    if (erro) {
      toast({
        title: "Erro de validação",
        description: erro,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // 2. Obter usuário atual
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("Usuário não autenticado");
      }

      // 3. Calcular valores finais
      const valorProdutos = osData.produtosSelecionados.reduce(
        (total, produto) => total + (produto.valor * produto.quantidade), 0
      );
      const valorServicosCalculado = osData.servicosSelecionados.reduce(
        (total, servico) => total + servico.valor, 0
      );
      const valorTotalCalculado = valorProdutos + valorServicosCalculado;
      const valorFinalCalculado = valorTotalCalculado - osData.valorDesconto;

      // 4. Preparar payload para RPC
      const payload = {
        numeroOS: osData.numeroOS,
        clienteId: osData.clienteSelecionado.id,
        veiculoId: osData.veiculoSelecionado?.id || null,
        mecanicoId: mecanicoId,
        userId: userData.user.id,
        valorTotal: valorTotalCalculado,
        valorDesconto: osData.valorDesconto,
        valorFinal: valorFinalCalculado,
        formaPagamento: osData.formaPagamento,
        parcelas: osData.parcelas,
        observacoes: osData.observacoes,
        produtos: osData.produtosSelecionados.map(produto => ({
          id: produto.id,
          nome: produto.nome,
          quantidade: produto.quantidade,
          valor: produto.valor
        })),
        servicos: osData.servicosSelecionados.map(servico => ({
          id: servico.id || null,
          nome: servico.nome,
          valor: servico.valor
        })),
        comissao: {
          tipoCalculo: tipoCalculo,
          percentual: tipoCalculo === "percentual" ? percentual : null,
          valorFixo: tipoCalculo === "fixo" ? valorFixo : null,
          observacoes: observacoes
        }
      };

      console.log("🚀 Enviando payload para RPC:", payload);

      // 5. Chamar edge function que executa o RPC
      console.log("🚀 Enviando dados para edge function:", payload);
      
      const { data: result, error: rpcError } = await supabase.functions.invoke(
        'finalizar-os-comissao',
        { 
          body: JSON.stringify({ payload }),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log("📦 Resposta da edge function:", { result, rpcError });

      if (rpcError) {
        console.error("❌ Erro na edge function:", rpcError);
        
        // Verificar se é erro HTTP
        if (rpcError.message?.includes('non 2xx status code')) {
          toast({
            title: "Erro de comunicação",
            description: "Erro ao processar solicitação. Verifique sua conexão e tente novamente.",
            variant: "destructive",
          });
          return;
        }
        
        throw new Error(rpcError.message || 'Erro ao processar solicitação');
      }

      if (!result) {
        throw new Error("Resposta vazia do servidor");
      }

      if (result.error) {
        console.error("❌ Erro retornado pela função:", result.error);
        
        // Tratar erros específicos
        if (result.error.includes("já existe")) {
          toast({
            title: "OS já finalizada",
            description: "Esta OS já foi finalizada. Recarregue a página.",
            variant: "destructive",
          });
          return;
        }
        
        if (result.error.includes("Estoque insuficiente")) {
          toast({
            title: "Estoque insuficiente",
            description: result.error.split(": ")[1] || "Verifique o estoque dos produtos.",
            variant: "destructive",
          });
          return;
        }

        if (result.error.includes("não autenticado")) {
          toast({
            title: "Erro de autenticação",
            description: "Faça login novamente para continuar.",
            variant: "destructive",
          });
          return;
        }

        throw new Error(result.error);
      }

      if (!result.success) {
        throw new Error("Operação não foi concluída com sucesso");
      }

      console.log("✅ OS finalizada com sucesso:", result);

      // 6. Sucesso
      toast({
        title: "Sucesso!",
        description: `OS ${result.numeroOS} finalizada com comissão de R$ ${result.valorComissao.toFixed(2)}.`,
      });

      // Chamar callback de finalização
      onFinalized();

    } catch (error) {
      console.error("💥 Erro ao finalizar OS:", error);
      toast({
        title: "Erro ao finalizar OS",
        description: error instanceof Error ? error.message : "Erro desconhecido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={!isProcessing ? onClose : undefined}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalizar OS com Comissão - {mecanicoNome}</DialogTitle>
          <DialogDescription>
            Configure a comissão e finalize a OS atomicamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo da OS */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="text-lg">
                    {osData.numeroOS}
                  </Badge>
                  <Badge variant="secondary">
                    {osData.isEditing ? "Edição" : "Nova OS"}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Cliente:</p>
                    <p className="font-medium">{osData.clienteSelecionado?.nome}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mecânico:</p>
                    <p className="font-medium">{mecanicoNome}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Produtos:</p>
                    <p className="font-medium">{osData.produtosSelecionados.length} item(s)</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Serviços:</p>
                    <p className="font-medium">{osData.servicosSelecionados.length} item(s)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valores */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Valor dos Serviços:</p>
                  <p className="font-medium text-lg">R$ {valorServicos.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor Total:</p>
                  <p className="font-medium">R$ {valorTotal.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * Base da comissão: apenas serviços
              </p>
            </CardContent>
          </Card>

          {/* Tipo de cálculo */}
          <div className="space-y-2">
            <Label>Tipo de Cálculo</Label>
            <Select value={tipoCalculo} onValueChange={(value: "percentual" | "fixo") => setTipoCalculo(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentual">Percentual sobre Serviços</SelectItem>
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
                min="0.01"
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
                min="0.01"
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

          {/* Resultado da comissão */}
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
                  ? `${percentual}% sobre R$ ${valorServicos.toFixed(2)}`
                  : `Valor fixo`
                }
              </p>
            </CardContent>
          </Card>

          {/* Aviso importante */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Atenção:</strong> Esta operação irá finalizar a OS e registrar a comissão atomicamente. 
              Não será possível desfazer esta ação.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button 
            onClick={handleFinalizarAtomico} 
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? "Processando..." : "Finalizar OS com Comissão"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};