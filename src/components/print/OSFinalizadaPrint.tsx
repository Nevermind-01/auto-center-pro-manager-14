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
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'pix': 'PIX',
      'transferencia': 'Transferência Bancária',
      'boleto': 'Boleto Bancário',
      'cheque': 'Cheque'
    };
    return formaMap[forma] || forma;
  };

  const subtotalProdutos = os.produtos.reduce((sum, p) => sum + p.preco_total, 0);
  const subtotalServicos = os.servicos.reduce((sum, s) => sum + s.preco, 0);
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
        <div className="bg-success/10 border border-success/20 p-3 rounded text-center">
          <p className="text-lg font-semibold text-success">
            ✓ SERVIÇO CONCLUÍDO
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

      {/* Período de Execução */}
      <section className="print-section">
        <h3 className="text-lg font-semibold mb-4 text-primary border-b border-border pb-2">
          Período de Execução
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <p><span className="font-medium">Início:</span> {format(new Date(os.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
          <p><span className="font-medium">Conclusão:</span> {format(new Date(os.finalizado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
        </div>
      </section>

      {/* Serviços e Peças Utilizadas */}
      <section className="print-section">
        <h3 className="text-lg font-semibold mb-4 text-primary border-b border-border pb-2">
          Serviços Executados e Peças Utilizadas
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

      {/* Resumo Financeiro e Pagamento */}
      <section className="print-section">
        <h3 className="text-lg font-semibold mb-4 text-primary border-b border-border pb-2">
          Resumo Financeiro e Pagamento
        </h3>
        <div className="grid grid-cols-2 gap-8">
          {/* Resumo */}
          <div className="space-y-2 text-sm">
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
              <span>TOTAL PAGO:</span>
              <span>{formatCurrency(os.valor_final)}</span>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="bg-muted/20 p-4 rounded border">
            <h4 className="font-semibold mb-3">Forma de Pagamento</h4>
            <div className="space-y-2 text-sm">
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
          <h3 className="text-lg font-semibold mb-4 text-primary border-b border-border pb-2">
            Observações
          </h3>
          <div className="bg-muted/20 p-3 rounded border">
            <p className="whitespace-pre-wrap text-sm">{os.observacoes}</p>
          </div>
        </section>
      )}

      {/* Garantia */}
      <section className="print-section">
        <h3 className="text-lg font-semibold mb-4 text-primary border-b border-border pb-2">
          Garantia dos Serviços
        </h3>
        <div className="bg-muted/20 p-4 rounded border">
          <div className="text-sm space-y-2">
            <p className="font-medium">Condições de Garantia:</p>
            <ul className="space-y-1 list-disc list-inside text-xs">
              <li>Os serviços executados possuem garantia de 90 dias</li>
              <li>As peças substituídas possuem garantia conforme especificação do fabricante</li>
              <li>A garantia é válida mediante apresentação desta fatura</li>
              <li>A garantia não cobre danos causados por mau uso ou desgaste natural</li>
              <li>Serviços de manutenção preventiva não possuem garantia</li>
            </ul>
            <div className="mt-4 pt-2 border-t border-border">
              <p className="text-xs font-medium">
                Garantia válida até: {format(new Date(new Date(os.finalizado_em).getTime() + 90 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Declaração de Satisfação */}
      <section className="print-section">
        <div className="bg-muted/20 p-4 rounded border">
          <p className="text-sm text-center">
            <strong>Declaro que recebi o veículo em perfeitas condições de funcionamento e estou satisfeito(a) com os serviços prestados.</strong>
          </p>
        </div>
      </section>
    </PrintLayout>
  );
}