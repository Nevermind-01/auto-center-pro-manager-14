import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ContaPagar } from '@/hooks/useContasPagar';
import { FileUp, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ContaEditModalProps {
  conta: ContaPagar | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<ContaPagar>) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
  uploadComprovante: (file: File) => Promise<string>;
}

export function ContaEditModal({ 
  conta, 
  isOpen, 
  onClose, 
  onUpdate, 
  onDelete, 
  uploadComprovante 
}: ContaEditModalProps) {
  const [formData, setFormData] = useState<{
    empresa: string;
    descricao: string;
    valor: string;
    vencimento: string;
    status: 'pendente' | 'paga' | 'cancelada';
    forma_pagamento: string;
    fixa: boolean;
  }>({
    empresa: '',
    descricao: '',
    valor: '',
    vencimento: '',
    status: 'pendente',
    forma_pagamento: '',
    fixa: false
  });
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (conta) {
      setFormData({
        empresa: conta.empresa,
        descricao: conta.descricao || '',
        valor: conta.valor.toString(),
        vencimento: conta.vencimento,
        status: conta.status,
        forma_pagamento: conta.forma_pagamento || '',
        fixa: conta.fixa
      });
    }
  }, [conta]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conta || !formData.empresa || !formData.valor || !formData.vencimento) {
      return;
    }

    setIsSubmitting(true);
    try {
      let updateData: any = {
        empresa: formData.empresa,
        descricao: formData.descricao || null,
        valor: parseFloat(formData.valor),
        vencimento: formData.vencimento,
        status: formData.status,
        forma_pagamento: formData.forma_pagamento || null,
        fixa: formData.fixa
      };

      // Se mudou o status para pago e não havia data de pagamento
      if (formData.status === 'paga' && !conta.data_pagamento) {
        updateData.data_pagamento = new Date().toISOString().split('T')[0];
      }

      // Se tem novo comprovante, fazer upload
      if (comprovante) {
        const comprovante_url = await uploadComprovante(comprovante);
        updateData.comprovante_url = comprovante_url;
      }

      await onUpdate(conta.id, updateData);
      onClose();
      setComprovante(null);
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!conta) return;

    setIsDeleting(true);
    try {
      await onDelete(conta.id);
      onClose();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!conta) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Editar Conta a Pagar</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant={conta.status === 'paga' ? 'default' : conta.status === 'cancelada' ? 'destructive' : 'secondary'}>
                {conta.status === 'paga' ? 'Paga' : conta.status === 'cancelada' ? 'Cancelada' : 'Pendente'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa *</Label>
              <Input
                id="empresa"
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                placeholder="Nome da empresa"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vencimento">Data de Vencimento *</Label>
              <Input
                id="vencimento"
                type="date"
                value={formData.vencimento}
                onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="paga">Paga</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
              <Select
                value={formData.forma_pagamento}
                onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="debito">Cartão de Débito</SelectItem>
                  <SelectItem value="credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="boleto">Boleto Bancário</SelectItem>
                  <SelectItem value="carteira">Carteira Digital</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comprovante">Novo Comprovante</Label>
              <Input
                id="comprovante"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setComprovante(e.target.files?.[0] || null)}
              />
              {comprovante && (
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: {comprovante.name}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição da conta (opcional)"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="fixa"
              checked={formData.fixa}
              onCheckedChange={(checked) => setFormData({ ...formData, fixa: !!checked })}
            />
            <Label htmlFor="fixa">Conta fixa</Label>
          </div>

          {/* Comprovante atual */}
          {conta.comprovante_url && (
            <div className="space-y-2">
              <Label>Comprovante Atual</Label>
              <div className="p-3 bg-muted rounded-lg">
                <a 
                  href={conta.comprovante_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <FileUp className="h-4 w-4" />
                  Ver comprovante atual
                </a>
              </div>
            </div>
          )}

          {/* Informações de auditoria */}
          <div className="space-y-2">
            <Label>Informações</Label>
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <p><strong>Criado em:</strong> {new Date(conta.created_at).toLocaleString('pt-BR')}</p>
              <p><strong>Atualizado em:</strong> {new Date(conta.updated_at).toLocaleString('pt-BR')}</p>
              {conta.data_pagamento && (
                <p><strong>Data do pagamento:</strong> {new Date(conta.data_pagamento).toLocaleDateString('pt-BR')}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Botões de ação */}
          <div className="flex items-center justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir a conta "{conta.empresa}"? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Excluindo...' : 'Excluir'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}