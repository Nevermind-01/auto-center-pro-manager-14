import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, Phone, Calculator, Settings, FileText, History, Upload, Eye } from 'lucide-react';
import { EmpresaData, useEmpresaData } from '@/hooks/useEmpresaData';
import { useEmpresaAudit } from '@/hooks/useEmpresaAudit';
import { FileUploadModal } from './FileUploadModal';
import { useEmpresaFiles } from '@/hooks/useEmpresaFiles';

interface EmpresaFormTabsProps {
  data: EmpresaData;
  onChange: (updates: Partial<EmpresaData>) => void;
  disabled: boolean;
}

export const EmpresaFormTabs = ({ data, onChange, disabled }: EmpresaFormTabsProps) => {
  const { fetchCEP } = useEmpresaData();
  const { auditLogs, loading: auditLoading, formatAuditEntry } = useEmpresaAudit();
  const { getFileUrl } = useEmpresaFiles();
  const [uploadModal, setUploadModal] = useState<{
    open: boolean;
    type: 'image' | 'document';
    fileName: string;
    title: string;
    field: keyof EmpresaData;
  }>({
    open: false,
    type: 'image',
    fileName: '',
    title: '',
    field: 'logo_url',
  });

  const handleInputChange = (field: keyof EmpresaData, value: string | number) => {
    onChange({ [field]: value });
  };

  const handleCEPChange = async (cep: string) => {
    handleInputChange('cep', cep);
    
    if (cep.replace(/\D/g, '').length === 8) {
      const endereco = await fetchCEP(cep);
      if (endereco) {
        onChange(endereco);
      }
    }
  };

  const openUploadModal = (type: 'image' | 'document', fileName: string, title: string, field: keyof EmpresaData) => {
    setUploadModal({ open: true, type, fileName, title, field });
  };

  const handleFileUpload = (url: string) => {
    onChange({ [uploadModal.field]: url });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="dados-gerais" className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:w-fit">
          <TabsTrigger value="dados-gerais" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Dados Gerais</span>
          </TabsTrigger>
          <TabsTrigger value="endereco" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Endereço</span>
          </TabsTrigger>
          <TabsTrigger value="contato" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Contato</span>
          </TabsTrigger>
          <TabsTrigger value="fiscais" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Fiscais</span>
          </TabsTrigger>
          <TabsTrigger value="arquivos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Arquivos</span>
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Auditoria</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dados-gerais" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="razao-social">Razão Social *</Label>
                  <Input
                    id="razao-social"
                    value={data.razao_social || ''}
                    onChange={(e) => handleInputChange('razao_social', e.target.value)}
                    disabled={disabled}
                    placeholder="Razão social da empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome-fantasia">Nome Fantasia *</Label>
                  <Input
                    id="nome-fantasia"
                    value={data.nome_fantasia || ''}
                    onChange={(e) => handleInputChange('nome_fantasia', e.target.value)}
                    disabled={disabled}
                    placeholder="Nome fantasia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    value={data.cnpj || ''}
                    onChange={(e) => handleInputChange('cnpj', e.target.value)}
                    disabled={disabled}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regime-tributario">Regime Tributário</Label>
                  <Select
                    value={data.regime_tributario || ''}
                    onValueChange={(value) => handleInputChange('regime_tributario', value)}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o regime" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simples">Simples Nacional</SelectItem>
                      <SelectItem value="mei">MEI</SelectItem>
                      <SelectItem value="presumido">Lucro Presumido</SelectItem>
                      <SelectItem value="real">Lucro Real</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inscricao-estadual">Inscrição Estadual</Label>
                  <Input
                    id="inscricao-estadual"
                    value={data.inscricao_estadual || ''}
                    onChange={(e) => handleInputChange('inscricao_estadual', e.target.value)}
                    disabled={disabled}
                    placeholder="IE ou 'Isento'"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inscricao-municipal">Inscrição Municipal</Label>
                  <Input
                    id="inscricao-municipal"
                    value={data.inscricao_municipal || ''}
                    onChange={(e) => handleInputChange('inscricao_municipal', e.target.value)}
                    disabled={disabled}
                    placeholder="Inscrição Municipal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnae-principal">CNAE Principal</Label>
                  <Input
                    id="cnae-principal"
                    value={data.cnae_principal || ''}
                    onChange={(e) => handleInputChange('cnae_principal', e.target.value)}
                    disabled={disabled}
                    placeholder="0000000"
                    maxLength={7}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data-fundacao">Data de Fundação</Label>
                  <Input
                    id="data-fundacao"
                    type="date"
                    value={data.data_fundacao || ''}
                    onChange={(e) => handleInputChange('data_fundacao', e.target.value)}
                    disabled={disabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endereco" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Endereço da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={data.cep || ''}
                    onChange={(e) => handleCEPChange(e.target.value)}
                    disabled={disabled}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    value={data.logradouro || ''}
                    onChange={(e) => handleInputChange('logradouro', e.target.value)}
                    disabled={disabled}
                    placeholder="Rua, Avenida, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={data.numero || ''}
                    onChange={(e) => handleInputChange('numero', e.target.value)}
                    disabled={disabled}
                    placeholder="123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={data.complemento || ''}
                    onChange={(e) => handleInputChange('complemento', e.target.value)}
                    disabled={disabled}
                    placeholder="Sala, Andar, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={data.bairro || ''}
                    onChange={(e) => handleInputChange('bairro', e.target.value)}
                    disabled={disabled}
                    placeholder="Nome do bairro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="municipio">Município</Label>
                  <Input
                    id="municipio"
                    value={data.municipio || ''}
                    onChange={(e) => handleInputChange('municipio', e.target.value)}
                    disabled={disabled}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uf">UF</Label>
                  <Input
                    id="uf"
                    value={data.uf || ''}
                    onChange={(e) => handleInputChange('uf', e.target.value)}
                    disabled={disabled}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pais">País</Label>
                  <Input
                    id="pais"
                    value={data.pais || 'Brasil'}
                    onChange={(e) => handleInputChange('pais', e.target.value)}
                    disabled={disabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contato" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone-principal">Telefone Principal</Label>
                  <Input
                    id="telefone-principal"
                    value={data.telefone_principal || ''}
                    onChange={(e) => handleInputChange('telefone_principal', e.target.value)}
                    disabled={disabled}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone-secundario">Telefone Secundário</Label>
                  <Input
                    id="telefone-secundario"
                    value={data.telefone_secundario || ''}
                    onChange={(e) => handleInputChange('telefone_secundario', e.target.value)}
                    disabled={disabled}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-fiscal">E-mail Fiscal *</Label>
                  <Input
                    id="email-fiscal"
                    type="email"
                    value={data.email_fiscal || ''}
                    onChange={(e) => handleInputChange('email_fiscal', e.target.value)}
                    disabled={disabled}
                    placeholder="fiscal@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-comercial">E-mail Comercial</Label>
                  <Input
                    id="email-comercial"
                    type="email"
                    value={data.email_comercial || ''}
                    onChange={(e) => handleInputChange('email_comercial', e.target.value)}
                    disabled={disabled}
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site">Site</Label>
                  <Input
                    id="site"
                    type="url"
                    value={data.site || ''}
                    onChange={(e) => handleInputChange('site', e.target.value)}
                    disabled={disabled}
                    placeholder="https://www.empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={data.instagram || ''}
                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                    disabled={disabled}
                    placeholder="@empresa"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={data.facebook || ''}
                    onChange={(e) => handleInputChange('facebook', e.target.value)}
                    disabled={disabled}
                    placeholder="facebook.com/empresa"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiscais" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Fiscais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serie-nfe">Série NF-e/NFC-e</Label>
                  <Input
                    id="serie-nfe"
                    type="number"
                    value={data.serie_nfe || ''}
                    onChange={(e) => handleInputChange('serie_nfe', e.target.value)}
                    disabled={disabled}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ambiente-fiscal">Ambiente Fiscal</Label>
                  <Select
                    value={data.ambiente_fiscal || 'Homologação'}
                    onValueChange={(value) => handleInputChange('ambiente_fiscal', value)}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Homologação">Homologação</SelectItem>
                      <SelectItem value="Produção">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="natureza-operacao">Natureza de Operação Padrão</Label>
                  <Input
                    id="natureza-operacao"
                    value={data.natureza_operacao || ''}
                    onChange={(e) => handleInputChange('natureza_operacao', e.target.value)}
                    disabled={disabled}
                    placeholder="Venda de produtos"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo-regime-tributario">Código Regime Tributário</Label>
                  <Input
                    id="codigo-regime-tributario"
                    value={data.codigo_regime_tributario || ''}
                    onChange={(e) => handleInputChange('codigo_regime_tributario', e.target.value)}
                    disabled={disabled}
                    placeholder="1, 2, 3..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aliquota-iss">Alíquota ISS (%)</Label>
                  <Input
                    id="aliquota-iss"
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={data.aliquota_iss || ''}
                    onChange={(e) => handleInputChange('aliquota_iss', parseFloat(e.target.value))}
                    disabled={disabled}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="municipio-iss">Município ISS (Código IBGE)</Label>
                  <Input
                    id="municipio-iss"
                    value={data.municipio_iss || ''}
                    onChange={(e) => handleInputChange('municipio_iss', e.target.value)}
                    disabled={disabled}
                    placeholder="3550308"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="csc-token">CSC/Token NFC-e</Label>
                  <Input
                    id="csc-token"
                    type="password"
                    value={data.csc_token || ''}
                    onChange={(e) => handleInputChange('csc_token', e.target.value)}
                    disabled={disabled}
                    placeholder="Token CSC (campo seguro)"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="responsavel-tecnico">Responsável Técnico</Label>
                  <Textarea
                    id="responsavel-tecnico"
                    value={data.responsavel_tecnico || ''}
                    onChange={(e) => handleInputChange('responsavel_tecnico', e.target.value)}
                    disabled={disabled}
                    placeholder="Nome e contato do responsável técnico"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arquivos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logo & Arquivos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo da Empresa */}
              <div className="space-y-3">
                <Label>Logo da Empresa</Label>
                {data.logo_url && (
                  <div className="flex items-center gap-4">
                    <img
                      src={getFileUrl(data.logo_url)}
                      alt="Logo da empresa"
                      className="h-16 w-16 object-contain rounded border"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getFileUrl(data.logo_url), '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                      {!disabled && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openUploadModal('image', 'logo', 'Upload do Logo', 'logo_url')}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Alterar
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {!data.logo_url && !disabled && (
                  <Button
                    variant="outline"
                    onClick={() => openUploadModal('image', 'logo', 'Upload do Logo', 'logo_url')}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Fazer upload do logo
                  </Button>
                )}
              </div>

              {/* Certificado Digital */}
              <div className="space-y-3">
                <Label>Certificado Digital A1</Label>
                {data.certificado_url ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Certificado carregado</Badge>
                    {!disabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openUploadModal('document', 'certificado', 'Upload do Certificado', 'certificado_url')}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Alterar certificado
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Nenhum certificado carregado
                    </p>
                    {!disabled && (
                      <Button
                        variant="outline"
                        onClick={() => openUploadModal('document', 'certificado', 'Upload do Certificado', 'certificado_url')}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Fazer upload do certificado
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Política de Privacidade */}
              <div className="space-y-3">
                <Label>Política de Privacidade / Termos de Uso</Label>
                {data.politica_privacidade_url ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Documento carregado</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(getFileUrl(data.politica_privacidade_url!), '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                    {!disabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openUploadModal('document', 'politica', 'Upload da Política', 'politica_privacidade_url')}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Alterar
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Nenhum documento carregado
                    </p>
                    {!disabled && (
                      <Button
                        variant="outline"
                        onClick={() => openUploadModal('document', 'politica', 'Upload da Política', 'politica_privacidade_url')}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Fazer upload do documento
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auditoria" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Alterações</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Carregando histórico...</p>
                </div>
              ) : auditLogs.length > 0 ? (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="border-l-2 border-primary pl-4 py-2">
                      <p className="text-sm">{formatAuditEntry(log)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma alteração registrada ainda
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <FileUploadModal
        open={uploadModal.open}
        onOpenChange={(open) => setUploadModal(prev => ({ ...prev, open }))}
        onSuccess={handleFileUpload}
        fileType={uploadModal.type}
        fileName={uploadModal.fileName}
        title={uploadModal.title}
      />
    </div>
  );
};