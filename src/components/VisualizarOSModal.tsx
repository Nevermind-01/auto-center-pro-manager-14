import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOSDetails } from "@/hooks/useOSDetails";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePrintGenerator } from "@/hooks/usePrintGenerator";
import { PrintModal } from "@/components/print/PrintModal";
import { useState } from "react";
import { 
  User, 
  Car, 
  CreditCard, 
  Package, 
  Wrench, 
  FileText, 
  Calendar,
  MapPin,
  Phone,
  Hash,
  X
} from "lucide-react";

interface VisualizarOSModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  osId: string | null;
}

const getStatusBadge = (status: string) => {
  const statusConfig = {
    pendente: { variant: 'secondary' as const, label: 'Pendente' },
    finalizada: { variant: 'default' as const, label: 'Finalizada' },
    cancelada: { variant: 'destructive' as const, label: 'Cancelada' }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || 
    { variant: 'outline' as const, label: status };
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
};

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return dateString;
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const VisualizarOSModal = ({ open, onOpenChange, osId }: VisualizarOSModalProps) => {
  const { data: osDetails, isLoading } = useOSDetails(osId);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const handlePrint = () => {
    if (!osDetails) return;
    setShowPrintModal(true);
  };

  // Determinar o tipo de impressão baseado no status
  const printType = osDetails?.status === 'finalizada' ? 'os_finalizada' : 'os';
  const printTitle = osDetails?.status === 'finalizada' 
    ? `Fatura de OS ${osDetails.numero_os}` 
    : `Ordem de Serviço ${osDetails.numero_os}`;

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Separator />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-24" />
    </div>
  );

  if (!open || !osId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {isLoading ? (
                <Skeleton className="h-6 w-48" />
              ) : (
                `Detalhes da OS ${osDetails?.numero_os}`
              )}
            </DialogTitle>
            {!isLoading && osDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Imprimir
              </Button>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <LoadingSkeleton />
        ) : osDetails ? (
          <div className="space-y-6">
            {/* Informações Gerais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Informações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Número da OS:</span>
                    <span>{osDetails.numero_os}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    {getStatusBadge(osDetails.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Criado em:</span>
                    <span>{formatDate(osDetails.created_at)}</span>
                  </div>
                  {osDetails.finalizado_em && osDetails.status === 'finalizada' && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Finalizada em:</span>
                      <span>{formatDate(osDetails.finalizado_em)}</span>
                    </div>
                  )}
                  {osDetails.creator && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Criado por:</span>
                      <span>{osDetails.creator.full_name || osDetails.creator.email}</span>
                    </div>
                  )}
                </div>
                {osDetails.observacoes && (
                  <div className="space-y-2">
                    <span className="font-medium">Observações:</span>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{osDetails.observacoes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cliente e Veículo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-medium">Nome:</span>
                    <p>{osDetails.cliente?.nome || osDetails.cliente_nome}</p>
                  </div>
                  {osDetails.cliente?.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{osDetails.cliente.telefone}</span>
                    </div>
                  )}
                  <div className="space-y-1">
                    {osDetails.cliente?.cpf && (
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        <span>CPF: {osDetails.cliente.cpf}</span>
                      </div>
                    )}
                    {osDetails.cliente?.cnpj && (
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        <span>CNPJ: {osDetails.cliente.cnpj}</span>
                      </div>
                    )}
                    {osDetails.cliente?.rg && (
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        <span>RG: {osDetails.cliente.rg}</span>
                      </div>
                    )}
                  </div>
                  {(osDetails.cliente?.rua || osDetails.cliente?.cidade) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1" />
                      <div>
                        <p className="text-sm">
                          {[
                            osDetails.cliente.rua,
                            osDetails.cliente.numero_residencia,
                            osDetails.cliente.bairro,
                            osDetails.cliente.cidade,
                            osDetails.cliente.estado
                          ].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Veículo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Veículo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {osDetails.veiculo ? (
                    <>
                      <div>
                        <span className="font-medium">Marca e Modelo:</span>
                        <p>{osDetails.veiculo.marca} {osDetails.veiculo.modelo}</p>
                      </div>
                      <div>
                        <span className="font-medium">Placa:</span>
                        <p>{osDetails.veiculo.placa}</p>
                      </div>
                      {osDetails.veiculo.ano && (
                        <div>
                          <span className="font-medium">Ano:</span>
                          <p>{osDetails.veiculo.ano}</p>
                        </div>
                      )}
                      {osDetails.veiculo.observacoes && (
                        <div>
                          <span className="font-medium">Observações:</span>
                          <p className="text-sm bg-muted p-2 rounded">{osDetails.veiculo.observacoes}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Nenhum veículo cadastrado</p>
                  )}
                </CardContent>
              </Card>

              {/* Mecânico */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Mecânico Responsável
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {osDetails.mecanico ? (
                    <>
                      <div>
                        <span className="font-medium">Nome:</span>
                        <p>{osDetails.mecanico.nome}</p>
                      </div>
                      {osDetails.mecanico.especialidade && (
                        <div>
                          <span className="font-medium">Especialidade:</span>
                          <p>{osDetails.mecanico.especialidade}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Nenhum mecânico responsável</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <span className="font-medium">Forma de Pagamento:</span>
                  <p className="capitalize">{osDetails.forma_pagamento}</p>
                </div>
                <div>
                  <span className="font-medium">Parcelas:</span>
                  <p>{osDetails.parcelas}x</p>
                </div>
                <div>
                  <span className="font-medium">Valor Total:</span>
                  <p>{formatCurrency(osDetails.valor_total)}</p>
                </div>
                <div>
                  <span className="font-medium">Desconto:</span>
                  <p>{formatCurrency(osDetails.valor_desconto)}</p>
                </div>
                <div>
                  <span className="font-medium">Valor Final:</span>
                  <p className="font-bold text-lg">{formatCurrency(osDetails.valor_final)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Produtos */}
            {osDetails.venda_produtos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Produtos ({osDetails.venda_produtos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Produto</TableHead>
                        <TableHead className="text-center">Quantidade</TableHead>
                        <TableHead className="text-right">Preço Unitário</TableHead>
                        <TableHead className="text-right">Preço Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {osDetails.venda_produtos.map((produto) => (
                        <TableRow key={produto.id}>
                          <TableCell className="font-medium">{produto.produto_nome}</TableCell>
                          <TableCell className="text-center">{produto.quantidade}</TableCell>
                          <TableCell className="text-right">{formatCurrency(produto.preco_unitario)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(produto.preco_total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Serviços */}
            {osDetails.venda_servicos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Serviços ({osDetails.venda_servicos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Serviço</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {osDetails.venda_servicos.map((servico) => (
                        <TableRow key={servico.id}>
                          <TableCell className="font-medium">{servico.servico_nome}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(servico.preco)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Botão Fechar */}
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-2" />
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Dados da OS não encontrados.</p>
          </div>
        )}

        {/* Print Modal */}
        <PrintModal
          open={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          type={printType}
          data={osDetails}
          title={printTitle}
        />
      </DialogContent>
    </Dialog>
  );
};