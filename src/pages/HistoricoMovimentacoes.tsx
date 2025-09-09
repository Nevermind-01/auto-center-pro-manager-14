import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLogMovimentacoes } from "@/hooks/useSupabaseQueries";
import { 
  Search, 
  Calendar,
  User,
  FileText,
  Activity,
  History
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TipoFilter = 'todos' | 'criacao' | 'edicao' | 'cancelamento' | 'finalizacao' | 'exclusao';

const tipoOptions = [
  { value: 'todos', label: 'Todos' },
  { value: 'criacao', label: 'Criação' },
  { value: 'edicao', label: 'Edição' },
  { value: 'cancelamento', label: 'Cancelamento' },
  { value: 'finalizacao', label: 'Finalização' },
  { value: 'exclusao', label: 'Exclusão' }
];

const getTipoBadge = (tipo: string) => {
  const tipoConfig = {
    criacao: { variant: 'default' as const, label: 'Criação' },
    edicao: { variant: 'secondary' as const, label: 'Edição' },
    cancelamento: { variant: 'destructive' as const, label: 'Cancelamento' },
    finalizacao: { variant: 'outline' as const, label: 'Finalização' },
    exclusao: { variant: 'destructive' as const, label: 'Exclusão' }
  };
  
  const config = tipoConfig[tipo as keyof typeof tipoConfig] || 
    { variant: 'outline' as const, label: tipo };
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
};

const HistoricoMovimentacoes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>('todos');
  
  const { data: logs = [], isLoading } = useLogMovimentacoes();
  
  // Filter logs based on search term and type
  const logsFiltrados = useMemo(() => {
    return logs.filter(log => {
      // Filter by search term
      const matchesSearch = searchTerm === "" || 
        log.venda?.numero_os?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.venda?.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by tipo
      const matchesTipo = tipoFilter === 'todos' || log.tipo === tipoFilter;
      
      return matchesSearch && matchesTipo;
    });
  }, [logs, searchTerm, tipoFilter]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando histórico de movimentações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Histórico de Movimentações</h1>
          <p className="text-muted-foreground">Acompanhe todas as ações realizadas no sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            <Activity className="h-4 w-4 mr-2" />
            {logsFiltrados.length} registros
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por OS, cliente, responsável ou observação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-48">
              <Select value={tipoFilter} onValueChange={(value: TipoFilter) => setTipoFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tipoOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      {logsFiltrados.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhuma movimentação encontrada
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {logsFiltrados.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTipoBadge(log.tipo)}
                        <h3 className="text-lg font-semibold">
                          {log.venda?.numero_os || 'OS não encontrada'}
                        </h3>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Cliente: {log.venda?.cliente_nome || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Responsável: {log.usuario || 'Sistema'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(log.data_hora)}</span>
                          </div>
                        </div>
                        
                        {log.observacoes && (
                          <div className="flex items-start gap-2 mt-3">
                            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {log.observacoes}
                            </span>
                          </div>
                        )}
                        
                        {/* Show additional data if available */}
                        {(log.dados_anteriores || log.dados_novos) && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              Detalhes da Alteração:
                            </p>
                            {log.dados_anteriores && (
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Antes:</span> {JSON.stringify(log.dados_anteriores, null, 2)}
                              </div>
                            )}
                            {log.dados_novos && (
                              <div className="text-xs text-muted-foreground mt-1">
                                <span className="font-medium">Depois:</span> {JSON.stringify(log.dados_novos, null, 2)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoricoMovimentacoes;