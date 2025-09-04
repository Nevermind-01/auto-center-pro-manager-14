import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PrintLayout } from './PrintLayout';
import { EmpresaData } from '@/hooks/useEmpresaData';
import { useDataMasking } from '@/hooks/useDataMasking';

interface OrcamentoPrintProps {
  orcamento: {
    numero_orcamento: string;
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
    };
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
  };
  empresa: EmpresaData;
}

export function OrcamentoPrint({ orcamento, empresa }: OrcamentoPrintProps) {
  const { maskCPF, maskCNPJ, maskPhone, maskEmail } = useDataMasking();

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const subtotalProdutos = orcamento.produtos.reduce((sum, p) => sum + p.preco_total, 0);
  const subtotalServicos = orcamento.servicos.reduce((sum, s) => sum + s.preco, 0);

  return (
    <PrintLayout
      empresa={empresa}
      title="ORÇAMENTO"
      documentNumber={`Nº ${orcamento.numero_orcamento}`}
      documentDate={`Emitido em: ${format(new Date(orcamento.created_at), 'dd/MM/yyyy', { locale: ptBR })}`}
    >
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
                <span className="print-inline-item"><strong>Nome:</strong> {orcamento.cliente_nome}</span>
              </div>
              <div className="print-inline-data">
                {orcamento.cliente?.cpf && (
                  <span className="print-inline-item"><strong>CPF:</strong> {maskCPF(orcamento.cliente.cpf)}</span>
                )}
                {orcamento.cliente?.cnpj && (
                  <span className="print-inline-item"><strong>CNPJ:</strong> {maskCNPJ(orcamento.cliente.cnpj)}</span>
                )}
                {orcamento.cliente?.telefone && (
                  <span className="print-inline-item"><strong>Tel:</strong> {maskPhone(orcamento.cliente.telefone)}</span>
                )}
              </div>
              {orcamento.cliente?.email && (
                <p><strong>Email:</strong> {maskEmail(orcamento.cliente.email)}</p>
              )}
              {orcamento.cliente?.endereco && (
                <p><strong>Endereço:</strong> {orcamento.cliente.endereco}</p>
              )}
            </div>
          </div>

          {/* Veículo */}
          {orcamento.veiculo && (
            <div>
              <h3 className="text-sm font-semibold text-primary border-b border-border pb-0.5 mb-1">
                Dados do Veículo
              </h3>
              <div className="text-xs space-y-0.5">
                <div className="print-inline-data">
                  <span className="print-inline-item"><strong>Marca/Modelo:</strong> {orcamento.veiculo.marca} {orcamento.veiculo.modelo}</span>
                  <span className="print-inline-item"><strong>Ano:</strong> {orcamento.veiculo.ano || 'N/A'}</span>
                </div>
                <div className="print-inline-data">
                  <span className="print-inline-item"><strong>Placa:</strong> {orcamento.veiculo.placa}</span>
                  {orcamento.veiculo.cor && (
                    <span className="print-inline-item"><strong>Cor:</strong> {orcamento.veiculo.cor}</span>
                  )}
                </div>
                {orcamento.veiculo.km_atual !== undefined && orcamento.veiculo.km_atual > 0 && (
                  <p><strong>KM Atual:</strong> {orcamento.veiculo.km_atual.toLocaleString('pt-BR')} km</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mecânico Responsável */}
      {orcamento.mecanico && (
        <section className="print-section">
          <h3 className="text-sm font-semibold text-primary border-b border-border pb-0.5 mb-1">
            Mecânico Responsável
          </h3>
          <p className="text-xs"><strong>Nome:</strong> {orcamento.mecanico.nome}</p>
        </section>
      )}

      {/* Itens do Orçamento */}
      <section className="print-section">
        <h3 className="text-sm font-semibold text-primary border-b border-border pb-0.5 mb-1">
          Itens do Orçamento
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
            {orcamento.produtos.map((produto, index) => (
              <tr key={`produto-${index}`}>
                <td className="border border-border p-0.5">[P] {produto.produto_nome}</td>
                <td className="border border-border p-0.5 text-center">{produto.quantidade}</td>
                <td className="border border-border p-0.5 text-right">{formatCurrency(produto.preco_unitario)}</td>
                <td className="border border-border p-0.5 text-right">{formatCurrency(produto.preco_total)}</td>
              </tr>
            ))}
            {orcamento.servicos.map((servico, index) => (
              <tr key={`servico-${index}`}>
                <td className="border border-border p-0.5">[S] {servico.servico_nome}</td>
                <td className="border border-border p-0.5 text-center">1</td>
                <td className="border border-border p-0.5 text-right">{formatCurrency(servico.preco)}</td>
                <td className="border border-border p-0.5 text-right">{formatCurrency(servico.preco)}</td>
              </tr>
            ))}
            {orcamento.produtos.length === 0 && orcamento.servicos.length === 0 && (
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
              <span>Subtotal Produtos:</span>
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
            <span>{formatCurrency(orcamento.valor_total)}</span>
          </div>
          {orcamento.valor_desconto && orcamento.valor_desconto > 0 && (
            <div className="flex justify-between text-destructive">
              <span>Desconto:</span>
              <span>- {formatCurrency(orcamento.valor_desconto)}</span>
            </div>
          )}
          <div className="border-t border-border pt-0.5 mt-0.5"></div>
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL:</span>
            <span>{formatCurrency(orcamento.valor_final)}</span>
          </div>
        </div>
      </section>

      {/* Observações e Validade */}
      <section className="print-section">
        <h3 className="text-sm font-semibold mb-1 text-primary border-b border-border pb-0.5">
          Observações e Condições
        </h3>
        <div className="space-y-1 text-xs">
          <p><span className="font-medium">Validade do Orçamento:</span> {format(new Date(orcamento.validade), 'dd/MM/yyyy', { locale: ptBR })}</p>
          
          {orcamento.observacoes && (
            <div>
              <p className="font-medium mb-0.5">Observações:</p>
              <p className="whitespace-pre-wrap bg-muted/20 p-1 rounded border">{orcamento.observacoes}</p>
            </div>
          )}

          <div className="bg-muted/20 p-1 rounded border">
            <p className="font-medium mb-0.5">Condições Gerais:</p>
            <ul className="space-y-0 text-xs list-disc list-inside">
              <li>Este orçamento tem validade até a data indicada acima</li>
              <li>Os preços podem sofrer alteração sem aviso prévio</li>
              <li>A empresa se reserva o direito de verificar as condições do veículo antes do início dos serviços</li>
              <li>Eventuais serviços adicionais serão orçados separadamente</li>
            </ul>
          </div>
        </div>
      </section>
    </PrintLayout>
  );
}