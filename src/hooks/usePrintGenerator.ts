import { useState } from 'react';
import { useEmpresaData } from './useEmpresaData';
import { toast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const usePrintGenerator = () => {
  const [loading, setLoading] = useState(false);
  const { fetchEmpresaData } = useEmpresaData();

  const generatePDFFromElement = async (element: HTMLElement, filename: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Configurar o elemento para impressão
      const originalDisplay = element.style.display;
      element.style.display = 'block';
      
      // Gerar canvas da página
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      // Restaurar display original
      element.style.display = originalDisplay;

      // Criar PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Adicionar primeira página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Adicionar páginas adicionais se necessário
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Salvar PDF
      pdf.save(filename);
      
      toast({
        title: "PDF gerado com sucesso!",
        description: `O arquivo ${filename} foi baixado.`,
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o documento PDF.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const printElement = (element: HTMLElement): void => {
    try {
      // Criar nova janela para impressão
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Erro na impressão",
          description: "Não foi possível abrir a janela de impressão. Verifique se o popup não foi bloqueado.",
          variant: "destructive"
        });
        return;
      }

      // Copiar estilos da página atual
      const styles = Array.from(document.styleSheets)
        .map(styleSheet => {
          try {
            return Array.from(styleSheet.cssRules)
              .map(rule => rule.cssText)
              .join('');
          } catch (e) {
            return '';
          }
        })
        .join('');

      // Estilos específicos para impressão
      const printStyles = `
        <style>
          @import url('${window.location.origin}/src/components/print/print.css');
          ${styles}
          @media print {
            body { margin: 0; padding: 0; }
            .print-container { margin: 0; padding: 20mm; }
          }
        </style>
      `;

      // Montar HTML da janela de impressão
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Impressão</title>
            <meta charset="utf-8">
            ${printStyles}
          </head>
          <body>
            ${element.outerHTML}
          </body>
        </html>
      `);

      printWindow.document.close();

      // Aguardar carregamento e imprimir
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
    } catch (error) {
      console.error('Erro na impressão:', error);
      toast({
        title: "Erro na impressão",
        description: "Não foi possível imprimir o documento.",
        variant: "destructive"
      });
    }
  };

  const openPrintPreview = (element: HTMLElement): void => {
    try {
      // Criar nova janela para preview
      const previewWindow = window.open('', '_blank', 'width=800,height=600');
      if (!previewWindow) {
        toast({
          title: "Erro no preview",
          description: "Não foi possível abrir a janela de preview. Verifique se o popup não foi bloqueado.",
          variant: "destructive"
        });
        return;
      }

      // Copiar estilos
      const styles = Array.from(document.styleSheets)
        .map(styleSheet => {
          try {
            return Array.from(styleSheet.cssRules)
              .map(rule => rule.cssText)  
              .join('');
          } catch (e) {
            return '';
          }
        })
        .join('');

      // Montar HTML do preview
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Preview de Impressão</title>
            <meta charset="utf-8">
            <style>
              ${styles}
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f5f5f5;
              }
              .preview-container {
                max-width: 21cm;
                margin: 0 auto;
                background: white;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
              }
              .preview-actions {
                text-align: center;
                margin-bottom: 20px;
              }
              .preview-btn {
                background: #2563eb;
                color: white;
                border: none;
                padding: 10px 20px;
                margin: 0 10px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
              }
              .preview-btn:hover {
                background: #1d4ed8;
              }
              .preview-btn.secondary {
                background: #6b7280;
              }
              .preview-btn.secondary:hover {
                background: #4b5563;
              }
            </style>
          </head>
          <body>
            <div class="preview-actions">
              <button class="preview-btn" onclick="window.print()">🖨️ Imprimir</button>
              <button class="preview-btn secondary" onclick="window.close()">❌ Fechar</button>
            </div>
            <div class="preview-container">
              ${element.outerHTML}
            </div>
          </body>
        </html>
      `);

      previewWindow.document.close();
    } catch (error) {
      console.error('Erro no preview:', error);
      toast({
        title: "Erro no preview",
        description: "Não foi possível abrir o preview do documento.",
        variant: "destructive"
      });
    }
  };

  return {
    loading,
    generatePDFFromElement,
    printElement,
    openPrintPreview,
    fetchEmpresaData,
  };
};