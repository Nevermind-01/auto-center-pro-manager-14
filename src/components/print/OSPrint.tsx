import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PrintLayout } from './PrintLayout';
import { EmpresaData } from '@/hooks/useEmpresaData';
import { useDataMasking } from '@/hooks/useDataMasking';

interface OSPrintProps {
  os: {
    numero_os: string;
    cliente_nome: string;
    cliente?: {
      cpf?: string;
      cnpj?: string;
      telefone?: string;
      email?: string;
      endereco?: string;
    };
    veiculo?: {
      marca: string;
      modelo: string;
      ano?: string;
      placa: string;
    };
    mecanico?: {
      nome: string;
      especialidade?: string;
    };
    created_at: string;
    status: string;
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
  };
  empresa: EmpresaData;
}

export function OSPrint({ os, empresa }: OSPrintProps) {
  const { maskCPF, maskCNPJ, maskPhone, maskEmail } = useDataMasking();

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pendente': 'Pendente',
      'em_andamento': 'Em Andamento',
      'finalizada': 'Finalizada',
      'cancelada': 'Cancelada'
    };
    return statusMap[status] || status;
  };

  const subtotalProdutos = os.produtos.reduce((sum, p) => sum + p.preco_total, 0);
  const subtotalServicos = os.servicos.reduce((sum, s) => sum + s.preco, 0);

  return (
    <PrintLayout
      empresa={empresa}
      title="ORDEM DE SERVIÇO"
      documentNumber={`Nº ${os.numero_os}`}
      documentDate={`Criada em: ${format(new Date(os.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`}
    >
      {/* Status da OS */}
      <section className="print-section">
        <div className="bg-muted/20 p-3 rounded border text-center">
          <p className="text-lg font-semibold">
            <span className="text-muted-foreground">Status:</span> {getStatusText(os.status)}
          </p>
        </div>
      </section>

      {/* Dados do Cliente */}
      <section className="print-section">
        <h3 className="text-lg font-semibold mb-4 text-primary border-b border-border pb-2">
          Dados do Cliente
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="font-medium">Nome:</span> {os.cliente_nome}</p>
            {os.cliente?.cpf && (
              <p><span className="font-medium">CPF:</span> {maskCPF(os.cliente.cpf)}</p>
            )}
            {os.cliente?.cnpj && (
              <p><span className="font-medium">CNPJ:</span> {maskCNPJ(os.cliente.cnpj)}</p>
            )}
          </div>
          <div>
            {os.cliente?.telefone && (
              <p><span className="font-medium">Telefone:</span> {maskPhone(os.cliente.telefone)}</p>
            )}
            {os.cliente?.email && (
              <p><span className="font-medium">Email:</span> {maskEmail(os.cliente.email)}</p>
            )}
            {os.cliente?.endereco && (
              <p><span className="font-medium">Endereço:</span> {os.cliente.endereco}</p>
            )}
          </div>
        </div>
      </section>

      {/* Dados do Veículo */}
      {os.veiculo && (
        <section className="print-section">
          <h3 className="text-lg font-semibold mb-4 text-primary border-b border-border pb-2">
            Dados do Veículo
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <p><span className="font-medium">Marca/Modelo:</span> {os.veiculo.marca} {os.veiculo.modelo}</p>
            <p><span className="font-medium">Ano:</span> {os.veiculo.ano || 'N/A'}</p>
            <p><span className="font-medium">Placa:</span> {os.veiculo.placa}</p>
          </div>
        </section>
      )}

      {/* Mecânico Responsável */}
      {os.mecanico && (
        <section className="print-section">
          <h3 className="text-lg font-semibold mb-4 text-primary border-b border-border pb-2">
            Mecânico Responsável
          </h3>
          <div className="text-sm">
            <p><span className="font-medium">Nome:</span> {os.mecanico.nome}</p>
            {os.mecanico.especialidade && (
              <p><span className="font-medium">Especialidade:</span> {os.mecanico.especialidade}</p>
            )}
          </div>
        </section>
      )}

      {/* Serviços e Peças */}
      <section className="print-section">
        <h3 className="text-lg font-semibold mb-4 text-primary border-b border-border pb-2">
          Serviços e Peças
        </h3>
        
        <table className="w-full border-collapse border border-border text-sm">
          <thead>
            <tr className="bg-muted/30">
              <th className="border border-border p-2 text-left">Descrição</th>
              <th className="border border-border p-2 text-center w-20">Qtd.</th>
              <th className="border border-border p-2 text-right w-32">Valor Unit.</th>
              <th className="border border-border p-2 text-right w-32">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {os.produtos.map((produto, index) => (
              <tr key={`produto-${index}`}>
                <td className="border border-border p-2">{produto.produto_nome}</td>
                <td className="border border-border p-2 text-center">{produto.quantidade}</td>
                <td className="border border-border p-2 text-right">{formatCurrency(produto.preco_unitario)}</td>
                <td className="border border-border p-2 text-right">{formatCurrency(produto.preco_total)}</td>
              </tr>
            ))}
            {os.servicos.map((servico, index) => (
              <tr key={`servico-${index}`}>
                <td className="border border-border p-2">{servico.servico_nome}</td>
                <td className="border border-border p-2 text-center">1</td>
                <td className="border border-border p-2 text-right">{formatCurrency(servico.preco)}</td>
                <td className="border border-border p-2 text-right">{formatCurrency(servico.preco)}</td>
              </tr>
            ))}
            {os.produtos.length === 0 && os.servicos.length === 0 && (
              <tr>
                <td colSpan={4} className="border border-border p-4 text-center text-muted-foreground">
                  Nenhum item encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Resumo Financeiro */}
      <section className="print-section">
        <h3 className="text-lg font-semibold mb-4 text-primary border-b border-border pb-2">
          Resumo Financeiro
        </h3>
        <div className="space-y-2 text-sm max-w-md ml-auto">
          {subtotalProdutos > 0 && (
            <div className="flex justify-between">
              <span>Subtotal Peças:</span>
              <span>{formatCurrency(subtotalProdutos)}</span>
            </div>
          )}
          {subtotalServicos > 0 && (
            <div className="flex justify-between">
              <span>Subtotal Serviços:</span>
              <span>{formatCurrency(subtotalServicos)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(os.valor_total)}</span>
          </div>
          {os.valor_desconto && os.valor_desconto > 0 && (
            <div className="flex justify-between text-destructive">
              <span>Desconto:</span>
              <span>- {formatCurrency(os.valor_desconto)}</span>
            </div>
          )}
          <div className="border-t border-border pt-2 mt-2"></div>
          <div className="flex justify-between font-bold text-lg">
            <span>TOTAL:</span>
            <span>{formatCurrency(os.valor_final)}</span>
          </div>
        </div>
      </section>

      {/* Observações */}
      {os.observacoes && (
        <section className="print-section">
          <h3 className="text-lg font-semibold mb-4 text-primary border-b border-border pb-2">
            Observações
          </h3>
          <div className="bg-muted/20 p-3 rounded border">
            <p className="whitespace-pre-wrap text-sm">{os.observacoes}</p>
          </div>
        </section>
      )}

      {/* Controle de Qualidade */}
      <section className="print-section">
        <h3 className="text-lg font-semibold mb-4 text-primary border-b border-border pb-2">
          Controle de Qualidade
        </h3>
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-2">□ Revisão Inicial</p>
              <p className="text-xs text-muted-foreground">Verificação das condições gerais</p>
            </div>
            <div>
              <p className="font-medium mb-2">□ Execução dos Serviços</p>
              <p className="text-xs text-muted-foreground">Conformidade com o especificado</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-2">□ Teste Final</p>
              <p className="text-xs text-muted-foreground">Verificação do funcionamento</p>
            </div>
            <div>
              <p className="font-medium mb-2">□ Entrega</p>
              <p className="text-xs text-muted-foreground">Cliente satisfeito com o serviço</p>
            </div>
          </div>
        </div>
      </section>
    </PrintLayout>
  );
}