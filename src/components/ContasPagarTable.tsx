import { ContaPagar } from '@/hooks/useContasPagar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CheckCircle, 
  XCircle, 
  Edit2, 
  FileUp, 
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface ContasPagarTableProps {
  contas: ContaPagar[];
  onStatusUpdate: (id: string, status: 'paga' | 'cancelada') => Promise<void>;
  onEdit: (conta: ContaPagar) => void;
}

export function ContasPagarTable({ contas, onStatusUpdate, onEdit }: ContasPagarTableProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { variant: 'secondary' as const, label: 'Pendente' },
      paga: { variant: 'default' as const, label: 'Paga' },
      cancelada: { variant: 'destructive' as const, label: 'Cancelada' }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isVencida = (vencimento: string) => {
    return new Date(vencimento) < new Date() && new Date(vencimento).toDateString() !== new Date().toDateString();
  };

  const isVenceHoje = (vencimento: string) => {
    return new Date(vencimento).toDateString() === new Date().toDateString();
  };

  if (contas.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Nenhuma conta encontrada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contas a Pagar ({contas.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Comprovante</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contas.map((conta) => (
                <TableRow 
                  key={conta.id}
                  className={
                    conta.status === 'pendente' && isVencida(conta.vencimento) 
                      ? 'bg-destructive/5' 
                      : conta.status === 'pendente' && isVenceHoje(conta.vencimento)
                      ? 'bg-warning/5'
                      : ''
                  }
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{conta.empresa}</div>
                      {conta.descricao && (
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {conta.descricao}
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        {conta.fixa && <Badge variant="outline" className="text-xs">Fixa</Badge>}
                        {conta.status === 'pendente' && isVencida(conta.vencimento) && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Vencida
                          </Badge>
                        )}
                        {conta.status === 'pendente' && isVenceHoje(conta.vencimento) && (
                          <Badge variant="secondary" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            Vence hoje
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium">
                      R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className={
                      conta.status === 'pendente' && isVencida(conta.vencimento)
                        ? 'text-destructive font-medium'
                        : conta.status === 'pendente' && isVenceHoje(conta.vencimento)
                        ? 'text-warning font-medium'
                        : ''
                    }>
                      {format(new Date(conta.vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                    {conta.status === 'pendente' && isVencida(conta.vencimento) && (
                      <div className="text-xs text-destructive">
                        {Math.floor((new Date().getTime() - new Date(conta.vencimento).getTime()) / (1000 * 60 * 60 * 24))} dias atraso
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    {getStatusBadge(conta.status)}
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {conta.forma_pagamento && (
                        <div className="text-sm capitalize">{conta.forma_pagamento}</div>
                      )}
                      {conta.data_pagamento && (
                        <div className="text-xs text-muted-foreground">
                          Pago em: {format(new Date(conta.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {conta.comprovante_url ? (
                      <a 
                        href={conta.comprovante_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                      >
                        <FileUp className="h-4 w-4" />
                        Ver
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(conta)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      {conta.status === 'pendente' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onStatusUpdate(conta.id, 'paga')}
                            className="h-8 w-8 p-0 text-success hover:bg-success/10"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onStatusUpdate(conta.id, 'cancelada')}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}