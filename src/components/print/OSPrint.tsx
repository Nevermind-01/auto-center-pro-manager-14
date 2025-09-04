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
      cor?: string;
      km_atual?: number;
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
    venda_produtos: Array<{
      produto_nome: string;
      quantidade: number;
      preco_unitario: number;
      preco_total: number;
    }>;
    venda_servicos: Array<{
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

  const subtotalProdutos = (os.venda_produtos || []).reduce((sum, p) => sum + p.preco_total, 0);
  const subtotalServicos = (os.venda_servicos || []).reduce((sum, s) => sum + s.preco, 0);

  return (
    <PrintLayout
      empresa={empresa}
      title="ORDEM DE SERVIÇO"
      documentNumber={`Nº ${os.numero_os}`}
      documentDate={`Criada em: ${format(new Date(os.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`}
    >
      {/* Status da OS */}
      <section className="print-section">
        <div className="bg-muted/20 p-1 rounded border text-center">
          <p className="text-sm font-semibold">
            <span className="text-muted-foreground">Status:</span> {getStatusText(os.status)}
          </p>
        </div>
      </section>

      {/* Dados do Cliente e Veículo */}
      <section className="print-section">
        <div className="print-compact-grid">
          {/* Cliente */}
          <div>
            <h3 className="text-sm font-semibold text-primary border-b border-border pb-0.5 mb-1">
              Dados do Cliente
            </h3>
            <div className="text-xs space-y-0.5">
              <div className="print-inline-data">
                <span className="print-inline-item"><strong>Nome:</strong> {os.cliente_nome}</span>
              </div>
              <div className="print-inline-data">
                {os.cliente?.cpf && (
                  <span className="print-inline-item"><strong>CPF:</strong> {maskCPF(os.cliente.cpf)}</span>
                )}
                {os.cliente?.cnpj && (
                  <span className="print-inline-item"><strong>CNPJ:</strong> {maskCNPJ(os.cliente.cnpj)}</span>
                )}
                {os.cliente?.telefone && (
                  <span className="print-inline-item"><strong>Tel:</strong> {maskPhone(os.cliente.telefone)}</span>
                )}
              </div>
              {os.cliente?.email && (
                <p><strong>Email:</strong> {maskEmail(os.cliente.email)}</p>
              )}
              {os.cliente?.endereco && (
                <p><strong>Endereço:</strong> {os.cliente.endereco}</p>
              )}
            </div>
          </div>

          {/* Veículo */}
          {os.veiculo && (
            <div>
              <h3 className="text-sm font-semibold text-primary border-b border-border pb-0.5 mb-1">
                Dados do Veículo
              </h3>
              <div className="text-xs space-y-0.5">
                <div className="print-inline-data">
                  <span className="print-inline-item"><strong>Marca/Modelo:</strong> {os.veiculo.marca} {os.veiculo.modelo}</span>
                  <span className="print-inline-item"><strong>Ano:</strong> {os.veiculo.ano || 'N/A'}</span>
                </div>
                <div className="print-inline-data">
                  <span className="print-inline-item"><strong>Placa:</strong> {os.veiculo.placa}</span>
                  {os.veiculo.cor && (
                    <span className="print-inline-item"><strong>Cor:</strong> {os.veiculo.cor}</span>
                  )}
                </div>
                {os.veiculo.km_atual !== undefined && os.veiculo.km_atual > 0 && (
                  <p><strong>KM Atual:</strong> {os.veiculo.km_atual.toLocaleString('pt-BR')} km</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mecânico Responsável */}
      {os.mecanico && (
        <section className="print-section">
          <h3 className="text-sm font-semibold text-primary border-b border-border pb-0.5 mb-1">
            Mecânico Responsável
          </h3>
          <div className="text-xs">
            <div className="print-inline-data">
              <span className="print-inline-item"><strong>Nome:</strong> {os.mecanico.nome}</span>
              {os.mecanico.especialidade && (
                <span className="print-inline-item"><strong>Especialidade:</strong> {os.mecanico.especialidade}</span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Serviços e Peças */}
      <section className="print-section">
        <h3 className="text-sm font-semibold mb-1 text-primary border-b border-border pb-0.5">
          Serviços e Peças
        </h3>
        
        <table className="w-full border-collapse border border-border text-xs">
          <thead>
            <tr className="bg-muted/30">
              <th className="border border-border p-0.5 text-left w-2/5">Descrição</th>
              <th className="border border-border p-0.5 text-center w-1/12">Qtd.</th>
              <th className="border border-border p-0.5 text-right w-1/4">Valor Unit.</th>
              <th className="border border-border p-0.5 text-right w-1/4">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(os.venda_produtos || []).map((produto, index) => (
              <tr key={`produto-${index}`}>
                <td className="border border-border p-0.5">[P] {produto.produto_nome}</td>
                <td className="border border-border p-0.5 text-center">{produto.quantidade}</td>
                <td className="border border-border p-0.5 text-right">{formatCurrency(produto.preco_unitario)}</td>
                <td className="border border-border p-0.5 text-right">{formatCurrency(produto.preco_total)}</td>
              </tr>
            ))}
            {(os.venda_servicos || []).map((servico, index) => (
              <tr key={`servico-${index}`}>
                <td className="border border-border p-0.5">[S] {servico.servico_nome}</td>
                <td className="border border-border p-0.5 text-center">1</td>
                <td className="border border-border p-0.5 text-right">{formatCurrency(servico.preco)}</td>
                <td className="border border-border p-0.5 text-right">{formatCurrency(servico.preco)}</td>
              </tr>
            ))}
            {(os.venda_produtos || []).length === 0 && (os.venda_servicos || []).length === 0 && (
              <tr>
                <td colSpan={4} className="border border-border p-1 text-center text-muted-foreground">
                  Nenhum item encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Resumo Financeiro */}
      <section className="print-section">
        <h3 className="text-sm font-semibold mb-1 text-primary border-b border-border pb-0.5">
          Resumo Financeiro
        </h3>
        <div className="space-y-0.5 text-xs max-w-xs ml-auto">
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
          <div className="border-t border-border pt-0.5 mt-0.5"></div>
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL:</span>
            <span>{formatCurrency(os.valor_final)}</span>
          </div>
        </div>
      </section>

      {/* Observações */}
      {os.observacoes && (
        <section className="print-section">
          <h3 className="text-sm font-semibold mb-1 text-primary border-b border-border pb-0.5">
            Observações
          </h3>
          <div className="bg-muted/20 p-1 rounded border">
            <p className="whitespace-pre-wrap text-xs">{os.observacoes}</p>
          </div>
        </section>
      )}

      {/* Controle de Qualidade */}
      <section className="print-section">
        <h3 className="text-sm font-semibold text-primary border-b border-border pb-0.5 mb-1">
          Controle de Qualidade
        </h3>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 border border-border inline-block"></span>
            <span>Revisão Inicial</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 border border-border inline-block"></span>
            <span>Execução dos Serviços</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 border border-border inline-block"></span>
            <span>Teste Final</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 border border-border inline-block"></span>
            <span>Entrega</span>
          </div>
        </div>
      </section>
    </PrintLayout>
  );
}