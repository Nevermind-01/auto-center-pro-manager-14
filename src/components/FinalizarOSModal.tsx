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
import { DollarSign, Package, Wrench, ShoppingCart, AlertTriangle } from "lucide-react";

interface FinalizarOSModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venda: any;
}

export const FinalizarOSModal = ({ open, onOpenChange, venda }: FinalizarOSModalProps) => {
  const { toast } = useToast();
  const { updateVenda } = useVendaMutations();
  const { createLog } = useLogMovimentacaoMutations();
  const estoqueManager = useSupabaseEstoque();

  // Estados para a finalização
  const [desconto, setDesconto] = useState(0);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [parcelas, setParcelas] = useState(1);
  const [observacoes, setObservacoes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Resetar valores quando a modal abrir/fechar ou venda mudar
  useEffect(() => {
    if (open && venda) {
      // Calcular desconto em porcentagem baseado nos valores existentes
      const descontoPercentual = venda.valor_total > 0 
        ? (venda.valor_desconto || 0) / venda.valor_total * 100
        : 0;
      setDesconto(descontoPercentual);
      setFormaPagamento(venda.forma_pagamento || '');
      setParcelas(venda.parcelas || 1);
      setObservacoes(venda.observacoes || '');
    } else {
      // Reset quando fechar
      setDesconto(0);
      setFormaPagamento("");
      setParcelas(1);
      setObservacoes("");
    }
  }, [open, venda]);

  if (!venda) return null;

  // Cálculos de valores
  const produtos = venda.venda_produtos || [];
  const servicos = venda.venda_servicos || [];
  
  const valorProdutos = produtos.reduce((total: number, produto: any) => 
    total + (Number(produto.preco_total) || 0), 0
  );
  
  const valorServicos = servicos.reduce((total: number, servico: any) => 
    total + (Number(servico.preco) || 0), 0
  );
  
  const valorTotal = valorProdutos + valorServicos;
  const valorDesconto = (valorTotal * desconto) / 100;
  const valorFinal = valorTotal - valorDesconto;

  const handleFinalizarOS = async () => {
    if (!formaPagamento) {
      toast({
        title: "Erro", 
        description: "Selecione uma forma de pagamento.",
        variant: "destructive",
      });
      return;
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
            setIsLoading(false);
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
          setIsLoading(false);
          return;
        }
      }

      // Atualizar a venda com os novos valores e status finalizada
      await updateVenda.mutateAsync({
        id: venda.id,
        valor_total: valorTotal,
        valor_desconto: valorDesconto,
        valor_final: valorFinal,
        forma_pagamento: formaPagamento as any,
        parcelas: formaPagamento === 'parcelado' ? parcelas : 1,
        observacoes: observacoes || null,
        status: 'finalizada'
      });

      // Registrar log de finalização
      await createLog.mutateAsync({
        os_id: venda.id,
        tipo: 'finalizacao',
        usuario: 'Admin',
        observacoes: `OS ${venda.numero_os} finalizada via modal - ${formaPagamento}${formaPagamento === 'parcelado' ? ` (${parcelas}x)` : ''}`
      });

      toast({
        title: "OS finalizada",
        description: `OS ${venda.numero_os} foi finalizada com sucesso.`,
      });

      onOpenChange(false);

    } catch (error) {
      console.error('Erro ao finalizar OS:', error);
      toast({
        title: "Erro",
        description: "Erro ao finalizar a OS. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* Coluna 2: Pagamento */}
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
                  <div className="flex justify-between items-center">
                    <Label htmlFor="desconto" className="text-sm">Desconto (%):</Label>
                    <Input
                      id="desconto"
                      type="number"
                      min="0"
                      max="100"
                      value={desconto}
                      onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                      className="w-20 h-8"
                    />
                  </div>
                  {desconto > 0 && (
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

            {/* Forma de pagamento */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="forma-pagamento">Forma de Pagamento *</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="parcelado">Parcelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Parcelas (se parcelado) */}
              {formaPagamento === "parcelado" && (
                <div>
                  <Label htmlFor="parcelas">Número de Parcelas</Label>
                  <Select value={parcelas.toString()} onValueChange={(value) => setParcelas(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 10, 12].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}x de R$ {(valorFinal / num).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Observações */}
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações adicionais..."
                  rows={3}
                />
              </div>

              {/* Alertas */}
              {!formaPagamento && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Selecione uma forma de pagamento para continuar
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleFinalizarOS} 
            disabled={!formaPagamento || isLoading}
          >
            {isLoading ? "Finalizando..." : "Finalizar OS"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};