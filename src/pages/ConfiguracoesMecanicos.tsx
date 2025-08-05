import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Wrench, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  User,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useMecanicos, useCriarMecanico, useAtualizarMecanico, useDeletarMecanico, type Mecanico } from "@/hooks/useMecanicos";

const ConfiguracoesMecanicos = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [editingMecanico, setEditingMecanico] = useState<Mecanico | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    especialidade: '',
    telefone: '',
    ativo: true
  });

  const { data: mecanicos = [], isLoading } = useMecanicos(false); // Buscar todos, incluindo inativos
  const criarMecanico = useCriarMecanico();
  const atualizarMecanico = useAtualizarMecanico();
  const deletarMecanico = useDeletarMecanico();

  const resetForm = () => {
    setFormData({
      nome: '',
      especialidade: '',
      telefone: '',
      ativo: true
    });
    setEditingMecanico(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) return;

    try {
      if (editingMecanico) {
        await atualizarMecanico.mutateAsync({
          id: editingMecanico.id,
          ...formData
        });
      } else {
        await criarMecanico.mutateAsync(formData);
      }
      
      setShowDialog(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar mecânico:', error);
    }
  };

  const handleEdit = (mecanico: Mecanico) => {
    setEditingMecanico(mecanico);
    setFormData({
      nome: mecanico.nome,
      especialidade: mecanico.especialidade || '',
      telefone: mecanico.telefone || '',
      ativo: mecanico.ativo
    });
    setShowDialog(true);
  };

  const handleToggleAtivo = async (mecanico: Mecanico) => {
    try {
      await atualizarMecanico.mutateAsync({
        id: mecanico.id,
        ativo: !mecanico.ativo
      });
    } catch (error) {
      console.error('Erro ao alterar status do mecânico:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este mecânico?')) {
      try {
        await deletarMecanico.mutateAsync(id);
      } catch (error) {
        console.error('Erro ao deletar mecânico:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando mecânicos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="h-8 w-8" />
            Configurações de Mecânicos
          </h1>
          <p className="text-muted-foreground">Gerencie os mecânicos da oficina</p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Mecânico
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMecanico ? 'Editar Mecânico' : 'Novo Mecânico'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do mecânico"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="especialidade">Especialidade</Label>
                <Input
                  id="especialidade"
                  value={formData.especialidade}
                  onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                  placeholder="Ex: Motor, Suspensão, Freios"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo">Mecânico ativo</Label>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={criarMecanico.isPending || atualizarMecanico.isPending}>
                  {editingMecanico ? 'Atualizar' : 'Criar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Mecânicos */}
      <div className="grid gap-4">
        {mecanicos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum mecânico cadastrado</p>
            </CardContent>
          </Card>
        ) : (
          mecanicos.map((mecanico) => (
            <Card key={mecanico.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {mecanico.nome}
                        </h3>
                        <Badge variant={mecanico.ativo ? "default" : "secondary"}>
                          {mecanico.ativo ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inativo
                            </>
                          )}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {mecanico.especialidade && (
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4" />
                            <span>{mecanico.especialidade}</span>
                          </div>
                        )}
                        {mecanico.telefone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{mecanico.telefone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAtivo(mecanico)}
                      disabled={atualizarMecanico.isPending}
                    >
                      {mecanico.ativo ? (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          Inativar
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Ativar
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(mecanico)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(mecanico.id)}
                      disabled={deletarMecanico.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ConfiguracoesMecanicos;