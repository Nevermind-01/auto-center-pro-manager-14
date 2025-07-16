import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Filter,
  DollarSign,
  Calendar,
  User,
  ShoppingCart,
  Edit,
  Trash2,
  Eye
} from "lucide-react";

interface Sale {
  id: number;
  cliente: string;
  mecanico: string;
  servicos: string[];
  produtos: string[];
  valorTotal: number;
  desconto: number;
  valorFinal: number;
  formaPagamento: string;
  status: "Pago" | "Pendente" | "Cancelado";
  data: string;
  observacoes: string;
}

interface SaleFormData {
  cliente: string;
  mecanico: string;
  servicos: string;
  produtos: string;
  produtoSelecionado: string;
  valorServicos: string;
  valorProdutos: string;
  desconto: string;
  formaPagamento: string;
  observacoes: string;
}

const Sales = () => {
  const { toast } = useToast();
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Estado do formulário
  const [formData, setFormData] = useState<SaleFormData>({
    cliente: "",
    mecanico: "",
    servicos: "",
    produtos: "",
    produtoSelecionado: "",
    valorServicos: "",
    valorProdutos: "",
    desconto: "",
    formaPagamento: "",
    observacoes: ""
  });

  // Estado para produtos do estoque (mockado)
  const [produtosEstoque] = useState([
    "Óleo 5W30",
    "Filtro de Ar",
    "Filtro de Óleo",
    "Pneu 195/65R15",
    "Pastilha de Freio",
    "Disco de Freio",
    "Bateria 60Ah",
    "Vela de Ignição",
    "Correia Dentada",
    "Amortecedor Dianteiro"
  ]);

  const [produtosFiltrados, setProdutosFiltrados] = useState<string[]>([]);
  const [showProdutosSuggestions, setShowProdutosSuggestions] = useState(false);

  // Dados mockados - substituir por dados reais
  const [sales, setSales] = useState<Sale[]>([
    {
      id: 1,
      cliente: "João Silva",
      mecanico: "Carlos Mendes",
      servicos: ["Troca de Óleo", "Filtro de Ar"],
      produtos: ["Óleo 5W30", "Filtro de Ar"],
      valorTotal: 185.00,
      desconto: 10.00,
      valorFinal: 175.00,
      formaPagamento: "Cartão",
      status: "Pago",
      data: "2024-07-15",
      observacoes: "Cliente fidelizado"
    },
    {
      id: 2,
      cliente: "Maria Santos",
      mecanico: "Roberto Silva",
      servicos: ["Alinhamento", "Balanceamento"],
      produtos: ["Pesos de Roda"],
      valorTotal: 150.00,
      desconto: 0.00,
      valorFinal: 150.00,
      formaPagamento: "PIX",
      status: "Pendente",
      data: "2024-07-14",
      observacoes: ""
    },
    {
      id: 3,
      cliente: "Pedro Costa",
      mecanico: "Carlos Mendes",
      servicos: ["Revisão Completa"],
      produtos: ["Óleo 5W30", "Filtro de Óleo", "Filtro de Ar"],
      valorTotal: 320.00,
      desconto: 20.00,
      valorFinal: 300.00,
      formaPagamento: "Dinheiro",
      status: "Pago",
      data: "2024-07-13",
      observacoes: "Desconto por indicação"
    }
  ]);

  const estatisticas = {
    totalVendasMes: sales.reduce((total, sale) => total + sale.valorFinal, 0),
    totalVendas: sales.length,
    ticketMedio: sales.length > 0 ? sales.reduce((total, sale) => total + sale.valorFinal, 0) / sales.length : 0,
    vendasPendentes: sales.filter(sale => sale.status === "Pendente").length
  };

  const handleInputChange = (field: keyof SaleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Filtrar produtos quando o usuário digita
    if (field === "produtoSelecionado") {
      const filtered = produtosEstoque.filter(produto => 
        produto.toLowerCase().includes(value.toLowerCase())
      );
      setProdutosFiltrados(filtered);
      setShowProdutosSuggestions(value.length > 0 && filtered.length > 0);
    }
  };

  const adicionarProduto = (produto: string) => {
    const produtosAtuais = formData.produtos ? formData.produtos.split(", ").filter(p => p.trim()) : [];
    if (!produtosAtuais.includes(produto)) {
      const novosProdutos = [...produtosAtuais, produto].join(", ");
      setFormData(prev => ({ ...prev, produtos: novosProdutos }));
    }
    setFormData(prev => ({ ...prev, produtoSelecionado: "" }));
    setShowProdutosSuggestions(false);
  };

  const calculateTotal = () => {
    const valorServicos = parseFloat(formData.valorServicos) || 0;
    const valorProdutos = parseFloat(formData.valorProdutos) || 0;
    const desconto = parseFloat(formData.desconto) || 0;
    const total = valorServicos + valorProdutos;
    return { total, final: total - desconto };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cliente || !formData.mecanico || !formData.formaPagamento) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios (Cliente, Mecânico e Forma de Pagamento).",
        variant: "destructive"
      });
      return;
    }

    const { total, final } = calculateTotal();
    
    const newSale: Sale = {
      id: sales.length + 1,
      cliente: formData.cliente,
      mecanico: formData.mecanico,
      servicos: formData.servicos.split(",").map(s => s.trim()).filter(s => s),
      produtos: formData.produtos.split(",").map(p => p.trim()).filter(p => p),
      valorTotal: total,
      desconto: parseFloat(formData.desconto) || 0,
      valorFinal: final,
      formaPagamento: formData.formaPagamento,
      status: "Pago",
      data: new Date().toISOString().split('T')[0],
      observacoes: formData.observacoes
    };

    setSales([newSale, ...sales]);
    setFormData({
      cliente: "",
      mecanico: "",
      servicos: "",
      produtos: "",
      produtoSelecionado: "",
      valorServicos: "",
      valorProdutos: "",
      desconto: "",
      formaPagamento: "",
      observacoes: ""
    });
    setIsNewSaleModalOpen(false);
    
    toast({
      title: "OS registrada",
      description: "Ordem de Serviço cadastrada com sucesso!",
    });
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.servicos.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pago": return "default";
      case "Pendente": return "secondary";
      case "Cancelado": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ordens de Serviço</h1>
          <p className="text-muted-foreground">Gerencie suas ordens de serviço e vendas</p>
        </div>
        <Button onClick={() => setIsNewSaleModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova OS
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-card shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {estatisticas.totalVendasMes.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {estatisticas.totalVendas} vendas realizadas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {estatisticas.ticketMedio.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Valor médio por venda
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalVendas}</div>
            <p className="text-xs text-muted-foreground">
              Vendas no período
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <User className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{estatisticas.vendasPendentes}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando pagamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modal/Formulário Nova Venda */}
      {isNewSaleModalOpen && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nova Ordem de Serviço</CardTitle>
            <CardDescription>Registre uma nova ordem de serviço</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente *</Label>
                  <Input
                    id="cliente"
                    value={formData.cliente}
                    onChange={(e) => handleInputChange("cliente", e.target.value)}
                    placeholder="Nome do cliente"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mecanico">Mecânico *</Label>
                  <Select value={formData.mecanico} onValueChange={(value) => handleInputChange("mecanico", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o mecânico" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Carlos Mendes">Carlos Mendes</SelectItem>
                      <SelectItem value="Roberto Silva">Roberto Silva</SelectItem>
                      <SelectItem value="Ana Costa">Ana Costa</SelectItem>
                      <SelectItem value="José Santos">José Santos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="formaPagamento">Forma de Pagamento *</Label>
                  <Select value={formData.formaPagamento} onValueChange={(value) => handleInputChange("formaPagamento", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Cartão">Cartão</SelectItem>
                      <SelectItem value="Transferência">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="servicos">Serviços</Label>
                  <Textarea
                    id="servicos"
                    value={formData.servicos}
                    onChange={(e) => handleInputChange("servicos", e.target.value)}
                    placeholder="Ex: Troca de óleo, Alinhamento (separar por vírgula)"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="produtos">Produtos</Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        id="produtoSelecionado"
                        value={formData.produtoSelecionado}
                        onChange={(e) => handleInputChange("produtoSelecionado", e.target.value)}
                        placeholder="Buscar produto do estoque..."
                        onFocus={() => {
                          if (formData.produtoSelecionado) {
                            const filtered = produtosEstoque.filter(produto => 
                              produto.toLowerCase().includes(formData.produtoSelecionado.toLowerCase())
                            );
                            setProdutosFiltrados(filtered);
                            setShowProdutosSuggestions(filtered.length > 0);
                          }
                        }}
                      />
                      {showProdutosSuggestions && (
                        <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {produtosFiltrados.map((produto, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 hover:bg-accent cursor-pointer"
                              onClick={() => adicionarProduto(produto)}
                            >
                              {produto}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Textarea
                      id="produtos"
                      value={formData.produtos}
                      onChange={(e) => handleInputChange("produtos", e.target.value)}
                      placeholder="Produtos selecionados aparecerão aqui..."
                      rows={2}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valorServicos">Valor Serviços (R$)</Label>
                  <Input
                    id="valorServicos"
                    type="number"
                    step="0.01"
                    value={formData.valorServicos}
                    onChange={(e) => handleInputChange("valorServicos", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valorProdutos">Valor Produtos (R$)</Label>
                  <Input
                    id="valorProdutos"
                    type="number"
                    step="0.01"
                    value={formData.valorProdutos}
                    onChange={(e) => handleInputChange("valorProdutos", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desconto">Desconto (R$)</Label>
                  <Input
                    id="desconto"
                    type="number"
                    step="0.01"
                    value={formData.desconto}
                    onChange={(e) => handleInputChange("desconto", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange("observacoes", e.target.value)}
                  placeholder="Observações adicionais..."
                  rows={2}
                />
              </div>

              {/* Resumo do valor */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span>Total:</span>
                    <span className="font-bold">R$ {calculateTotal().final.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsNewSaleModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Registrar OS
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Pago">Pago</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Vendas */}
      <div className="space-y-4">
        {filteredSales.map((sale) => (
          <Card key={sale.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{sale.cliente}</h3>
                    <Badge variant={getStatusColor(sale.status)}>
                      {sale.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <p><strong>Mecânico:</strong> {sale.mecanico}</p>
                      <p><strong>Serviços:</strong> {sale.servicos.join(", ") || "Nenhum"}</p>
                      <p><strong>Produtos:</strong> {sale.produtos.join(", ") || "Nenhum"}</p>
                    </div>
                    <div>
                      <p><strong>Pagamento:</strong> {sale.formaPagamento}</p>
                      <p><strong>Data:</strong> {new Date(sale.data).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {sale.observacoes && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Obs:</strong> {sale.observacoes}
                    </p>
                  )}
                </div>

                <div className="flex flex-col md:items-end space-y-2">
                  <div className="text-right">
                    {sale.desconto > 0 && (
                      <p className="text-sm text-muted-foreground line-through">
                        R$ {sale.valorTotal.toFixed(2)}
                      </p>
                    )}
                    <p className="text-2xl font-bold text-primary">
                      R$ {sale.valorFinal.toFixed(2)}
                    </p>
                    {sale.desconto > 0 && (
                      <p className="text-sm text-success">
                        Desconto: R$ {sale.desconto.toFixed(2)}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSales.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma venda encontrada.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Sales;