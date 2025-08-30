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
      {/* Dados do Cliente */}
      <section className="print-section">
        <h3 className="text-lg font-semibold mb-4 text-primary border-b border-border pb-2">
          Dados do Cliente
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="font-medium">Nome:</span> {orcamento.cliente_nome}</p>
            {orcamento.cliente?.cpf && (
              <p><span className="font-medium">CPF:</span> {maskCPF(orcamento.cliente.cpf)}</p>
            )}
            {orcamento.cliente?.cnpj && (
              <p><span className="font-medium">CNPJ:</span> {maskCNPJ(orcamento.cliente.cnpj)}</p>
            )}
          </div>
          <div>
            {orcamento.cliente?.telefone && (
              <p><span className="font-medium">Telefone:</span> {maskPhone(orcamento.cliente.telefone)}</p>
            )}
            {orcamento.cliente?.email && (
              <p><span className="font-medium">Email:</span> {maskEmail(orcamento.cliente.email)}</p>
            )}
            {orcamento.cliente?.endereco && (
              <p><span className="font-medium">Endereço:</span> {orcamento.cliente.endereco}</p>
            )}
          </div>
        </div>
      </section>

      {/* Dados do Veículo */}
      {orcamento.veiculo && (
        <section className="print-section">
          <h3 className="text-lg font-semibold mb-4 text-primary border-b border-border pb-2">
            Dados do Veículo
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-medium">Marca/Modelo:</span> {orcamento.veiculo.marca} {orcamento.veiculo.modelo}</p>
              <p><span className="font-medium">Ano:</span> {orcamento.veiculo.ano || 'N/A'}</p>
              <p><span className="font-medium">Placa:</span> {orcamento.veiculo.placa}</p>
            </div>
            <div>
              {orcamento.veiculo.cor && (
                <p><span className="font-medium">Cor:</span> {orcamento.veiculo.cor}</p>
              )}
              {orcamento.veiculo.km_atual !== undefined && orcamento.veiculo.km_atual > 0 && (
                <p><span className="font-medium">KM Atual:</span> {orcamento.veiculo.km_atual.toLocaleString('pt-BR')} km</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Mecânico Responsável */}
      {orcamento.mecanico && (
        <section className="print-section">
          <h3 className="text-lg font-semibold mb-4 text-primary border-b border-border pb-2">
            Mecânico Responsável
          </h3>
          <p className="text-sm"><span className="font-medium">Nome:</span> {orcamento.mecanico.nome}</p>
        </section>
      )}

      {/* Itens do Orçamento */}
      <section className="print-section">
        <h3 className="text-lg font-semibold mb-4 text-primary border-b border-border pb-2">
          Itens do Orçamento
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
            {orcamento.produtos.map((produto, index) => (
              <tr key={`produto-${index}`}>
                <td className="border border-border p-2">{produto.produto_nome}</td>
                <td className="border border-border p-2 text-center">{produto.quantidade}</td>
                <td className="border border-border p-2 text-right">{formatCurrency(produto.preco_unitario)}</td>
                <td className="border border-border p-2 text-right">{formatCurrency(produto.preco_total)}</td>
              </tr>
            ))}
            {orcamento.servicos.map((servico, index) => (
              <tr key={`servico-${index}`}>
                <td className="border border-border p-2">{servico.servico_nome}</td>
                <td className="border border-border p-2 text-center">1</td>
                <td className="border border-border p-2 text-right">{formatCurrency(servico.preco)}</td>
                <td className="border border-border p-2 text-right">{formatCurrency(servico.preco)}</td>
              </tr>
            ))}
            {orcamento.produtos.length === 0 && orcamento.servicos.length === 0 && (
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
          <div className="border-t border-border pt-2 mt-2"></div>
          <div className="flex justify-between font-bold text-lg">
            <span>TOTAL:</span>
            <span>{formatCurrency(orcamento.valor_final)}</span>
          </div>
        </div>
      </section>

      {/* Observações e Validade */}
      <section className="print-section">
        <h3 className="text-lg font-semibold mb-4 text-primary border-b border-border pb-2">
          Observações e Condições
        </h3>
        <div className="space-y-3 text-sm">
          <p><span className="font-medium">Validade do Orçamento:</span> {format(new Date(orcamento.validade), 'dd/MM/yyyy', { locale: ptBR })}</p>
          
          {orcamento.observacoes && (
            <div>
              <p className="font-medium mb-2">Observações:</p>
              <p className="whitespace-pre-wrap bg-muted/20 p-3 rounded border">{orcamento.observacoes}</p>
            </div>
          )}

          <div className="bg-muted/20 p-3 rounded border">
            <p className="font-medium mb-2">Condições Gerais:</p>
            <ul className="space-y-1 text-xs list-disc list-inside">
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