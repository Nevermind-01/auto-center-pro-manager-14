import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useClientes, useClienteMutations, Cliente } from '@/hooks/useSupabaseQueries';
import { MaskedClienteCard } from '@/components/MaskedClienteCard';
import { VeiculosClienteModal } from '@/components/VeiculosClienteModal';
import { ClienteHistoricoModal } from '@/components/ClienteHistoricoModal';
import { VisualizarOSModal } from '@/components/VisualizarOSModal';
import { VisualizarOrcamentoModal } from '@/components/VisualizarOrcamentoModal';
import { useClienteValidation } from '@/hooks/useClienteValidation';
import { sanitizeClienteData } from '@/lib/inputSanitizer';
import { Search, Plus, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isVeiculosModalOpen, setIsVeiculosModalOpen] = useState(false);
  const [selectedClienteVeiculos, setSelectedClienteVeiculos] = useState<Cliente | null>(null);
  const [selectedClienteHistorico, setSelectedClienteHistorico] = useState<Cliente | null>(null);
  const [isHistoricoModalOpen, setIsHistoricoModalOpen] = useState(false);
  const [isVisualizarOSModalOpen, setIsVisualizarOSModalOpen] = useState(false);
  const [selectedOS, setSelectedOS] = useState<string | null>(null);
  const [isVisualizarOrcamentoModalOpen, setIsVisualizarOrcamentoModalOpen] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<any>(null);
  
  const { data: clientes = [], isLoading } = useClientes();
  const { createCliente, updateCliente, deleteCliente } = useClienteMutations();
  const { errors, validateClienteData, formatCPF, formatCNPJ, formatTelefone, clearErrors } = useClienteValidation();
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
    clearErrors();
    
    const formData = new FormData(e.currentTarget);
    
    const rawClienteData = {
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

    // Sanitize all input data to prevent XSS and injection attacks
    const sanitizedData = sanitizeClienteData(rawClienteData);
    
    // Ensure required fields are present and properly typed
    const clienteData = {
      nome: sanitizedData.nome || '',
      email: sanitizedData.email || null,
      telefone: sanitizedData.telefone || null,
      cpf: sanitizedData.cpf || null,
      cnpj: sanitizedData.cnpj || null,
      rg: sanitizedData.rg || null,
      rua: sanitizedData.rua || null,
      numero_residencia: sanitizedData.numero_residencia || null,
      bairro: sanitizedData.bairro || null,
      cidade: sanitizedData.cidade || null,
      estado: sanitizedData.estado || null,
      endereco: null as null, // Legacy field, keeping as null
    };

    // Validate sensitive data
    const dataToValidate = Object.fromEntries(
      Object.entries(clienteData).filter(([_, value]) => value !== null && value !== '')
    ) as Record<string, string>;

    if (!validateClienteData(dataToValidate)) {
      toast({ 
        title: "Dados inválidos", 
        description: "Verifique os campos destacados", 
        variant: "destructive" 
      });
      return;
    }

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
    } catch (error: any) {
      const errorMessage = error?.message || "Erro ao salvar cliente";
      toast({ 
        title: "Erro", 
        description: errorMessage, 
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

  const handleViewVeiculos = (cliente: Cliente) => {
    setSelectedClienteVeiculos(cliente);
    setIsVeiculosModalOpen(true);
  };

  const handleViewHistorico = (cliente: Cliente) => {
    setSelectedClienteHistorico(cliente);
    setIsHistoricoModalOpen(true);
  };

  const handleViewOS = (osId: string) => {
    setSelectedOS(osId);
    setIsVisualizarOSModalOpen(true);
  };

  const handleViewOrcamento = (orcamento: any) => {
    setSelectedOrcamento(orcamento);
    setIsVisualizarOrcamentoModalOpen(true);
  };

  const openNewClienteDialog = () => {
    setSelectedCliente(null);
    setIsEditing(false);
    clearErrors();
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-6">Carregando clientes...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Gerenciamento de Clientes</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewClienteDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Os dados pessoais inseridos são protegidos por criptografia e auditoria de acesso.
              </AlertDescription>
            </Alert>
            
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
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive mt-1">{errors.email}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input 
                    id="telefone" 
                    name="telefone" 
                    defaultValue={selectedCliente?.telefone || ''} 
                    placeholder="(00) 00000-0000"
                    className={errors.telefone ? 'border-destructive' : ''}
                  />
                  {errors.telefone && (
                    <p className="text-xs text-destructive mt-1">{errors.telefone}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input 
                    id="cpf" 
                    name="cpf" 
                    defaultValue={selectedCliente?.cpf || ''} 
                    placeholder="000.000.000-00"
                    className={errors.cpf ? 'border-destructive' : ''}
                  />
                  {errors.cpf && (
                    <p className="text-xs text-destructive mt-1">{errors.cpf}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input 
                    id="cnpj" 
                    name="cnpj" 
                    defaultValue={selectedCliente?.cnpj || ''} 
                    placeholder="00.000.000/0000-00"
                    className={errors.cnpj ? 'border-destructive' : ''}
                  />
                  {errors.cnpj && (
                    <p className="text-xs text-destructive mt-1">{errors.cnpj}</p>
                  )}
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
           <MaskedClienteCard
             key={cliente.id}
             cliente={cliente}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewVeiculos={handleViewVeiculos}
                onViewHistorico={handleViewHistorico}
           />
        ))}
      </div>

      {filteredClientes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Nenhum cliente encontrado.
          </CardContent>
        </Card>
      )}

      <VeiculosClienteModal
        cliente={selectedClienteVeiculos}
        open={isVeiculosModalOpen}
        onOpenChange={setIsVeiculosModalOpen}
      />
      
      <ClienteHistoricoModal
        cliente={selectedClienteHistorico}
        open={isHistoricoModalOpen}
        onOpenChange={setIsHistoricoModalOpen}
        onViewOS={handleViewOS}
        onViewOrcamento={handleViewOrcamento}
      />

      <VisualizarOSModal
        osId={selectedOS}
        open={isVisualizarOSModalOpen}
        onOpenChange={setIsVisualizarOSModalOpen}
      />

      <VisualizarOrcamentoModal
        orcamento={selectedOrcamento}
        open={isVisualizarOrcamentoModalOpen}
        onClose={() => setIsVisualizarOrcamentoModalOpen(false)}
      />
    </div>
  );
}