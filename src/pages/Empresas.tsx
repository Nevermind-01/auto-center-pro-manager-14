import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Lock, 
  Unlock, 
  Save, 
  X, 
  Shield, 
  Clock,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { useEmpresaContext } from '@/hooks/useEmpresaContext';
import { useEmpresaData, EmpresaData } from '@/hooks/useEmpresaData';
import { useReauth } from '@/hooks/useReauth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { ConfirmEditModal } from '@/components/ConfirmEditModal';
import { EmpresaFormTabs } from '@/components/EmpresaFormTabs';
import { toast } from '@/hooks/use-toast';

const Empresas = () => {
  const { empresaAtual, empresaRole } = useEmpresaContext();
  const { fetchEmpresaData, updateEmpresaData } = useEmpresaData();
  const { reauthSession, authenticateUser, cancelReauth, formatTimeRemaining } = useReauth();
  
  const [empresaData, setEmpresaData] = useState<EmpresaData | null>(null);
  const [formData, setFormData] = useState<Partial<EmpresaData>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const isOwner = empresaRole === 'owner';
  const canEdit = isOwner && reauthSession.isActive;

  const { execute: handleSave, isLoading: saving } = useAsyncAction(
    async () => {
      if (!empresaData) return;
      
      // Filtrar apenas campos que foram alterados
      const changes: Partial<EmpresaData> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== (empresaData as any)[key]) {
          (changes as any)[key] = value;
        }
      });

      if (Object.keys(changes).length === 0) {
        toast({
          title: "Nenhuma alteração",
          description: "Não há alterações para salvar",
        });
        return;
      }

      const success = await updateEmpresaData(changes);
      if (success) {
        // Recarregar dados após salvar
        await loadEmpresaData();
        cancelReauth();
      }
    },
    'save-empresa'
  );

  const loadEmpresaData = async () => {
    setLoading(true);
    const data = await fetchEmpresaData();
    if (data) {
      setEmpresaData(data);
      setFormData(data);
    }
    setLoading(false);
  };

  const handleUnlockEdit = async (password: string) => {
    return await authenticateUser(password);
  };

  const handleCancelEdit = () => {
    if (empresaData) {
      setFormData(empresaData);
    }
    cancelReauth();
  };

  const handleFormChange = (updates: Partial<EmpresaData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    loadEmpresaData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados da empresa...</p>
        </div>
      </div>
    );
  }

  if (!empresaData) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-muted-foreground">
            Dados da empresa não encontrados
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Empresas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os dados oficiais da sua empresa. Edição permitida apenas ao owner.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isOwner ? "default" : "secondary"}>
            {empresaRole === 'owner' && 'Owner'}
            {empresaRole === 'admin' && 'Admin'}
            {empresaRole === 'user' && 'Usuário'}
          </Badge>
          
          {reauthSession.isActive && (
            <Badge variant="outline" className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Edição: {formatTimeRemaining(reauthSession.timeRemaining)}
            </Badge>
          )}
        </div>
      </div>

      {/* Card de Resumo */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {empresaData.nome_fantasia || empresaData.nome}
                </CardTitle>
                <p className="text-muted-foreground">
                  {empresaData.razao_social && empresaData.razao_social !== empresaData.nome_fantasia 
                    ? empresaData.razao_social 
                    : 'Razão social não informada'
                  }
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {empresaData.cnpj && (
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      CNPJ: {empresaData.cnpj}
                    </span>
                  )}
                  {empresaData.municipio && empresaData.uf && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {empresaData.municipio}/{empresaData.uf}
                    </span>
                  )}
                  {empresaData.telefone_principal && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {empresaData.telefone_principal}
                    </span>
                  )}
                  {empresaData.email_fiscal && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {empresaData.email_fiscal}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Botão de desbloqueio (apenas para owner) */}
              {isOwner && !reauthSession.isActive && (
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmModal(true)}
                  className="flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Desbloquear edição
                </Button>
              )}
              
              {/* Botões de salvar/cancelar (apenas em modo edição) */}
              {canEdit && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar alterações
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status da Edição */}
      {!isOwner && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Visualização apenas</p>
                <p className="text-sm text-amber-700">
                  Você não tem permissão para editar. Somente o owner pode alterar os dados da empresa.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {canEdit && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Unlock className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Modo de edição ativo</p>
                <p className="text-sm text-green-700">
                  Você pode editar os dados da empresa. A sessão expira em {formatTimeRemaining(reauthSession.timeRemaining)}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Formulário em Tabs */}
      <EmpresaFormTabs
        data={formData as EmpresaData}
        onChange={handleFormChange}
        disabled={!canEdit}
      />

      {/* Modal de Confirmação */}
      <ConfirmEditModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={handleUnlockEdit}
      />
    </div>
  );
};

export default Empresas;