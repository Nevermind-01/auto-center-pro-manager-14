import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Download, FileText } from "lucide-react";
import { useComissoesByMecanico } from "@/hooks/useComissoes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { VisualizarOSModal } from "@/components/VisualizarOSModal";

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

export function MecanicoComissoesModal({ open, onOpenChange, mecanico }: Props) {
  const [range, setRange] = useState<DateRange | undefined>();
  const [appliedRange, setAppliedRange] = useState<DateRange | undefined>();
  const [osModalOpen, setOsModalOpen] = useState(false);
  const [selectedOsId, setSelectedOsId] = useState<string | null>(null);

  const { data } = useComissoesByMecanico({
    mecanicoId: mecanico?.id || null,
    startDate: appliedRange?.from || null,
    endDate: appliedRange?.to || null,
  });

  const rows = data?.rows || [];
  const total = data?.total || 0;

  const applyFilter = () => setAppliedRange(range);

  const exportCSV = () => {
    const headers = [
      'Data da finalização',
      'Número OS',
      'Base de cálculo',
      'Tipo',
      'Percentual',
      'Valor fixo',
      'Valor final',
    ];
    const lines = rows.map((r) => [
      r.finalizado_em ? format(new Date(r.finalizado_em), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '',
      (r as any).vendas?.numero_os ?? '',
      String(r.base_calculo ?? 0).replace('.', ','),
      r.tipo_calculo,
      r.percentual != null ? String(r.percentual).replace('.', ',') : '',
      r.valor_fixo != null ? String(r.valor_fixo).replace('.', ',') : '',
      String(r.valor_final ?? 0).replace('.', ','),
    ]);

    // Adicionar linha de total
    const totalLine = [
      '',
      '',
      '',
      '',
      '',
      'TOTAL',
      String(total).replace('.', ','),
    ];

    const csv = [headers, ...lines, totalLine].map((arr) => arr.map((s) => `"${String(s).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Nome do arquivo com período se aplicado
    const fileName = appliedRange?.from && appliedRange?.to
      ? `comissoes_${mecanico?.nome || 'mecanico'}_${format(appliedRange.from, 'dd-MM-yyyy')}_a_${format(appliedRange.to, 'dd-MM-yyyy')}.csv`
      : `comissoes_${mecanico?.nome || 'mecanico'}.csv`;
    
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openOS = (id: string) => {
    setSelectedOsId(id);
    setOsModalOpen(true);
  };

  if (!mecanico) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comissões de {mecanico.nome}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-3">
            <DateRangePicker value={range} onChange={setRange} />
            <Button variant="outline" onClick={applyFilter}>Aplicar filtro</Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" onClick={exportCSV} className="ml-auto">
                    <Download className="h-4 w-4 mr-2" /> Exportar CSV
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exporta os dados filtrados</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead className="text-right">Base de cálculo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Percentual</TableHead>
                  <TableHead className="text-right">Valor fixo</TableHead>
                  <TableHead className="text-right">Valor final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhuma comissão encontrada para o período.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.finalizado_em ? format(new Date(r.finalizado_em), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}</TableCell>
                      <TableCell>
                        { (r as any).vendas?.numero_os ? (
                          <Button variant="link" className="p-0" onClick={() => openOS(r.venda_id)}>
                            <FileText className="h-4 w-4 mr-1" /> {(r as any).vendas?.numero_os}
                          </Button>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">{currency(Number(r.base_calculo || 0))}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{r.tipo_calculo}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{r.percentual != null ? `${Number(r.percentual)}%` : '-'}</TableCell>
                      <TableCell className="text-right">{r.valor_fixo != null ? currency(Number(r.valor_fixo)) : '-'}</TableCell>
                      <TableCell className="text-right font-medium">{currency(Number(r.valor_final || 0))}</TableCell>
                    </TableRow>
                  ))
                )}
                {rows.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-right font-semibold">Total</TableCell>
                    <TableCell className="text-right font-bold">{currency(total)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <VisualizarOSModal open={osModalOpen} onOpenChange={setOsModalOpen} osId={selectedOsId} />
    </>
  );
}
