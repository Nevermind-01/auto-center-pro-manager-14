import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Edit, Trash2, Car, Plus, Lock, Info } from 'lucide-react';
import { useVeiculosByCliente, useVeiculoMutations, Cliente } from '@/hooks/useSupabaseQueries';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useMultipleVeiculosKmHistory } from '@/hooks/useVeiculoKmHistory';
import { AtualizarKmModal } from '@/components/AtualizarKmModal';

interface VeiculosClienteModalProps {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VeiculoForm {
  marca: string;
  modelo: string;
  placa: string;
  ano?: string;
  cor?: string;
  km_atual: number;
  observacoes?: string;
}

export function VeiculosClienteModal({ cliente, open, onOpenChange }: VeiculosClienteModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showKmModal, setShowKmModal] = useState(false);
  const [selectedVeiculoForKm, setSelectedVeiculoForKm] = useState<any>(null);
  const [formData, setFormData] = useState<VeiculoForm>({
    marca: '',
    modelo: '',
    placa: '',
    ano: '',
    cor: '',
    km_atual: 0,
    observacoes: ''
  });

  const { toast } = useToast();
  const { data: veiculos = [], isLoading } = useVeiculosByCliente(cliente?.id || '');
  const { createVeiculo, updateVeiculo, deleteVeiculo } = useVeiculoMutations();
  
  // Get KM history for all vehicles
  const veiculoIds = veiculos.map(v => v.id);
  const { data: kmHistoryMap = {} } = useMultipleVeiculosKmHistory(veiculoIds);
  
  // Check if current editing vehicle has KM history
  const editingVehicleHasHistory = editingId ? kmHistoryMap[editingId]?.hasHistory || false : false;

  const resetForm = () => {
    setFormData({
      marca: '',
      modelo: '',
      placa: '',
      ano: '',
      cor: '',
      km_atual: 0,
      observacoes: ''
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;

    if (!formData.marca || !formData.modelo || !formData.placa || formData.km_atual < 0) {
      toast({
        title: "Erro",
        description: "Marca, modelo, placa são obrigatórios e KM deve ser maior ou igual a zero.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingId) {
        await updateVeiculo.mutateAsync({
          id: editingId,
          ...formData
        });
        toast({
          title: "Sucesso",
          description: "Veículo atualizado com sucesso!",
        });
      } else {
        await createVeiculo.mutateAsync({
          ...formData,
          cliente_id: cliente.id
        });
        toast({
          title: "Sucesso",
          description: "Veículo adicionado com sucesso!",
        });
      }
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar veículo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (veiculo: any) => {
    setFormData({
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      placa: veiculo.placa,
      ano: veiculo.ano || '',
      cor: veiculo.cor || '',
      km_atual: veiculo.km_atual || 0,
      observacoes: veiculo.observacoes || ''
    });
    setEditingId(veiculo.id);
    setIsAdding(true);
  };

  const handleOpenKmModal = (veiculo: any) => {
    setSelectedVeiculoForKm(veiculo);
    setShowKmModal(true);
  };

  const handleKmUpdated = () => {
    setShowKmModal(false);
    setSelectedVeiculoForKm(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVeiculo.mutateAsync(id);
      toast({
        title: "Sucesso",
        description: "Veículo removido com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover veículo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (!cliente) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Veículos de {cliente.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Form for adding/editing vehicle */}
          <div className="border-b pb-4">
            {!isAdding ? (
              <Button onClick={() => setIsAdding(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Novo Veículo
              </Button>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="marca">Marca *</Label>
                    <Input
                      id="marca"
                      value={formData.marca}
                      onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                      placeholder="Ex: Toyota"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modelo">Modelo *</Label>
                    <Input
                      id="modelo"
                      value={formData.modelo}
                      onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                      placeholder="Ex: Corolla"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="placa">Placa *</Label>
                    <Input
                      id="placa"
                      value={formData.placa}
                      onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                      placeholder="Ex: ABC-1234"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ano">Ano/Modelo</Label>
                    <Input
                      id="ano"
                      value={formData.ano}
                      onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                      placeholder="Ex: 2020/2021"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cor">Cor</Label>
                    <Input
                      id="cor"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      placeholder="Ex: Prata"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="km_atual" className="flex items-center gap-2">
                      KM Atual *
                      {editingVehicleHasHistory && (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Label>
                    <Input
                      id="km_atual"
                      type="number"
                      value={formData.km_atual}
                      onChange={(e) => setFormData({ ...formData, km_atual: Number(e.target.value) || 0 })}
                      placeholder="Ex: 50000"
                      min="0"
                      required
                      disabled={editingVehicleHasHistory}
                      className={editingVehicleHasHistory ? "bg-muted cursor-not-allowed" : ""}
                    />
                    {editingVehicleHasHistory && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        KM não pode ser alterado - possui histórico de atualizações
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Ex: Cor prata, porta dianteira riscada"
                    rows={3}
                  />
                </div>

                {editingVehicleHasHistory && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Este veículo já possui histórico de quilometragem. Para atualizar o KM, 
                      use a funcionalidade específica que mantém o histórico de alterações.
                      <Button 
                        variant="link" 
                        className="p-0 h-auto ml-2 text-primary"
                        onClick={() => handleOpenKmModal(veiculos.find(v => v.id === editingId))}
                      >
                        Atualizar KM →
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={createVeiculo.isPending || updateVeiculo.isPending}>
                    {editingId ? 'Atualizar' : 'Adicionar'} Veículo
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* List of vehicles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Veículos Cadastrados ({veiculos.length})
            </h3>
            
            {isLoading ? (
              <div className="text-center py-4">Carregando veículos...</div>
            ) : veiculos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum veículo cadastrado para este cliente.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {veiculos.map((veiculo) => (
                  <Card key={veiculo.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-lg">
                            {veiculo.marca} {veiculo.modelo}
                          </h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p><strong>Placa:</strong> {veiculo.placa}</p>
                            {veiculo.ano && <p><strong>Ano/Modelo:</strong> {veiculo.ano}</p>}
                            {veiculo.cor && <p><strong>Cor:</strong> {veiculo.cor}</p>}
                            <p><strong>KM Atual:</strong> {Number(veiculo.km_atual || 0).toLocaleString('pt-BR')}</p>
                            {veiculo.observacoes && (
                              <p><strong>Observações:</strong> {veiculo.observacoes}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(veiculo)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          {kmHistoryMap[veiculo.id]?.hasHistory && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenKmModal(veiculo)}
                              title="Atualizar KM"
                            >
                              <Car className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o veículo {veiculo.marca} {veiculo.modelo} (placa: {veiculo.placa})?
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(veiculo.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      
      {/* KM Update Modal */}
      <AtualizarKmModal
        veiculo={selectedVeiculoForKm}
        open={showKmModal}
        onOpenChange={setShowKmModal}
        onKmUpdated={handleKmUpdated}
      />
    </Dialog>
  );
}