import { useState } from 'react';
import { useEmpresaData } from './useEmpresaData';
import { toast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const usePrintGenerator = () => {
  const [loading, setLoading] = useState(false);
  const { fetchEmpresaData } = useEmpresaData();

  const convertImageToBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Erro ao converter imagem para base64:', error);
      return '';
    }
  };

  const prepareElementForPrint = async (element: HTMLElement): Promise<void> => {
    // Converter imagens externas para base64
    const images = element.querySelectorAll('img[src^="http"]');
    for (const img of Array.from(images)) {
      const imgElement = img as HTMLImageElement;
      if (imgElement.src.includes('supabase')) {
        try {
          const base64 = await convertImageToBase64(imgElement.src);
          if (base64) {
            imgElement.src = base64;
          }
        } catch (error) {
          console.warn('Falha ao converter imagem, usando placeholder:', error);
          // Adicionar classe para ignorar na impressão se necessário
          imgElement.style.display = 'none';
        }
      }
    }
  };

  const generateCanvasWithTimeout = async (element: HTMLElement, timeoutMs: number = 15000) => {
    const canvasPromise = html2canvas(element, {
      scale: 2,
      useCORS: false, // Desabilitar CORS para evitar conflitos
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
      logging: false, // Desabilitar logs
      removeContainer: true,
      imageTimeout: 5000, // Timeout para carregar imagens
      ignoreElements: (element: Element) => {
        // Ignorar elementos que podem causar problemas
        return element.classList?.contains('ignore-print') || false;
      }
    });

    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout na geração do canvas')), timeoutMs)
    );

    return Promise.race([canvasPromise, timeoutPromise]);
  };

  const generatePDFFromElement = async (element: HTMLElement, filename: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Configurar o elemento para impressão
      const originalDisplay = element.style.display;
      element.style.display = 'block';
      
      // Preparar elemento (converter imagens)
      await prepareElementForPrint(element);
      
      // Gerar canvas com timeout
      const canvas = await generateCanvasWithTimeout(element);

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
      
      // Tentar gerar PDF simples sem imagens em caso de erro
      try {
        console.log('Tentando gerar PDF sem imagens...');
        
        // Esconder todas as imagens temporariamente
        const images = element.querySelectorAll('img');
        const originalDisplays: string[] = [];
        images.forEach((img, index) => {
          originalDisplays[index] = img.style.display;
          img.style.display = 'none';
        });
        
        // Tentar novamente sem imagens
        const canvas = await generateCanvasWithTimeout(element, 10000);
        
        // Restaurar imagens
        images.forEach((img, index) => {
          img.style.display = originalDisplays[index];
        });
        
        // Criar PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(filename);
        
        toast({
          title: "PDF gerado com sucesso!",
          description: `O arquivo ${filename} foi baixado (sem imagens).`,
        });
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
        
        let errorMessage = "Não foi possível gerar o documento PDF.";
        if (error instanceof Error) {
          if (error.message.includes('Timeout')) {
            errorMessage = "Tempo limite excedido. Tente novamente com um documento menor.";
          } else if (error.message.includes('CORS')) {
            errorMessage = "Problema com imagens. Tente gerar sem logo da empresa.";
          }
        }
        
        toast({
          title: "Erro ao gerar PDF",
          description: errorMessage,
          variant: "destructive"
        });
      }
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