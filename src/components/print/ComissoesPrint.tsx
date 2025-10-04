import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PrintLayout } from './PrintLayout';
import { EmpresaData } from '@/hooks/useEmpresaData';

interface ComissoesPrintProps {
  mecanico: {
    nome: string;
  };
  periodo?: {
    from?: Date;
    to?: Date;
  };
  comissoes: Array<{
    id: string;
    finalizado_em: string;
    numero_os: string;
    base_calculo: number;
    tipo_calculo: string;
    percentual?: number;
    valor_fixo?: number;
    valor_final: number;
  }>;
  total: number;
  empresa: EmpresaData;
}

export function ComissoesPrint({ mecanico, periodo, comissoes, total, empresa }: ComissoesPrintProps) {
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const getPeriodoText = () => {
    if (periodo?.from && periodo?.to) {
      return `Período: ${format(periodo.from, 'dd/MM/yyyy')} a ${format(periodo.to, 'dd/MM/yyyy')}`;
    }
    return 'Período: Todos os registros';
  };

  return (
    <PrintLayout
      empresa={empresa}
      title="RELATÓRIO DE COMISSÕES"
      documentNumber={`Mecânico: ${mecanico.nome}`}
      documentDate={getPeriodoText()}
    >
      {/* Tabela de Comissões */}
      <section className="print-section">
        <h3 className="text-sm font-semibold text-primary border-b border-border pb-0.5 mb-1">
          Comissões Registradas
        </h3>
        
        <table className="w-full border-collapse border border-border text-xs">
          <thead>
            <tr className="bg-muted/30">
              <th className="border border-border p-0.5 text-left">Data</th>
              <th className="border border-border p-0.5 text-left">OS</th>
              <th className="border border-border p-0.5 text-right">Base Cálculo</th>
              <th className="border border-border p-0.5 text-center">Tipo</th>
              <th className="border border-border p-0.5 text-right">Percentual</th>
              <th className="border border-border p-0.5 text-right">Valor Fixo</th>
              <th className="border border-border p-0.5 text-right">Valor Final</th>
            </tr>
          </thead>
          <tbody>
            {comissoes.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-border p-1 text-center text-muted-foreground">
                  Nenhuma comissão encontrada para o período.
                </td>
              </tr>
            ) : (
              <>
                {comissoes.map((comissao) => (
                  <tr key={comissao.id}>
                    <td className="border border-border p-0.5">
                      {comissao.finalizado_em 
                        ? format(new Date(comissao.finalizado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : '-'
                      }
                    </td>
                    <td className="border border-border p-0.5">{comissao.numero_os || '-'}</td>
                    <td className="border border-border p-0.5 text-right">
                      {formatCurrency(Number(comissao.base_calculo || 0))}
                    </td>
                    <td className="border border-border p-0.5 text-center capitalize">
                      {comissao.tipo_calculo}
                    </td>
                    <td className="border border-border p-0.5 text-right">
                      {comissao.percentual != null ? `${Number(comissao.percentual)}%` : '-'}
                    </td>
                    <td className="border border-border p-0.5 text-right">
                      {comissao.valor_fixo != null ? formatCurrency(Number(comissao.valor_fixo)) : '-'}
                    </td>
                    <td className="border border-border p-0.5 text-right font-medium">
                      {formatCurrency(Number(comissao.valor_final || 0))}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/50">
                  <td colSpan={6} className="border border-border p-0.5 text-right font-bold">
                    TOTAL:
                  </td>
                  <td className="border border-border p-0.5 text-right font-bold">
                    {formatCurrency(total)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </section>

      {/* Resumo */}
      <section className="print-section">
        <h3 className="text-sm font-semibold mb-1 text-primary border-b border-border pb-0.5">
          Resumo
        </h3>
        <div className="space-y-0.5 text-xs">
          <div className="flex justify-between">
            <span>Mecânico:</span>
            <span className="font-medium">{mecanico.nome}</span>
          </div>
          <div className="flex justify-between">
            <span>Total de Comissões:</span>
            <span className="font-medium">{comissoes.length}</span>
          </div>
          <div className="border-t border-border pt-0.5 mt-0.5"></div>
          <div className="flex justify-between font-bold text-sm">
            <span>VALOR TOTAL:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </section>

      {/* Observações */}
      <section className="print-section">
        <div className="bg-muted/20 p-1 rounded border text-xs">
          <p className="font-medium mb-0.5">Observações:</p>
          <ul className="space-y-0 text-xs list-disc list-inside">
            <li>Este relatório contém todas as comissões registradas no período especificado</li>
            <li>Os valores exibidos refletem as comissões calculadas com base nas vendas finalizadas</li>
            <li>Para mais informações, entre em contato com a administração</li>
          </ul>
        </div>
      </section>
    </PrintLayout>
  );
}
