import React from 'react';
import { EmpresaData } from '@/hooks/useEmpresaData';

interface PrintLayoutProps {
  empresa: EmpresaData;
  title: string;
  documentNumber: string;
  documentDate: string;
  children: React.ReactNode;
  className?: string;
}

export function PrintLayout({ 
  empresa, 
  title, 
  documentNumber, 
  documentDate, 
  children,
  className = ''
}: PrintLayoutProps) {
  const formatAddress = (empresa: EmpresaData): string => {
    const parts = [
      empresa.logradouro,
      empresa.numero,
      empresa.bairro,
      empresa.municipio,
      empresa.uf
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  return (
    <div className={`print-container bg-background text-foreground ${className}`}>
      {/* Cabeçalho */}
      <header className="print-header border-b border-border pb-2 mb-2">
        <div className="flex justify-between items-start">
          {/* Informações da Empresa */}
          <div className="flex items-start gap-2">
            {empresa.logo_url && (
              <div className="print-logo">
                <img 
                  src={empresa.logo_url} 
                  alt="Logo da empresa"
                  className="max-h-8 max-w-16 object-contain"
                  onError={(e) => {
                    // Em caso de erro na logo, esconder o elemento
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                  loading="eager"
                />
              </div>
            )}
            <div className="space-y-0">
              <h2 className="text-sm font-bold text-primary">{empresa.nome}</h2>
              {empresa.razao_social && empresa.razao_social !== empresa.nome && (
                <p className="text-xs text-muted-foreground">{empresa.razao_social}</p>
              )}
              <div className="text-xs space-y-0">
                {formatAddress(empresa) && (
                  <p>{formatAddress(empresa)}</p>
                )}
                <div className="flex gap-2">
                  {empresa.telefone_principal && (
                    <span>Tel: {empresa.telefone_principal}</span>
                  )}
                  {empresa.email_fiscal && (
                    <span>Email: {empresa.email_fiscal}</span>
                  )}
                </div>
                {empresa.cnpj && (
                  <p>CNPJ: {empresa.cnpj}</p>
                )}
              </div>
            </div>
          </div>

          {/* Informações do Documento */}
          <div className="text-right">
            <h1 className="text-lg font-bold text-primary mb-0.5">{title}</h1>
            <div className="text-xs space-y-0">
              <p className="font-mono font-semibold">{documentNumber}</p>
              <p>{documentDate}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="print-content space-y-2">
        {children}
      </main>

      {/* Rodapé */}
      <footer className="print-footer mt-3 pt-2 border-t border-border">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-0.5">
            <p className="font-semibold text-xs">Responsável pela Empresa:</p>
            <div className="border-b border-border h-4"></div>
            <p className="text-xs text-muted-foreground">Assinatura e carimbo</p>
          </div>
          <div className="space-y-0.5">
            <p className="font-semibold text-xs">Cliente:</p>
            <div className="border-b border-border h-4"></div>
            <p className="text-xs text-muted-foreground">Assinatura</p>
          </div>
        </div>
      </footer>
    </div>
  );
}