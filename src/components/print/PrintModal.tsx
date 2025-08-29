import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, Printer, Eye } from 'lucide-react';
import { usePrintGenerator } from '@/hooks/usePrintGenerator';
import { useEmpresaData } from '@/hooks/useEmpresaData';
import { OrcamentoPrint } from './OrcamentoPrint';
import { OSPrint } from './OSPrint';
import { OSFinalizadaPrint } from './OSFinalizadaPrint';

interface PrintModalProps {
  open: boolean;
  onClose: () => void;
  type: 'orcamento' | 'os' | 'os_finalizada';
  data: any;
  title: string;
}

export function PrintModal({ open, onClose, type, data, title }: PrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { loading, generatePDFFromElement, printElement, openPrintPreview } = usePrintGenerator();
  const { fetchEmpresaData } = useEmpresaData();
  const [empresa, setEmpresa] = useState<any>(null);

  useEffect(() => {
    const loadEmpresa = async () => {
      if (open) {
        const empresaData = await fetchEmpresaData();
        setEmpresa(empresaData);
      }
    };
    loadEmpresa();
  }, [open, fetchEmpresaData]);

  const handlePrint = () => {
    if (printRef.current) {
      printElement(printRef.current);
    }
  };

  const handlePDF = async () => {
    if (printRef.current && data) {
      const filename = `${type}-${data.numero_orcamento || data.numero_os || 'documento'}-${new Date().toISOString().split('T')[0]}.pdf`;
      await generatePDFFromElement(printRef.current, filename);
    }
  };

  const handlePreview = () => {
    if (printRef.current) {
      openPrintPreview(printRef.current);
    }
  };

  const renderPrintComponent = () => {
    if (!empresa || !data) return null;

    switch (type) {
      case 'orcamento':
        return <OrcamentoPrint orcamento={data} empresa={empresa} />;
      case 'os':
        return <OSPrint os={data} empresa={empresa} />;
      case 'os_finalizada':
        return <OSFinalizadaPrint os={data} empresa={empresa} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={!data || !empresa}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={!data || !empresa}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handlePDF}
                disabled={loading || !data || !empresa}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {loading ? 'Gerando PDF...' : 'Gerar PDF'}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Preview Area */}
          <div className="flex-1 overflow-auto p-4 bg-gray-100">
            <div className="mx-auto bg-white shadow-lg" style={{ width: '21cm', minHeight: '29.7cm' }}>
              <div ref={printRef} className="w-full">
                {!data ? (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <p>Carregando dados para impressão...</p>
                  </div>
                ) : !empresa ? (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <p>Carregando dados da empresa...</p>
                  </div>
                ) : (
                  renderPrintComponent()
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}