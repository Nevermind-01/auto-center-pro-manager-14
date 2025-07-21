import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Filter,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Edit,
  Trash2,
  ShoppingCart,
  BarChart3
} from "lucide-react";

// Interfaces para o sistema de estoque
export interface ProdutoEstoque {
  id: number;
  nome: string;
  marca: string;
  categoria: string;
  codigo: string;
  valorCompra: number;
  valorVenda: number;
  quantidadeAtual: number;
  quantidadeMinima: number;
  fornecedor: string;
  localizacao: string;
  dataUltimaEntrada: string;
  dataUltimaSaida?: string;
  status: "Ativo" | "Inativo" | "Descontinuado";
}

export interface MovimentacaoEstoque {
  id: number;
  produtoId: number;
  tipo: "Entrada" | "Saida" | "Ajuste";
  quantidade: number;
  motivo: string;
  valorUnitario: number;
  valorTotal: number;
  data: string;
  usuario: string;
  osNumero?: string; // Para rastrear vendas
}

export interface CategoriaEstoque {
  id: number;
  nome: string;
  descricao: string;
}

const Inventory = () => {
  const { toast } = useToast();
  
  // Estados principais
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [categorias, setCategorias] = useState<CategoriaEstoque[]>([]);
  
  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("all");
  const [statusFiltro, setStatusFiltro] = useState("all");
  
  // Estados para modais
  const [showNovoProdutoModal, setShowNovoProdutoModal] = useState(false);
  const [showMovimentacaoModal, setShowMovimentacaoModal] = useState(false);
  const [showNovaCategoria, setShowNovaCategoria] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoEstoque | null>(null);
  
  // Estados para formulários
  const [novoProduto, setNovoProduto] = useState({
    nome: "",
    marca: "",
    categoria: "",
    codigo: "",
    valorCompra: 0,
    valorVenda: 0,
    quantidadeAtual: 0,
    quantidadeMinima: 0,
    fornecedor: "",
    localizacao: ""
  });
  
  const [novaMovimentacao, setNovaMovimentacao] = useState({
    tipo: "Entrada" as "Entrada" | "Saida" | "Ajuste",
    quantidade: 0,
    motivo: "",
    valorUnitario: 0
  });
  
  const [novaCategoriaNome, setNovaCategoriaNome] = useState("");
  const [novaCategoriaDescricao, setNovaCategoriaDescricao] = useState("");

  // Dados iniciais mockados
  useEffect(() => {
    // Categorias iniciais
    const categoriasIniciais: CategoriaEstoque[] = [
      { id: 1, nome: "Óleos e Lubrificantes", descricao: "Óleos de motor, câmbio e demais lubrificantes" },
      { id: 2, nome: "Filtros", descricao: "Filtros de ar, óleo, combustível e cabine" },
      { id: 3, nome: "Pneus", descricao: "Pneus de diversos tamanhos e marcas" },
      { id: 4, nome: "Freios", descricao: "Pastilhas, discos e componentes do sistema de freio" },
      { id: 5, nome: "Suspensão", descricao: "Amortecedores, molas e componentes da suspensão" },
      { id: 6, nome: "Sistema Elétrico", descricao: "Baterias, velas, cabos e componentes elétricos" }
    ];

    // Produtos iniciais
    const produtosIniciais: ProdutoEstoque[] = [
      {
        id: 1,
        nome: "Óleo Motor 5W30 Sintético",
        marca: "Castrol",
        categoria: "Óleos e Lubrificantes",
        codigo: "OL001",
        valorCompra: 25.00,
        valorVenda: 45.00,
        quantidadeAtual: 15,
        quantidadeMinima: 10,
        fornecedor: "Distribuidora XYZ",
        localizacao: "Prateleira A1",
        dataUltimaEntrada: "2024-07-15",
        status: "Ativo"
      },
      {
        id: 2,
        nome: "Filtro de Ar",
        marca: "Bosch",
        categoria: "Filtros",
        codigo: "FL001",
        valorCompra: 18.00,
        valorVenda: 35.00,
        quantidadeAtual: 8,
        quantidadeMinima: 15,
        fornecedor: "Auto Peças Sul",
        localizacao: "Prateleira B2",
        dataUltimaEntrada: "2024-07-10",
        dataUltimaSaida: "2024-07-18",
        status: "Ativo"
      },
      {
        id: 3,
        nome: "Pastilha de Freio Dianteira",
        marca: "TRW",
        categoria: "Freios",
        codigo: "FR001",
        valorCompra: 45.00,
        valorVenda: 85.00,
        quantidadeAtual: 3,
        quantidadeMinima: 8,
        fornecedor: "Freios & Cia",
        localizacao: "Prateleira C3",
        dataUltimaEntrada: "2024-07-05",
        dataUltimaSaida: "2024-07-19",
        status: "Ativo"
      },
      {
        id: 4,
        nome: "Bateria 60Ah",
        marca: "Moura",
        categoria: "Sistema Elétrico",
        codigo: "BT001",
        valorCompra: 180.00,
        valorVenda: 280.00,
        quantidadeAtual: 12,
        quantidadeMinima: 5,
        fornecedor: "Elétrica Central",
        localizacao: "Estoque Especial",
        dataUltimaEntrada: "2024-07-12",
        status: "Ativo"
      },
      {
        id: 5,
        nome: "Pneu 195/65R15",
        marca: "Pirelli",
        categoria: "Pneus",
        codigo: "PN001",
        valorCompra: 220.00,
        valorVenda: 350.00,
        quantidadeAtual: 20,
        quantidadeMinima: 8,
        fornecedor: "Pneus Brasil",
        localizacao: "Depósito Pneus",
        dataUltimaEntrada: "2024-07-08",
        status: "Ativo"
      }
    ];

    setCategorias(categoriasIniciais);
    setProdutos(produtosIniciais);
  }, []);

  // Função para calcular estatísticas
  const calcularEstatisticas = () => {
    const totalProdutos = produtos.length;
    const valorTotalEstoque = produtos.reduce((total, produto) => 
      total + (produto.quantidadeAtual * produto.valorCompra), 0
    );
    const produtosBaixoEstoque = produtos.filter(produto => 
      produto.quantidadeAtual <= produto.quantidadeMinima
    ).length;
    const produtosAtivos = produtos.filter(produto => produto.status === "Ativo").length;

    return {
      totalProdutos,
      valorTotalEstoque,
      produtosBaixoEstoque,
      produtosAtivos
    };
  };

  // Função para adicionar novo produto
  const adicionarProduto = () => {
    if (!novoProduto.nome || !novoProduto.categoria || !novoProduto.codigo) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const produto: ProdutoEstoque = {
      id: Date.now(),
      ...novoProduto,
      dataUltimaEntrada: new Date().toISOString().split('T')[0],
      status: "Ativo"
    };

    setProdutos([...produtos, produto]);
    
    // Registrar movimentação de entrada
    if (novoProduto.quantidadeAtual > 0) {
      const movimentacao: MovimentacaoEstoque = {
        id: Date.now(),
        produtoId: produto.id,
        tipo: "Entrada",
        quantidade: novoProduto.quantidadeAtual,
        motivo: "Estoque inicial",
        valorUnitario: novoProduto.valorCompra,
        valorTotal: novoProduto.quantidadeAtual * novoProduto.valorCompra,
        data: new Date().toISOString().split('T')[0],
        usuario: "Admin"
      };
      setMovimentacoes([...movimentacoes, movimentacao]);
    }

    setNovoProduto({
      nome: "",
      marca: "",
      categoria: "",
      codigo: "",
      valorCompra: 0,
      valorVenda: 0,
      quantidadeAtual: 0,
      quantidadeMinima: 0,
      fornecedor: "",
      localizacao: ""
    });
    setShowNovoProdutoModal(false);

    toast({
      title: "Produto adicionado",
      description: "Produto cadastrado com sucesso no estoque!",
    });
  };

  // Função para adicionar nova categoria
  const adicionarCategoria = () => {
    if (!novaCategoriaNome) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    const categoria: CategoriaEstoque = {
      id: Date.now(),
      nome: novaCategoriaNome,
      descricao: novaCategoriaDescricao
    };

    setCategorias([...categorias, categoria]);
    setNovaCategoriaNome("");
    setNovaCategoriaDescricao("");
    setShowNovaCategoria(false);

    toast({
      title: "Categoria adicionada",
      description: "Nova categoria criada com sucesso!",
    });
  };

  // Função para registrar movimentação
  const registrarMovimentacao = () => {
    if (!produtoSelecionado || !novaMovimentacao.quantidade || !novaMovimentacao.motivo) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos da movimentação.",
        variant: "destructive"
      });
      return;
    }

    const movimentacao: MovimentacaoEstoque = {
      id: Date.now(),
      produtoId: produtoSelecionado.id,
      ...novaMovimentacao,
      valorTotal: novaMovimentacao.quantidade * novaMovimentacao.valorUnitario,
      data: new Date().toISOString().split('T')[0],
      usuario: "Admin"
    };

    // Atualizar quantidade do produto
    const novaQuantidade = novaMovimentacao.tipo === "Entrada" 
      ? produtoSelecionado.quantidadeAtual + novaMovimentacao.quantidade
      : novaMovimentacao.tipo === "Saida"
      ? produtoSelecionado.quantidadeAtual - novaMovimentacao.quantidade
      : novaMovimentacao.quantidade; // Ajuste

    const produtosAtualizados = produtos.map(produto =>
      produto.id === produtoSelecionado.id
        ? { 
            ...produto, 
            quantidadeAtual: novaQuantidade,
            dataUltimaEntrada: novaMovimentacao.tipo === "Entrada" ? movimentacao.data : produto.dataUltimaEntrada,
            dataUltimaSaida: novaMovimentacao.tipo === "Saida" ? movimentacao.data : produto.dataUltimaSaida
          }
        : produto
    );

    setProdutos(produtosAtualizados);
    setMovimentacoes([...movimentacoes, movimentacao]);
    
    setNovaMovimentacao({
      tipo: "Entrada",
      quantidade: 0,
      motivo: "",
      valorUnitario: 0
    });
    setProdutoSelecionado(null);
    setShowMovimentacaoModal(false);

    toast({
      title: "Movimentação registrada",
      description: `${novaMovimentacao.tipo} de ${novaMovimentacao.quantidade} unidades registrada!`,
    });
  };

  // Função para dar baixa no estoque (usada nas vendas)
  const darBaixaEstoque = (produtoId: number, quantidade: number, osNumero: string) => {
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return false;

    if (produto.quantidadeAtual < quantidade) {
      toast({
        title: "Estoque insuficiente",
        description: `Produto ${produto.nome} possui apenas ${produto.quantidadeAtual} unidades em estoque.`,
        variant: "destructive"
      });
      return false;
    }

    // Registrar movimentação de saída
    const movimentacao: MovimentacaoEstoque = {
      id: Date.now(),
      produtoId: produto.id,
      tipo: "Saida",
      quantidade: quantidade,
      motivo: `Venda - OS ${osNumero}`,
      valorUnitario: produto.valorVenda,
      valorTotal: quantidade * produto.valorVenda,
      data: new Date().toISOString().split('T')[0],
      usuario: "Admin",
      osNumero: osNumero
    };

    // Atualizar produto
    const produtosAtualizados = produtos.map(p =>
      p.id === produtoId
        ? { 
            ...p, 
            quantidadeAtual: p.quantidadeAtual - quantidade,
            dataUltimaSaida: movimentacao.data
          }
        : p
    );

    setProdutos(produtosAtualizados);
    setMovimentacoes([...movimentacoes, movimentacao]);

    return true;
  };

  // Filtrar produtos
  const produtosFiltrados = produtos.filter(produto => {
    const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produto.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produto.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = categoriaFiltro === "all" || produto.categoria === categoriaFiltro;
    const matchesStatus = statusFiltro === "all" || produto.status === statusFiltro;
    
    return matchesSearch && matchesCategoria && matchesStatus;
  });

  const estatisticas = calcularEstatisticas();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Estoque</h1>
          <p className="text-muted-foreground">Controle completo do seu estoque</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showNovaCategoria} onOpenChange={setShowNovaCategoria}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Categoria</DialogTitle>
                <DialogDescription>
                  Adicione uma nova categoria de produtos
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeCategoria">Nome da Categoria</Label>
                  <Input
                    id="nomeCategoria"
                    value={novaCategoriaNome}
                    onChange={(e) => setNovaCategoriaNome(e.target.value)}
                    placeholder="Ex: Óleos e Lubrificantes"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricaoCategoria">Descrição</Label>
                  <Textarea
                    id="descricaoCategoria"
                    value={novaCategoriaDescricao}
                    onChange={(e) => setNovaCategoriaDescricao(e.target.value)}
                    placeholder="Descrição da categoria..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNovaCategoria(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={adicionarCategoria}>
                    Adicionar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showNovoProdutoModal} onOpenChange={setShowNovoProdutoModal}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Produto</DialogTitle>
                <DialogDescription>
                  Adicione um novo produto ao estoque
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Produto *</Label>
                  <Input
                    id="nome"
                    value={novoProduto.nome}
                    onChange={(e) => setNovoProduto({...novoProduto, nome: e.target.value})}
                    placeholder="Ex: Óleo Motor 5W30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marca">Marca</Label>
                  <Input
                    id="marca"
                    value={novoProduto.marca}
                    onChange={(e) => setNovoProduto({...novoProduto, marca: e.target.value})}
                    placeholder="Ex: Castrol"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select value={novoProduto.categoria} onValueChange={(value) => setNovoProduto({...novoProduto, categoria: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.nome}>
                          {categoria.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código *</Label>
                  <Input
                    id="codigo"
                    value={novoProduto.codigo}
                    onChange={(e) => setNovoProduto({...novoProduto, codigo: e.target.value})}
                    placeholder="Ex: OL001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valorCompra">Valor de Compra</Label>
                  <Input
                    id="valorCompra"
                    type="number"
                    step="0.01"
                    value={novoProduto.valorCompra}
                    onChange={(e) => setNovoProduto({...novoProduto, valorCompra: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valorVenda">Valor de Venda</Label>
                  <Input
                    id="valorVenda"
                    type="number"
                    step="0.01"
                    value={novoProduto.valorVenda}
                    onChange={(e) => setNovoProduto({...novoProduto, valorVenda: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantidadeAtual">Quantidade Inicial</Label>
                  <Input
                    id="quantidadeAtual"
                    type="number"
                    value={novoProduto.quantidadeAtual}
                    onChange={(e) => setNovoProduto({...novoProduto, quantidadeAtual: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantidadeMinima">Quantidade Mínima</Label>
                  <Input
                    id="quantidadeMinima"
                    type="number"
                    value={novoProduto.quantidadeMinima}
                    onChange={(e) => setNovoProduto({...novoProduto, quantidadeMinima: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fornecedor">Fornecedor</Label>
                  <Input
                    id="fornecedor"
                    value={novoProduto.fornecedor}
                    onChange={(e) => setNovoProduto({...novoProduto, fornecedor: e.target.value})}
                    placeholder="Nome do fornecedor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="localizacao">Localização</Label>
                  <Input
                    id="localizacao"
                    value={novoProduto.localizacao}
                    onChange={(e) => setNovoProduto({...novoProduto, localizacao: e.target.value})}
                    placeholder="Ex: Prateleira A1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowNovoProdutoModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={adicionarProduto}>
                  Adicionar Produto
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-card shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalProdutos}</div>
            <p className="text-xs text-muted-foreground">
              {estatisticas.produtosAtivos} ativos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor do Estoque</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {estatisticas.valorTotalEstoque.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Valor total investido
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{estatisticas.produtosBaixoEstoque}</div>
            <p className="text-xs text-muted-foreground">
              Produtos abaixo do mínimo
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimentações Hoje</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {movimentacoes.filter(m => m.data === new Date().toISOString().split('T')[0]).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Entradas e saídas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar Produto</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome, marca ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoriaFiltro">Categoria</Label>
              <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.nome}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="statusFiltro">Status</Label>
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Descontinuado">Descontinuado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle>Produtos em Estoque</CardTitle>
          <CardDescription>
            {produtosFiltrados.length} produtos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Valor Venda</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtosFiltrados.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{produto.nome}</div>
                        <div className="text-sm text-muted-foreground">{produto.marca}</div>
                      </div>
                    </TableCell>
                    <TableCell>{produto.categoria}</TableCell>
                    <TableCell className="font-mono">{produto.codigo}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className={produto.quantidadeAtual <= produto.quantidadeMinima ? "text-warning font-medium" : ""}>
                          {produto.quantidadeAtual}
                        </span>
                        {produto.quantidadeAtual <= produto.quantidadeMinima && (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Mín: {produto.quantidadeMinima}
                      </div>
                    </TableCell>
                    <TableCell>R$ {produto.valorVenda.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={produto.status === "Ativo" ? "default" : "secondary"}>
                        {produto.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setProdutoSelecionado(produto);
                            setNovaMovimentacao({
                              tipo: "Entrada",
                              quantidade: 0,
                              motivo: "",
                              valorUnitario: produto.valorCompra
                            });
                            setShowMovimentacaoModal(true);
                          }}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Movimentação */}
      <Dialog open={showMovimentacaoModal} onOpenChange={setShowMovimentacaoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Movimentação</DialogTitle>
            <DialogDescription>
              {produtoSelecionado && `Produto: ${produtoSelecionado.nome}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipoMovimentacao">Tipo de Movimentação</Label>
              <Select 
                value={novaMovimentacao.tipo} 
                onValueChange={(value: "Entrada" | "Saida" | "Ajuste") => 
                  setNovaMovimentacao({...novaMovimentacao, tipo: value})
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entrada">Entrada</SelectItem>
                  <SelectItem value="Saida">Saída</SelectItem>
                  <SelectItem value="Ajuste">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                value={novaMovimentacao.quantidade}
                onChange={(e) => setNovaMovimentacao({...novaMovimentacao, quantidade: parseInt(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valorUnitario">Valor Unitário</Label>
              <Input
                id="valorUnitario"
                type="number"
                step="0.01"
                value={novaMovimentacao.valorUnitario}
                onChange={(e) => setNovaMovimentacao({...novaMovimentacao, valorUnitario: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Textarea
                id="motivo"
                value={novaMovimentacao.motivo}
                onChange={(e) => setNovaMovimentacao({...novaMovimentacao, motivo: e.target.value})}
                placeholder="Descreva o motivo da movimentação..."
              />
            </div>
            {produtoSelecionado && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Estoque atual: {produtoSelecionado.quantidadeAtual} unidades</p>
                <p className="text-sm text-muted-foreground">
                  Novo estoque: {
                    novaMovimentacao.tipo === "Entrada" 
                      ? produtoSelecionado.quantidadeAtual + novaMovimentacao.quantidade
                      : novaMovimentacao.tipo === "Saida"
                      ? produtoSelecionado.quantidadeAtual - novaMovimentacao.quantidade
                      : novaMovimentacao.quantidade
                  } unidades
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMovimentacaoModal(false)}>
                Cancelar
              </Button>
              <Button onClick={registrarMovimentacao}>
                Registrar Movimentação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;

// Função para usar em outros componentes (exportação para integração)
export const useEstoque = () => {
  return {
    darBaixaEstoque: (produtoId: number, quantidade: number, osNumero: string) => {
      // Esta função será implementada de forma global
      console.log(`Baixa no estoque: ${quantidade} unidades do produto ${produtoId} para OS ${osNumero}`);
    }
  };
};