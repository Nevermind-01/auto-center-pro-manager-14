import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePagamentosOS } from "@/hooks/usePagamentosOS";

interface OSPendente {
  id: string;
  numero_os: string;
  valor_final: number;
  cliente_nome: string;
  finalizado_em: string;
  valor_pago: number;
  valor_restante: number;
}

interface PagamentoOSModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  osPendente: OSPendente | null;
}

const formasPagamento = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "debito", label: "Cartão de Débito" },
  { value: "credito", label: "Cartão de Crédito" },
  { value: "outros", label: "Transferência/Outros" },
  { value: "cheque", label: "Cheque" },
];

export function PagamentoOSModal({ open, onOpenChange, osPendente }: PagamentoOSModalProps) {
  const [valorPago, setValorPago] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  
  const { registrarPagamento, isRegistrandoPagamento } = usePagamentosOS();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!osPendente || !valorPago || !formaPagamento) return;

    const valor = parseFloat(valorPago.replace(",", "."));
    
    if (valor <= 0) {
      alert("Valor deve ser maior que zero");
      return;
    }

    if (valor > osPendente.valor_restante) {
      alert(`Valor não pode ser maior que o restante (R$ ${osPendente.valor_restante.toFixed(2)})`);
      return;
    }

    registrarPagamento({
      osId: osPendente.id,
      valorPago: valor,
      formaPagamento,
      observacoes: observacoes || undefined,
    });

    // Reset form
    setValorPago("");
    setFormaPagamento("");
    setObservacoes("");
    onOpenChange(false);
  };

  const resetForm = () => {
    setValorPago("");
    setFormaPagamento("");
    setObservacoes("");
  };

  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  if (!osPendente) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento - OS {osPendente.numero_os}</DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{osPendente.cliente_nome}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Valor Total:</span>
              <span className="font-medium">R$ {osPendente.valor_final.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Já Pago:</span>
              <span className="text-green-600">R$ {osPendente.valor_pago.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Restante:</span>
              <span className="font-bold text-red-600">R$ {osPendente.valor_restante.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valor">Valor do Pagamento *</Label>
              <Input
                id="valor"
                type="text"
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="forma">Forma de Pagamento *</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {formasPagamento.map((forma) => (
                    <SelectItem key={forma.value} value={forma.value}>
                      {forma.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre o pagamento..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isRegistrandoPagamento || !valorPago || !formaPagamento}
            >
              {isRegistrandoPagamento ? "Registrando..." : "Registrar Pagamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}