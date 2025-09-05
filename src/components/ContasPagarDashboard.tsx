import { ContaPagar } from '@/hooks/useContasPagar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Calendar,
  TrendingUp,
  Building
} from 'lucide-react';

interface ContasPagarDashboardProps {
  contas: ContaPagar[];
}

export function ContasPagarDashboard({ contas }: ContasPagarDashboardProps) {
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  // Estatísticas
  const totalPendente = contas
    .filter(c => c.status === 'pendente')
    .reduce((sum, c) => sum + c.valor, 0);

  const totalPago = contas
    .filter(c => c.status === 'paga')
    .reduce((sum, c) => sum + c.valor, 0);

  const contasVencidas = contas.filter(c => 
    c.status === 'pendente' && new Date(c.vencimento) < today
  );

  const contasVencendoSemana = contas.filter(c => 
    c.status === 'pendente' && 
    new Date(c.vencimento) >= today &&
    new Date(c.vencimento) <= nextWeek
  );

  const contasFixas = contas.filter(c => c.fixa);
  const totalFixo = contasFixas.reduce((sum, c) => sum + c.valor, 0);

  const stats = [
    {
      title: 'Total Pendente',
      value: totalPendente,
      icon: DollarSign,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      title: 'Total Pago',
      value: totalPago,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Contas Vencidas',
      value: contasVencidas.length,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      title: 'Vencem em 7 dias',
      value: contasVencendoSemana.length,
      icon: Calendar,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {typeof stat.value === 'number' && stat.title.includes('Total') 
                      ? `R$ ${stat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : stat.value
                    }
                  </p>
                </div>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertas e Resumos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contas Vencidas */}
        {contasVencidas.length > 0 && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Contas Vencidas ({contasVencidas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contasVencidas.slice(0, 3).map((conta) => (
                  <div key={conta.id} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg">
                    <div>
                      <p className="font-medium">{conta.empresa}</p>
                      <p className="text-sm text-muted-foreground">
                        Venceu em {new Date(conta.vencimento).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant="destructive" className="text-xs">
                        {Math.floor((today.getTime() - new Date(conta.vencimento).getTime()) / (1000 * 60 * 60 * 24))} dias
                      </Badge>
                    </div>
                  </div>
                ))}
                {contasVencidas.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    E mais {contasVencidas.length - 3} contas vencidas...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Próximas a Vencer */}
        {contasVencendoSemana.length > 0 && (
          <Card className="border-warning/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <Calendar className="h-5 w-5" />
                Vencem nos Próximos 7 Dias ({contasVencendoSemana.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contasVencendoSemana.slice(0, 3).map((conta) => (
                  <div key={conta.id} className="flex items-center justify-between p-3 bg-warning/5 rounded-lg">
                    <div>
                      <p className="font-medium">{conta.empresa}</p>
                      <p className="text-sm text-muted-foreground">
                        Vence em {new Date(conta.vencimento).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {Math.ceil((new Date(conta.vencimento).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} dias
                      </Badge>
                    </div>
                  </div>
                ))}
                {contasVencendoSemana.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    E mais {contasVencendoSemana.length - 3} contas...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo de Contas Fixas */}
        {contasFixas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Contas Fixas ({contasFixas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gradient-card rounded-lg">
                  <div>
                    <p className="font-medium">Total Mensal</p>
                    <p className="text-sm text-muted-foreground">
                      {contasFixas.length} contas recorrentes
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      R$ {totalFixo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {contasFixas.slice(0, 4).map((conta) => (
                    <div key={conta.id} className="p-2 bg-muted rounded text-center">
                      <p className="text-xs font-medium truncate">{conta.empresa}</p>
                      <p className="text-sm">
                        R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}