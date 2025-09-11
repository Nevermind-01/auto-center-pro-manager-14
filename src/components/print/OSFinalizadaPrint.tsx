import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PrintLayout } from './PrintLayout';
import { EmpresaData } from '@/hooks/useEmpresaData';
import { useDataMasking } from '@/hooks/useDataMasking';

interface OSFinalizadaPrintProps {
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
    finalizado_em: string;
    valor_total: number;
    valor_desconto?: number;
    valor_final: number;
    forma_pagamento: string;
    parcelas?: number;
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

export function OSFinalizadaPrint({ os, empresa }: OSFinalizadaPrintProps) {
  const { maskCPF, maskCNPJ, maskPhone, maskEmail } = useDataMasking();

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const getFormaPagamentoText = (forma: string): string => {
    const formaMap: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'debito': 'Cartão de Débito',
      'credito': 'Cartão de Crédito',
      'cheque': 'Cheque',
      'boleto': 'Boleto Bancário',
      'carteira': 'Carteira Digital',
      'outros': 'Outros',
      // Compatibilidade com valores antigos
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'transferencia': 'Transferência Bancária'
    };
    return formaMap[forma] || forma;
  };

  const subtotalProdutos = (os.venda_produtos || []).reduce((sum, p) => sum + p.preco_total, 0);
  const subtotalServicos = (os.venda_servicos || []).reduce((sum, s) => sum + s.preco, 0);
  const valorParcela = os.parcelas && os.parcelas > 1 ? os.valor_final / os.parcelas : os.valor_final;

  return (
    <PrintLayout
      empresa={empresa}
      title="FATURA DE SERVIÇO"
      documentNumber={`OS Nº ${os.numero_os}`}
      documentDate={`Finalizada em: ${format(new Date(os.finalizado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`}
    >
      {/* Status Finalizada */}
      <section className="print-section">
        <div className="bg-success/10 border border-success/20 p-1 rounded text-center">
          <p className="text-sm font-semibold text-success">
            ✓ SERVIÇO CONCLUÍDO
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

      {/* Mecânico e Período de Execução */}
      <section className="print-section">
        <div className="print-compact-grid">
          {/* Mecânico */}
          {os.mecanico && (
            <div>
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
            </div>
          )}

          {/* Período */}
          <div>
            <h3 className="text-sm font-semibold text-primary border-b border-border pb-0.5 mb-1">
              Período de Execução
            </h3>
            <div className="text-xs space-y-0.5">
              <p><strong>Início:</strong> {format(new Date(os.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
              <p><strong>Conclusão:</strong> {format(new Date(os.finalizado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços e Peças Utilizadas */}
      <section className="print-section">
        <h3 className="text-sm font-semibold mb-1 text-primary border-b border-border pb-0.5">
          Serviços Executados e Peças Utilizadas
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

      {/* Resumo Financeiro e Pagamento */}
      <section className="print-section">
        <h3 className="text-sm font-semibold mb-1 text-primary border-b border-border pb-0.5">
          Resumo Financeiro e Pagamento
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {/* Resumo */}
          <div className="space-y-0.5 text-xs">
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
              <span>TOTAL PAGO:</span>
              <span>{formatCurrency(os.valor_final)}</span>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="bg-muted/20 p-1 rounded border">
            <h4 className="font-semibold mb-1 text-xs">Forma de Pagamento</h4>
            <div className="space-y-0.5 text-xs">
              <p><span className="font-medium">Método:</span> {getFormaPagamentoText(os.forma_pagamento)}</p>
              {os.parcelas && os.parcelas > 1 ? (
                <div>
                  <p><span className="font-medium">Parcelas:</span> {os.parcelas}x de {formatCurrency(valorParcela)}</p>
                  <p className="text-xs text-muted-foreground">Total: {formatCurrency(os.valor_final)}</p>
                </div>
              ) : (
                <p><span className="font-medium">Valor:</span> {formatCurrency(os.valor_final)} à vista</p>
              )}
            </div>
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

      {/* Garantia */}
      <section className="print-section">
        <h3 className="text-sm font-semibold mb-1 text-primary border-b border-border pb-0.5">
          Garantia dos Serviços
        </h3>
        <div className="bg-muted/20 p-1 rounded border">
          <div className="text-xs space-y-0.5">
            <p className="font-medium">Condições de Garantia:</p>
            <ul className="space-y-0 list-disc list-inside text-xs">
              <li>Os serviços executados possuem garantia de 90 dias</li>
              <li>As peças substituídas possuem garantia conforme especificação do fabricante</li>
              <li>A garantia é válida mediante apresentação desta fatura</li>
              <li>A garantia não cobre danos causados por mau uso ou desgaste natural</li>
              <li>Serviços de manutenção preventiva não possuem garantia</li>
            </ul>
            <div className="mt-1 pt-0.5 border-t border-border">
              <p className="text-xs font-medium">
                Garantia válida até: {format(new Date(new Date(os.finalizado_em).getTime() + 90 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Declaração de Satisfação */}
      <section className="print-section">
        <div className="bg-muted/20 p-1 rounded border">
          <p className="text-xs text-center">
            <strong>Declaro que recebi o veículo em perfeitas condições de funcionamento e estou satisfeito(a) com os serviços prestados.</strong>
          </p>
        </div>
      </section>
    </PrintLayout>
  );
}