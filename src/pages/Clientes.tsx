import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useClientes, useClienteMutations, Cliente } from '@/hooks/useSupabaseQueries';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: clientes = [], isLoading } = useClientes();
  const { createCliente, updateCliente, deleteCliente } = useClienteMutations();
  const { toast } = useToast();

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cliente.telefone && cliente.telefone.includes(searchTerm)) ||
    (cliente.cpf && cliente.cpf.includes(searchTerm)) ||
    (cliente.cnpj && cliente.cnpj.includes(searchTerm))
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const clienteData = {
      nome: formData.get('nome') as string,
      email: formData.get('email') as string || null,
      telefone: formData.get('telefone') as string || null,
      cpf: formData.get('cpf') as string || null,
      cnpj: formData.get('cnpj') as string || null,
      rg: formData.get('rg') as string || null,
      rua: formData.get('rua') as string || null,
      numero_residencia: formData.get('numero_residencia') as string || null,
      bairro: formData.get('bairro') as string || null,
      cidade: formData.get('cidade') as string || null,
      estado: formData.get('estado') as string || null,
      endereco: null, // Legacy field, keeping as null
    };

    try {
      if (isEditing && selectedCliente) {
        await updateCliente.mutateAsync({ id: selectedCliente.id, ...clienteData });
        toast({ title: "Cliente atualizado com sucesso!" });
      } else {
        await createCliente.mutateAsync(clienteData);
        toast({ title: "Cliente criado com sucesso!" });
      }
      setIsDialogOpen(false);
      setSelectedCliente(null);
      setIsEditing(false);
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Erro ao salvar cliente", 
        variant: "destructive" 
      });
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await deleteCliente.mutateAsync(id);
        toast({ title: "Cliente excluído com sucesso!" });
      } catch (error) {
        toast({ 
          title: "Erro", 
          description: "Erro ao excluir cliente", 
          variant: "destructive" 
        });
      }
    }
  };

  const openNewClienteDialog = () => {
    setSelectedCliente(null);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-6">Carregando clientes...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gerenciamento de Clientes</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewClienteDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input 
                    id="nome" 
                    name="nome" 
                    defaultValue={selectedCliente?.nome || ''} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    defaultValue={selectedCliente?.email || ''} 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input 
                    id="telefone" 
                    name="telefone" 
                    defaultValue={selectedCliente?.telefone || ''} 
                  />
                </div>
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input 
                    id="cpf" 
                    name="cpf" 
                    defaultValue={selectedCliente?.cpf || ''} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input 
                    id="cnpj" 
                    name="cnpj" 
                    defaultValue={selectedCliente?.cnpj || ''} 
                  />
                </div>
                <div>
                  <Label htmlFor="rg">RG</Label>
                  <Input 
                    id="rg" 
                    name="rg" 
                    defaultValue={selectedCliente?.rg || ''} 
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Endereço</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rua">Rua</Label>
                    <Input 
                      id="rua" 
                      name="rua" 
                      defaultValue={selectedCliente?.rua || ''} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="numero_residencia">Número</Label>
                    <Input 
                      id="numero_residencia" 
                      name="numero_residencia" 
                      defaultValue={selectedCliente?.numero_residencia || ''} 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input 
                      id="bairro" 
                      name="bairro" 
                      defaultValue={selectedCliente?.bairro || ''} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input 
                      id="cidade" 
                      name="cidade" 
                      defaultValue={selectedCliente?.cidade || ''} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <Input 
                      id="estado" 
                      name="estado" 
                      defaultValue={selectedCliente?.estado || ''} 
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {isEditing ? 'Atualizar' : 'Criar'} Cliente
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Buscar Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, telefone, CPF ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredClientes.map((cliente) => (
          <Card key={cliente.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{cliente.nome}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      {cliente.email && <p>Email: {cliente.email}</p>}
                      {cliente.telefone && <p>Telefone: {cliente.telefone}</p>}
                      {cliente.cpf && <p>CPF: {cliente.cpf}</p>}
                      {cliente.cnpj && <p>CNPJ: {cliente.cnpj}</p>}
                      {cliente.rg && <p>RG: {cliente.rg}</p>}
                    </div>
                    <div>
                      {(cliente.rua || cliente.numero_residencia || cliente.bairro || cliente.cidade || cliente.estado) && (
                        <div>
                          <p className="font-medium">Endereço:</p>
                          {cliente.rua && <p>{cliente.rua}{cliente.numero_residencia && `, ${cliente.numero_residencia}`}</p>}
                          {cliente.bairro && <p>{cliente.bairro}</p>}
                          {cliente.cidade && <p>{cliente.cidade}{cliente.estado && ` - ${cliente.estado}`}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(cliente)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(cliente.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClientes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Nenhum cliente encontrado.
          </CardContent>
        </Card>
      )}
    </div>
  );
}