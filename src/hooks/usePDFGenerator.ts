import { useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrcamentoPDFData {
  numero_orcamento: string;
  cliente_nome: string;
  cliente_telefone?: string;
  cliente_email?: string;
  veiculo_marca?: string;
  veiculo_modelo?: string;
  veiculo_placa?: string;
  mecanico_nome?: string;
  created_at: string;
  validade: string;
  valor_total: number;
  valor_desconto?: number;
  valor_final: number;
  observacoes?: string;
  produtos: Array<{
    produto_nome: string;
    quantidade: number;
    preco_unitario: number;
    preco_total: number;
  }>;
  servicos: Array<{
    servico_nome: string;
    preco: number;
  }>;
}

interface OSPDFData {
  numero_os: string;
  cliente_nome: string;
  cliente_telefone?: string;
  cliente_email?: string;
  veiculo_marca?: string;
  veiculo_modelo?: string;
  veiculo_placa?: string;
  mecanico_nome?: string;
  created_at: string;
  finalizado_em?: string;
  status: string;
  forma_pagamento: string;
  parcelas?: number;
  valor_total: number;
  valor_desconto?: number;
  valor_final: number;
  observacoes?: string;
  produtos: Array<{
    produto_nome: string;
    quantidade: number;
    preco_unitario: number;
    preco_total: number;
  }>;
  servicos: Array<{
    servico_nome: string;
    preco: number;
  }>;
}

export const usePDFGenerator = () => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const generateOrcamentoPDF = useCallback(async (data: OrcamentoPDFData) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = 20;
    
    // Título
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("ORÇAMENTO", pageWidth / 2, y, { align: "center" });
    y += 20;

    // Informações do Orçamento
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Número: ${data.numero_orcamento}`, 20, y);
    y += 8;
    pdf.text(`Data: ${formatDate(data.created_at)}`, 20, y);
    y += 8;
    pdf.text(`Validade: ${format(new Date(data.validade), "dd/MM/yyyy", { locale: ptBR })}`, 20, y);
    y += 15;

    // Dados do Cliente
    pdf.setFont("helvetica", "bold");
    pdf.text("DADOS DO CLIENTE", 20, y);
    y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.text(`Nome: ${data.cliente_nome}`, 20, y);
    y += 8;
    if (data.cliente_telefone) {
      pdf.text(`Telefone: ${data.cliente_telefone}`, 20, y);
      y += 8;
    }
    if (data.cliente_email) {
      pdf.text(`Email: ${data.cliente_email}`, 20, y);
      y += 8;
    }
    y += 10;

    // Dados do Veículo
    if (data.veiculo_marca || data.veiculo_modelo || data.veiculo_placa) {
      pdf.setFont("helvetica", "bold");
      pdf.text("DADOS DO VEÍCULO", 20, y);
      y += 8;
      pdf.setFont("helvetica", "normal");
      if (data.veiculo_marca && data.veiculo_modelo) {
        pdf.text(`Veículo: ${data.veiculo_marca} ${data.veiculo_modelo}`, 20, y);
        y += 8;
      }
      if (data.veiculo_placa) {
        pdf.text(`Placa: ${data.veiculo_placa}`, 20, y);
        y += 8;
      }
      y += 10;
    }

    // Mecânico
    if (data.mecanico_nome) {
      pdf.setFont("helvetica", "bold");
      pdf.text("RESPONSÁVEL", 20, y);
      y += 8;
      pdf.setFont("helvetica", "normal");
      pdf.text(`Mecânico: ${data.mecanico_nome}`, 20, y);
      y += 15;
    }

    // Produtos
    if (data.produtos.length > 0) {
      pdf.setFont("helvetica", "bold");
      pdf.text("PRODUTOS", 20, y);
      y += 8;
      pdf.setFont("helvetica", "normal");
      
      data.produtos.forEach(produto => {
        pdf.text(`• ${produto.produto_nome}`, 25, y);
        pdf.text(`Qtd: ${produto.quantidade}`, 120, y);
        pdf.text(`Unit: ${formatCurrency(produto.preco_unitario)}`, 140, y);
        pdf.text(`Total: ${formatCurrency(produto.preco_total)}`, 160, y);
        y += 8;
      });
      y += 10;
    }

    // Serviços
    if (data.servicos.length > 0) {
      pdf.setFont("helvetica", "bold");
      pdf.text("SERVIÇOS", 20, y);
      y += 8;
      pdf.setFont("helvetica", "normal");
      
      data.servicos.forEach(servico => {
        pdf.text(`• ${servico.servico_nome}`, 25, y);
        pdf.text(`${formatCurrency(servico.preco)}`, 160, y);
        y += 8;
      });
      y += 10;
    }

    // Valores
    pdf.setFont("helvetica", "bold");
    pdf.text("RESUMO FINANCEIRO", 20, y);
    y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.text(`Valor Total: ${formatCurrency(data.valor_total)}`, 20, y);
    y += 8;
    if (data.valor_desconto && data.valor_desconto > 0) {
      pdf.text(`Desconto: ${formatCurrency(data.valor_desconto)}`, 20, y);
      y += 8;
    }
    pdf.setFont("helvetica", "bold");
    pdf.text(`Valor Final: ${formatCurrency(data.valor_final)}`, 20, y);

    // Observações
    if (data.observacoes) {
      y += 15;
      pdf.setFont("helvetica", "bold");
      pdf.text("OBSERVAÇÕES", 20, y);
      y += 8;
      pdf.setFont("helvetica", "normal");
      const lines = pdf.splitTextToSize(data.observacoes, pageWidth - 40);
      pdf.text(lines, 20, y);
    }

    pdf.save(`orcamento-${data.numero_orcamento}.pdf`);
  }, []);

  const generateOSPDF = useCallback(async (data: OSPDFData) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = 20;
    
    // Título
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("ORDEM DE SERVIÇO", pageWidth / 2, y, { align: "center" });
    y += 20;

    // Informações da OS
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Número: ${data.numero_os}`, 20, y);
    y += 8;
    pdf.text(`Data: ${formatDate(data.created_at)}`, 20, y);
    y += 8;
    if (data.finalizado_em) {
      pdf.text(`Finalizada em: ${formatDate(data.finalizado_em)}`, 20, y);
      y += 8;
    }
    pdf.text(`Status: ${data.status.toUpperCase()}`, 20, y);
    y += 15;

    // Dados do Cliente
    pdf.setFont("helvetica", "bold");
    pdf.text("DADOS DO CLIENTE", 20, y);
    y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.text(`Nome: ${data.cliente_nome}`, 20, y);
    y += 8;
    if (data.cliente_telefone) {
      pdf.text(`Telefone: ${data.cliente_telefone}`, 20, y);
      y += 8;
    }
    if (data.cliente_email) {
      pdf.text(`Email: ${data.cliente_email}`, 20, y);
      y += 8;
    }
    y += 10;

    // Dados do Veículo
    if (data.veiculo_marca || data.veiculo_modelo || data.veiculo_placa) {
      pdf.setFont("helvetica", "bold");
      pdf.text("DADOS DO VEÍCULO", 20, y);
      y += 8;
      pdf.setFont("helvetica", "normal");
      if (data.veiculo_marca && data.veiculo_modelo) {
        pdf.text(`Veículo: ${data.veiculo_marca} ${data.veiculo_modelo}`, 20, y);
        y += 8;
      }
      if (data.veiculo_placa) {
        pdf.text(`Placa: ${data.veiculo_placa}`, 20, y);
        y += 8;
      }
      y += 10;
    }

    // Mecânico
    if (data.mecanico_nome) {
      pdf.setFont("helvetica", "bold");
      pdf.text("RESPONSÁVEL", 20, y);
      y += 8;
      pdf.setFont("helvetica", "normal");
      pdf.text(`Mecânico: ${data.mecanico_nome}`, 20, y);
      y += 15;
    }

    // Produtos
    if (data.produtos.length > 0) {
      pdf.setFont("helvetica", "bold");
      pdf.text("PRODUTOS", 20, y);
      y += 8;
      pdf.setFont("helvetica", "normal");
      
      data.produtos.forEach(produto => {
        pdf.text(`• ${produto.produto_nome}`, 25, y);
        pdf.text(`Qtd: ${produto.quantidade}`, 120, y);
        pdf.text(`Unit: ${formatCurrency(produto.preco_unitario)}`, 140, y);
        pdf.text(`Total: ${formatCurrency(produto.preco_total)}`, 160, y);
        y += 8;
      });
      y += 10;
    }

    // Serviços
    if (data.servicos.length > 0) {
      pdf.setFont("helvetica", "bold");
      pdf.text("SERVIÇOS", 20, y);
      y += 8;
      pdf.setFont("helvetica", "normal");
      
      data.servicos.forEach(servico => {
        pdf.text(`• ${servico.servico_nome}`, 25, y);
        pdf.text(`${formatCurrency(servico.preco)}`, 160, y);
        y += 8;
      });
      y += 10;
    }

    // Pagamento
    pdf.setFont("helvetica", "bold");
    pdf.text("INFORMAÇÕES DE PAGAMENTO", 20, y);
    y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.text(`Forma de Pagamento: ${data.forma_pagamento}`, 20, y);
    y += 8;
    if (data.parcelas && data.parcelas > 1) {
      pdf.text(`Parcelas: ${data.parcelas}x`, 20, y);
      y += 8;
    }
    y += 10;

    // Valores
    pdf.setFont("helvetica", "bold");
    pdf.text("RESUMO FINANCEIRO", 20, y);
    y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.text(`Valor Total: ${formatCurrency(data.valor_total)}`, 20, y);
    y += 8;
    if (data.valor_desconto && data.valor_desconto > 0) {
      pdf.text(`Desconto: ${formatCurrency(data.valor_desconto)}`, 20, y);
      y += 8;
    }
    pdf.setFont("helvetica", "bold");
    pdf.text(`Valor Final: ${formatCurrency(data.valor_final)}`, 20, y);

    // Observações
    if (data.observacoes) {
      y += 15;
      pdf.setFont("helvetica", "bold");
      pdf.text("OBSERVAÇÕES", 20, y);
      y += 8;
      pdf.setFont("helvetica", "normal");
      const lines = pdf.splitTextToSize(data.observacoes, pageWidth - 40);
      pdf.text(lines, 20, y);
    }

    pdf.save(`os-${data.numero_os}.pdf`);
  }, []);

  return {
    generateOrcamentoPDF,
    generateOSPDF,
  };
};