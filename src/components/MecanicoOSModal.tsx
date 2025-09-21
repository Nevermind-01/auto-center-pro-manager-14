import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, CheckCircle, XCircle, Coins } from "lucide-react";
import { useOSByMecanico } from "@/hooks/useOSByMecanico";
import { VisualizarOSModal } from "@/components/VisualizarOSModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Mecanico {
  id: string;
  nome: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mecanico: Mecanico | null;
}

const currency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'finalizada':
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Finalizada</Badge>;
    case 'pendente':
      return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Pendente</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function MecanicoOSModal({ open, onOpenChange, mecanico }: Props) {
  const [range, setRange] = useState<DateRange | undefined>();
  const [appliedRange, setAppliedRange] = useState<DateRange | undefined>();
  const [osModalOpen, setOsModalOpen] = useState(false);
  const [selectedOsId, setSelectedOsId] = useState<string | null>(null);

  const { data: osData = [], isLoading } = useOSByMecanico({
    mecanicoId: mecanico?.id || null,
    startDate: appliedRange?.from || null,
    endDate: appliedRange?.to || null,
  });

  const applyFilter = () => setAppliedRange(range);

  const openOS = (id: string) => {
    setSelectedOsId(id);
    setOsModalOpen(true);
  };

  if (!mecanico) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ordens de Serviço - {mecanico.nome}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-3">
            <DateRangePicker value={range} onChange={setRange} />
            <Button variant="outline" onClick={applyFilter}>Aplicar filtro</Button>
          </div>

          <div className="mt-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Carregando ordens de serviço...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número OS</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor Final</TableHead>
                    <TableHead className="text-center">Comissão</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {osData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nenhuma ordem de serviço encontrada para o período.
                      </TableCell>
                    </TableRow>
                  ) : (
                    osData.map((os) => (
                      <TableRow key={os.id}>
                        <TableCell className="font-medium">{os.numero_os}</TableCell>
                        <TableCell>
                          {format(new Date(os.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{os.cliente_nome}</TableCell>
                        <TableCell>{getStatusBadge(os.status)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {currency(os.valor_final)}
                        </TableCell>
                        <TableCell className="text-center">
                          {os.tem_comissao ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    <Coins className="h-3 w-3 mr-1" />
                                    Sim
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>Esta OS possui comissão</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              Não
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openOS(os.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver detalhes da OS</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <VisualizarOSModal 
        open={osModalOpen} 
        onOpenChange={setOsModalOpen} 
        osId={selectedOsId} 
      />
    </>
  );
}