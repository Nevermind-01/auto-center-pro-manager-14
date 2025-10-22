import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FechamentoCaixaPrintProps {
  fechamento: {
    id: string;
    caixa_id: string;
    contagem_dinheiro: number;
    contagem_pix: number;
    contagem_debito: number;
    contagem_credito: number;
    contagem_outros: Record<string, number>;
    total_contado: number;
    total_esperado: number;
    diferenca: number;
    resumo_por_forma: {
      esperado: {
        dinheiro: number;
        pix: number;
        debito: number;
        credito: number;
        outros: Record<string, number>;
      };
      contado: {
        dinheiro: number;
        pix: number;
        debito: number;
        credito: number;
        outros: Record<string, number>;
      };
      movimentacoes: Record<string, { entradas: number; saidas: number; total: number }>;
      suprimentos: number;
      sangrias: number;
      troco_inicial: number;
    };
    gerado_em: string;
  };
  caixa: {
    aberto_em: string;
    fechado_em?: string;
    troco_inicial: number;
  };
  empresaData?: any;
}

export const FechamentoCaixaPrint: React.FC<FechamentoCaixaPrintProps> = ({
  fechamento,
  caixa,
  empresaData
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const diferencaClass = fechamento.diferenca === 0 ? 'text-green-600' : 
                         fechamento.diferenca > 0 ? 'text-blue-600' : 'text-red-600';

  return (
    <div className="print-container bg-white p-8 max-w-[21cm] mx-auto">
      {/* Cabeçalho */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        {empresaData?.logo_url && (
          <img 
            src={empresaData.logo_url} 
            alt="Logo" 
            className="h-16 mb-3"
          />
        )}
        <h1 className="text-2xl font-bold text-gray-800">
          {empresaData?.nome || 'Empresa'}
        </h1>
        <h2 className="text-xl font-semibold text-gray-600 mt-1">
          RELATÓRIO DE FECHAMENTO DE CAIXA
        </h2>
      </div>

      {/* Informações do Caixa */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Informações do Caixa</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">ID do Caixa:</p>
            <p className="font-mono text-sm">{fechamento.caixa_id.substring(0, 8)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">ID do Fechamento:</p>
            <p className="font-mono text-sm">{fechamento.id.substring(0, 8)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Abertura:</p>
            <p className="font-medium">{formatDateTime(caixa.aberto_em)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fechamento:</p>
            <p className="font-medium">{formatDateTime(fechamento.gerado_em)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Troco Inicial:</p>
            <p className="font-medium">{formatCurrency(fechamento.resumo_por_forma.troco_inicial)}</p>
          </div>
        </div>
      </div>

      {/* Resumo por Forma de Pagamento */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Movimentações por Forma de Pagamento</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left text-sm">Forma</th>
              <th className="border border-gray-300 px-3 py-2 text-right text-sm">Entradas</th>
              <th className="border border-gray-300 px-3 py-2 text-right text-sm">Saídas</th>
              <th className="border border-gray-300 px-3 py-2 text-right text-sm">Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(fechamento.resumo_por_forma.movimentacoes).map(([forma, dados]) => (
              <tr key={forma}>
                <td className="border border-gray-300 px-3 py-2 text-sm capitalize">{forma}</td>
                <td className="border border-gray-300 px-3 py-2 text-right text-sm text-green-600">
                  {formatCurrency(dados.entradas)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right text-sm text-red-600">
                  {formatCurrency(dados.saidas)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right text-sm font-medium">
                  {formatCurrency(dados.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Suprimentos e Sangrias */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="border border-gray-300 p-3 rounded">
          <p className="text-sm text-gray-600 mb-1">Total Suprimentos</p>
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(fechamento.resumo_por_forma.suprimentos)}
          </p>
        </div>
        <div className="border border-gray-300 p-3 rounded">
          <p className="text-sm text-gray-600 mb-1">Total Sangrias</p>
          <p className="text-lg font-bold text-red-600">
            {formatCurrency(fechamento.resumo_por_forma.sangrias)}
          </p>
        </div>
      </div>

      {/* Contagem Manual */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Contagem Manual</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left text-sm">Forma</th>
              <th className="border border-gray-300 px-3 py-2 text-right text-sm">Esperado</th>
              <th className="border border-gray-300 px-3 py-2 text-right text-sm">Contado</th>
              <th className="border border-gray-300 px-3 py-2 text-right text-sm">Diferença</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-2 text-sm">Dinheiro</td>
              <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                {formatCurrency(fechamento.resumo_por_forma.esperado.dinheiro)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                {formatCurrency(fechamento.contagem_dinheiro)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                {formatCurrency(fechamento.contagem_dinheiro - fechamento.resumo_por_forma.esperado.dinheiro)}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 text-sm">PIX</td>
              <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                {formatCurrency(fechamento.resumo_por_forma.esperado.pix)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                {formatCurrency(fechamento.contagem_pix)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                {formatCurrency(fechamento.contagem_pix - fechamento.resumo_por_forma.esperado.pix)}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 text-sm">Débito</td>
              <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                {formatCurrency(fechamento.resumo_por_forma.esperado.debito)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                {formatCurrency(fechamento.contagem_debito)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                {formatCurrency(fechamento.contagem_debito - fechamento.resumo_por_forma.esperado.debito)}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 text-sm">Crédito</td>
              <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                {formatCurrency(fechamento.resumo_por_forma.esperado.credito)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                {formatCurrency(fechamento.contagem_credito)}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                {formatCurrency(fechamento.contagem_credito - fechamento.resumo_por_forma.esperado.credito)}
              </td>
            </tr>
            
            {/* Outras formas de pagamento */}
            {Object.entries(fechamento.contagem_outros || {}).map(([forma, valor]) => {
              const esperado = fechamento.resumo_por_forma.esperado.outros[forma] || 0;
              return (
                <tr key={forma}>
                  <td className="border border-gray-300 px-3 py-2 text-sm capitalize">{forma}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                    {formatCurrency(esperado)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                    {formatCurrency(valor)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                    {formatCurrency(valor - esperado)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totais Finais */}
      <div className="border-t-2 border-gray-800 pt-4 mt-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Esperado</p>
            <p className="text-xl font-bold">{formatCurrency(fechamento.total_esperado)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Contado</p>
            <p className="text-xl font-bold">{formatCurrency(fechamento.total_contado)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Diferença</p>
            <p className={`text-xl font-bold ${diferencaClass}`}>
              {formatCurrency(fechamento.diferenca)}
            </p>
          </div>
        </div>

        {fechamento.diferenca !== 0 && (
          <div className="text-center mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm font-medium">
              {fechamento.diferenca > 0 
                ? `⚠️ SOBRA DE ${formatCurrency(Math.abs(fechamento.diferenca))}`
                : `⚠️ FALTA DE ${formatCurrency(Math.abs(fechamento.diferenca))}`
              }
            </p>
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>Relatório gerado em {formatDateTime(fechamento.gerado_em)}</p>
        <p className="mt-1">
          {empresaData?.nome} - {empresaData?.cnpj || empresaData?.email}
        </p>
      </div>
    </div>
  );
};
