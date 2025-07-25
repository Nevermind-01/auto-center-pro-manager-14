import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  useProdutos, 
  useClientes, 
  useClienteMutations,
  useServicos, 
  useServicoMutations,
  useVendaMutations
} from "@/hooks/useSupabaseQueries";
import { useSupabaseEstoque, ProdutoComCategoria } from "@/lib/supabaseEstoque";
import { 
  Plus, 
  Search, 
  Users,
  DollarSign,
  Calendar,
  User,
  ShoppingCart,
  Settings,
  Upload,
  X,
  FileText,
  Package,
  AlertTriangle
} from "lucide-react";

// Interfaces
interface ProdutoSelecionado {
  id: string;
  nome: string;
  marca?: string | null;
  valor: number;
  quantidade: number;
}

interface ServicoSelecionado {
  id?: string;
  nome: string;
  descricao?: string;
  valor: number;
}

const NovaOSSupabase = () => {
  const { toast } = useToast();
  
  // Queries
  const { data: produtosDisponiveis = [], isLoading: loadingProdutos } = useProdutos();
  const { data: clientesDisponiveis = [], isLoading: loadingClientes } = useClientes();
  const { data: servicosDisponiveis = [], isLoading: loadingServicos } = useServicos();
  
  // Mutations
  const { createCliente } = useClienteMutations();
  const { createServico } = useServicoMutations();
  const { createVenda, createVendaProduto, createVendaServico } = useVendaMutations();
  
  // Estoque
  const estoqueManager = useSupabaseEstoque();
  
  // Estados
  const [searchClienteTerm, setSearchClienteTerm] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showAllClientes, setShowAllClientes] = useState(false);
  const [searchProdutoTerm, setSearchProdutoTerm] = useState("");
  const [novoCliente, setNovoCliente] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    email: "",
    cpf: "",
    cnpj: "",
    rg: "",
    rua: "",
    numero_residencia: "",
    bairro: "",
    cidade: "",
    estado: ""
  });

  // Produtos e Serviços
  const [produtosSelecionados, setProdutosSelecionados] = useState<ProdutoSelecionado[]>([]);
  const [servicosSelecionados, setServicosSelecionados] = useState<ServicoSelecionado[]>([]);
  const [novoServico, setNovoServico] = useState({ nome: "", descricao: "", valor: 0 });

  // Pagamento e finalizacao
  const [desconto, setDesconto] = useState(0);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [parcelas, setParcelas] = useState(1);
  const [observacoes, setObservacoes] = useState("");
  const [numeroOS, setNumeroOS] = useState("");

  // Estado da modal de serviço
  const [showServicoModal, setShowServicoModal] = useState(false);

  // Gerar número da OS automaticamente
  useEffect(() => {
    const gerarNumeroOS = () => {
      const agora = new Date();
      const ano = agora.getFullYear();
      const mes = String(agora.getMonth() + 1).padStart(2, '0');
      const dia = String(agora.getDate()).padStart(2, '0');
      const hora = String(agora.getHours()).padStart(2, '0');
      const minuto = String(agora.getMinutes()).padStart(2, '0');
      
      return `OS${ano}${mes}${dia}${hora}${minuto}`;
    };

    setNumeroOS(gerarNumeroOS());
  }, []);

  // Filtrar clientes baseado na busca
  const clientesFiltrados = clientesDisponiveis.filter((cliente) =>
    cliente.nome.toLowerCase().includes(searchClienteTerm.toLowerCase()) ||
    cliente.telefone?.toLowerCase().includes(searchClienteTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchClienteTerm.toLowerCase())
  );

  // Filtrar produtos baseado na busca
  const produtosFiltrados = produtosDisponiveis.filter((produto) =>
    produto.nome.toLowerCase().includes(searchProdutoTerm.toLowerCase()) ||
    (produto.marca?.toLowerCase() || '').includes(searchProdutoTerm.toLowerCase()) ||
    (produto.codigo?.toLowerCase() || '').includes(searchProdutoTerm.toLowerCase())
  ).filter(produto => produto.status === 'ativo' && produto.quantidade > 0);

  // Calculos de valores
  const valorProdutos = produtosSelecionados.reduce((total, produto) => 
    total + (produto.valor * produto.quantidade), 0
  );
  
  const valorServicos = servicosSelecionados.reduce((total, servico) => 
    total + servico.valor, 0
  );
  
  const valorTotal = valorProdutos + valorServicos;
  const valorDesconto = (valorTotal * desconto) / 100;
  const valorFinal = valorTotal - valorDesconto;

  // Handlers
  const selecionarCliente = (cliente: any) => {
    setClienteSelecionado(cliente);
    setSearchClienteTerm("");
  };

  const adicionarNovoCliente = async () => {
    if (!novoCliente.nome || !novoCliente.telefone) {
      toast({
        title: "Erro",
        description: "Nome e telefone são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const cliente = await createCliente.mutateAsync(novoCliente);
      setClienteSelecionado(cliente);
      setNovoCliente({
        nome: "",
        telefone: "",
        endereco: "",
        email: "",
        cpf: "",
        cnpj: "",
        rg: "",
        rua: "",
        numero_residencia: "",
        bairro: "",
        cidade: "",
        estado: ""
      });
      setShowClienteModal(false);
      
      toast({
        title: "Cliente adicionado",
        description: `${cliente.nome} foi adicionado com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar cliente.",
        variant: "destructive",
      });
    }
  };

  const adicionarProduto = (produto: ProdutoComCategoria) => {
    const produtoExistente = produtosSelecionados.find(p => p.id === produto.id);
    
    if (produtoExistente) {
      // Verificar se há estoque suficiente
      if (produtoExistente.quantidade + 1 > produto.quantidade) {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${produto.quantidade} unidades disponíveis.`,
          variant: "destructive",
        });
        return;
      }
      
      setProdutosSelecionados(produtos =>
        produtos.map(p =>
          p.id === produto.id 
            ? { ...p, quantidade: p.quantidade + 1 }
            : p
        )
      );
    } else {
      const novoProduto: ProdutoSelecionado = {
        id: produto.id,
        nome: produto.nome,
        marca: produto.marca,
        valor: Number(produto.preco_venda),
        quantidade: 1
      };
      
      setProdutosSelecionados(produtos => [...produtos, novoProduto]);
    }
    
    setSearchProdutoTerm("");
  };

  const removerProduto = (produtoId: string) => {
    setProdutosSelecionados(produtos => produtos.filter(p => p.id !== produtoId));
  };

  const atualizarQuantidadeProduto = (produtoId: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerProduto(produtoId);
      return;
    }

    // Verificar estoque disponível
    const produtoEstoque = produtosDisponiveis.find(p => p.id === produtoId);
    if (produtoEstoque && novaQuantidade > produtoEstoque.quantidade) {
      toast({
        title: "Estoque insuficiente",
        description: `Apenas ${produtoEstoque.quantidade} unidades disponíveis.`,
        variant: "destructive",
      });
      return;
    }

    setProdutosSelecionados(produtos =>
      produtos.map(p =>
        p.id === produtoId 
          ? { ...p, quantidade: novaQuantidade }
          : p
      )
    );
  };

  const adicionarNovoServico = async () => {
    if (!novoServico.nome || novoServico.valor <= 0) {
      toast({
        title: "Erro",
        description: "Nome e valor são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const servico = await createServico.mutateAsync({
        nome: novoServico.nome,
        descricao: novoServico.descricao || null,
        preco: novoServico.valor
      });

      const servicoSelecionado: ServicoSelecionado = {
        id: servico.id,
        nome: servico.nome,
        descricao: servico.descricao || undefined,
        valor: Number(servico.preco)
      };

      setServicosSelecionados(servicos => [...servicos, servicoSelecionado]);
      setNovoServico({ nome: "", descricao: "", valor: 0 });
      setShowServicoModal(false);
      
      toast({
        title: "Serviço adicionado",
        description: `${servico.nome} foi adicionado à OS.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar serviço.",
        variant: "destructive",
      });
    }
  };

  const adicionarServicoExistente = (servico: any) => {
    const servicoExistente = servicosSelecionados.find(s => s.id === servico.id);
    
    if (!servicoExistente) {
      const servicoSelecionado: ServicoSelecionado = {
        id: servico.id,
        nome: servico.nome,
        descricao: servico.descricao,
        valor: Number(servico.preco)
      };
      
      setServicosSelecionados(servicos => [...servicos, servicoSelecionado]);
    }
  };

  const removerServico = (servicoId?: string, index?: number) => {
    if (servicoId) {
      setServicosSelecionados(servicos => servicos.filter(s => s.id !== servicoId));
    } else if (index !== undefined) {
      setServicosSelecionados(servicos => servicos.filter((_, i) => i !== index));
    }
  };

  const salvarOS = async () => {
    if (!clienteSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um cliente para salvar a OS.",
        variant: "destructive",
      });
      return;
    }

    if (produtosSelecionados.length === 0 && servicosSelecionados.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um produto ou serviço.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Criar a venda com status pendente
      const venda = await createVenda.mutateAsync({
        numero_os: numeroOS,
        cliente_id: clienteSelecionado.id,
        cliente_nome: clienteSelecionado.nome,
        valor_total: valorTotal,
        valor_desconto: valorDesconto,
        valor_final: valorFinal,
        forma_pagamento: formaPagamento as any || null,
        parcelas: formaPagamento === 'parcelado' ? parcelas : 1,
        observacoes: observacoes || null,
        status: 'pendente'
      });

      // Adicionar produtos da venda
      for (const produto of produtosSelecionados) {
        await createVendaProduto.mutateAsync({
          venda_id: venda.id,
          produto_id: produto.id,
          produto_nome: produto.nome,
          quantidade: produto.quantidade,
          preco_unitario: produto.valor,
          preco_total: produto.valor * produto.quantidade
        });
      }

      // Adicionar serviços da venda
      for (const servico of servicosSelecionados) {
        await createVendaServico.mutateAsync({
          venda_id: venda.id,
          servico_id: servico.id || null,
          servico_nome: servico.nome,
          preco: servico.valor
        });
      }

      toast({
        title: "OS salva",
        description: `OS ${numeroOS} foi salva com sucesso como pendente.`,
      });

      // Limpar formulário
      setClienteSelecionado(null);
      setProdutosSelecionados([]);
      setServicosSelecionados([]);
      setDesconto(0);
      setFormaPagamento("");
      setParcelas(1);
      setObservacoes("");
      
      // Gerar novo número de OS
      const agora = new Date();
      const ano = agora.getFullYear();
      const mes = String(agora.getMonth() + 1).padStart(2, '0');
      const dia = String(agora.getDate()).padStart(2, '0');
      const hora = String(agora.getHours()).padStart(2, '0');
      const minuto = String(agora.getMinutes()).padStart(2, '0');
      setNumeroOS(`OS${ano}${mes}${dia}${hora}${minuto}`);

    } catch (error) {
      console.error('Erro ao salvar OS:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar a OS. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const finalizarOS = async () => {
    if (!clienteSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um cliente para finalizar a OS.",
        variant: "destructive",
      });
      return;
    }

    if (!formaPagamento) {
      toast({
        title: "Erro", 
        description: "Selecione uma forma de pagamento.",
        variant: "destructive",
      });
      return;
    }

    if (produtosSelecionados.length === 0 && servicosSelecionados.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um produto ou serviço.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Criar a venda
      const venda = await createVenda.mutateAsync({
        numero_os: numeroOS,
        cliente_id: clienteSelecionado.id,
        cliente_nome: clienteSelecionado.nome,
        valor_total: valorTotal,
        valor_desconto: valorDesconto,
        valor_final: valorFinal,
        forma_pagamento: formaPagamento as any,
        parcelas: formaPagamento === 'parcelado' ? parcelas : 1,
        observacoes: observacoes || null,
        status: 'finalizada'
      });

      // Adicionar produtos da venda
      for (const produto of produtosSelecionados) {
        await createVendaProduto.mutateAsync({
          venda_id: venda.id,
          produto_id: produto.id,
          produto_nome: produto.nome,
          quantidade: produto.quantidade,
          preco_unitario: produto.valor,
          preco_total: produto.valor * produto.quantidade
        });
      }

      // Adicionar serviços da venda
      for (const servico of servicosSelecionados) {
        await createVendaServico.mutateAsync({
          venda_id: venda.id,
          servico_id: servico.id || null,
          servico_nome: servico.nome,
          preco: servico.valor
        });
      }

      // Dar baixa no estoque
      await estoqueManager.processarVenda(
        produtosSelecionados.map(p => ({
          id: p.id,
          nome: p.nome,
          marca: p.marca,
          valor: p.valor,
          quantidade: p.quantidade
        })),
        numeroOS
      );

      toast({
        title: "OS finalizada",
        description: `OS ${numeroOS} foi finalizada com sucesso.`,
      });

      // Limpar formulário
      setClienteSelecionado(null);
      setProdutosSelecionados([]);
      setServicosSelecionados([]);
      setDesconto(0);
      setFormaPagamento("");
      setParcelas(1);
      setObservacoes("");
      
      // Gerar novo número de OS
      const agora = new Date();
      const ano = agora.getFullYear();
      const mes = String(agora.getMonth() + 1).padStart(2, '0');
      const dia = String(agora.getDate()).padStart(2, '0');
      const hora = String(agora.getHours()).padStart(2, '0');
      const minuto = String(agora.getMinutes()).padStart(2, '0');
      setNumeroOS(`OS${ano}${mes}${dia}${hora}${minuto}`);

    } catch (error) {
      console.error('Erro ao finalizar OS:', error);
      toast({
        title: "Erro",
        description: "Erro ao finalizar a OS. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (loadingClientes || loadingProdutos || loadingServicos) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Ordem de Serviço</h1>
          <p className="text-muted-foreground">Crie uma nova OS para seus clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            {numeroOS}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Cliente
            </CardTitle>
            <CardDescription>Selecione ou cadastre um cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!clienteSelecionado ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar cliente..."
                    value={searchClienteTerm}
                    onChange={(e) => setSearchClienteTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {searchClienteTerm && (
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {clientesFiltrados.map((cliente) => (
                      <div
                        key={cliente.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                        onClick={() => selecionarCliente(cliente)}
                      >
                        <div className="font-medium">{cliente.nome}</div>
                        <div className="text-sm text-gray-600">{cliente.telefone}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Dialog open={showClienteModal} onOpenChange={setShowClienteModal}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Cliente
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
                        <DialogDescription>Adicione um novo cliente ao sistema</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="nome">Nome *</Label>
                            <Input
                              id="nome"
                              value={novoCliente.nome}
                              onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                              placeholder="Nome completo"
                            />
                          </div>
                          <div>
                            <Label htmlFor="telefone">Telefone</Label>
                            <Input
                              id="telefone"
                              value={novoCliente.telefone}
                              onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
                              placeholder="(11) 99999-9999"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                              id="email"
                              type="email"
                              value={novoCliente.email}
                              onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
                              placeholder="email@exemplo.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="cpf">CPF</Label>
                            <Input
                              id="cpf"
                              value={novoCliente.cpf || ''}
                              onChange={(e) => setNovoCliente({ ...novoCliente, cpf: e.target.value })}
                              placeholder="000.000.000-00"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="cnpj">CNPJ</Label>
                            <Input
                              id="cnpj"
                              value={novoCliente.cnpj || ''}
                              onChange={(e) => setNovoCliente({ ...novoCliente, cnpj: e.target.value })}
                              placeholder="00.000.000/0000-00"
                            />
                          </div>
                          <div>
                            <Label htmlFor="rg">RG</Label>
                            <Input
                              id="rg"
                              value={novoCliente.rg || ''}
                              onChange={(e) => setNovoCliente({ ...novoCliente, rg: e.target.value })}
                              placeholder="00.000.000-0"
                            />
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <h3 className="text-lg font-semibold mb-3">Endereço</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="rua">Rua</Label>
                              <Input
                                id="rua"
                                value={novoCliente.rua || ''}
                                onChange={(e) => setNovoCliente({ ...novoCliente, rua: e.target.value })}
                                placeholder="Nome da rua"
                              />
                            </div>
                            <div>
                              <Label htmlFor="numero_residencia">Número</Label>
                              <Input
                                id="numero_residencia"
                                value={novoCliente.numero_residencia || ''}
                                onChange={(e) => setNovoCliente({ ...novoCliente, numero_residencia: e.target.value })}
                                placeholder="Número da casa"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mt-4">
                            <div>
                              <Label htmlFor="bairro">Bairro</Label>
                              <Input
                                id="bairro"
                                value={novoCliente.bairro || ''}
                                onChange={(e) => setNovoCliente({ ...novoCliente, bairro: e.target.value })}
                                placeholder="Bairro"
                              />
                            </div>
                            <div>
                              <Label htmlFor="cidade">Cidade</Label>
                              <Input
                                id="cidade"
                                value={novoCliente.cidade || ''}
                                onChange={(e) => setNovoCliente({ ...novoCliente, cidade: e.target.value })}
                                placeholder="Cidade"
                              />
                            </div>
                            <div>
                              <Label htmlFor="estado">Estado</Label>
                              <Input
                                id="estado"
                                value={novoCliente.estado || ''}
                                onChange={(e) => setNovoCliente({ ...novoCliente, estado: e.target.value })}
                                placeholder="UF"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowClienteModal(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={adicionarNovoCliente}>
                          Adicionar Cliente
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showAllClientes} onOpenChange={setShowAllClientes}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Users className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Todos os Clientes</DialogTitle>
                        <DialogDescription>Selecione um cliente da lista</DialogDescription>
                      </DialogHeader>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {clientesDisponiveis.map((cliente) => (
                          <div
                            key={cliente.id}
                            className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                            onClick={() => {
                              selecionarCliente(cliente);
                              setShowAllClientes(false);
                            }}
                          >
                            <div className="font-medium">{cliente.nome}</div>
                            <div className="text-sm text-gray-600">{cliente.telefone}</div>
                            <div className="text-sm text-gray-600">{cliente.email}</div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </>
            ) : (
              <div className="p-4 border rounded-lg bg-green-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{clienteSelecionado.nome}</div>
                    <div className="text-sm text-gray-600">{clienteSelecionado.telefone}</div>
                    <div className="text-sm text-gray-600">{clienteSelecionado.email}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setClienteSelecionado(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coluna 2: Produtos e Serviços */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos e Serviços
            </CardTitle>
            <CardDescription>Adicione produtos e serviços à OS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Busca de produtos */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar produtos..."
                value={searchProdutoTerm}
                onChange={(e) => setSearchProdutoTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lista de produtos filtrados */}
            {searchProdutoTerm && (
              <div className="max-h-40 overflow-y-auto space-y-2">
                {produtosFiltrados.map((produto) => (
                  <div
                    key={produto.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                    onClick={() => adicionarProduto(produto)}
                  >
                    <div>
                      <div className="font-medium">{produto.nome}</div>
                      <div className="text-sm text-gray-600">
                        {produto.marca} - R$ {Number(produto.preco_venda).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">Estoque: {produto.quantidade}</div>
                    </div>
                    <Plus className="h-4 w-4" />
                  </div>
                ))}
              </div>
            )}

            {/* Produtos selecionados */}
            <div>
              <Label>Produtos Selecionados</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {produtosSelecionados.map((produto) => (
                  <div key={produto.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{produto.nome}</div>
                      <div className="text-xs text-gray-600">R$ {produto.valor.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={produto.quantidade}
                        onChange={(e) => atualizarQuantidadeProduto(produto.id, parseInt(e.target.value) || 0)}
                        className="w-16 h-8"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removerProduto(produto.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Serviços */}
            <div>
              <div className="flex items-center justify-between">
                <Label>Serviços</Label>
                <Dialog open={showServicoModal} onOpenChange={setShowServicoModal}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Novo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Serviço</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="servico-nome">Nome do Serviço</Label>
                        <Input
                          id="servico-nome"
                          value={novoServico.nome}
                          onChange={(e) => setNovoServico({ ...novoServico, nome: e.target.value })}
                          placeholder="Nome do serviço"
                        />
                      </div>
                      <div>
                        <Label htmlFor="servico-descricao">Descrição</Label>
                        <Textarea
                          id="servico-descricao"
                          value={novoServico.descricao}
                          onChange={(e) => setNovoServico({ ...novoServico, descricao: e.target.value })}
                          placeholder="Descrição do serviço"
                        />
                      </div>
                      <div>
                        <Label htmlFor="servico-valor">Valor</Label>
                        <Input
                          id="servico-valor"
                          type="number"
                          step="0.01"
                          value={novoServico.valor}
                          onChange={(e) => setNovoServico({ ...novoServico, valor: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowServicoModal(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={adicionarNovoServico}>
                        Adicionar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Serviços existentes */}
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {servicosDisponiveis.map((servico) => (
                  <div
                    key={servico.id}
                    className="p-2 border rounded cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                    onClick={() => adicionarServicoExistente(servico)}
                  >
                    <div>
                      <div className="font-medium text-sm">{servico.nome}</div>
                      <div className="text-xs text-gray-600">R$ {Number(servico.preco).toFixed(2)}</div>
                    </div>
                    <Plus className="h-4 w-4" />
                  </div>
                ))}
              </div>

              {/* Serviços selecionados */}
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {servicosSelecionados.map((servico, index) => (
                  <div key={servico.id || index} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">{servico.nome}</div>
                      <div className="text-xs text-gray-600">R$ {servico.valor.toFixed(2)}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removerServico(servico.id, index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coluna 3: Pagamento e Finalização */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pagamento e Finalização
            </CardTitle>
            <CardDescription>Configure os detalhes do pagamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumo de valores */}
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Produtos:</span>
                <span>R$ {valorProdutos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Serviços:</span>
                <span>R$ {valorServicos.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-medium">
                <span>Subtotal:</span>
                <span>R$ {valorTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <Label htmlFor="desconto" className="text-sm">Desconto (%):</Label>
                <Input
                  id="desconto"
                  type="number"
                  min="0"
                  max="100"
                  value={desconto}
                  onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                  className="w-20 h-8"
                />
              </div>
              {desconto > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Desconto:</span>
                  <span>- R$ {valorDesconto.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>R$ {valorFinal.toFixed(2)}</span>
              </div>
            </div>

            {/* Forma de pagamento */}
            <div>
              <Label htmlFor="forma-pagamento">Forma de Pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="parcelado">Parcelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Parcelas (se parcelado) */}
            {formaPagamento === "parcelado" && (
              <div>
                <Label htmlFor="parcelas">Número de Parcelas</Label>
                <Select value={parcelas.toString()} onValueChange={(value) => setParcelas(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6, 10, 12].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}x de R$ {(valorFinal / num).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Observações */}
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={salvarOS} className="flex-1">
                <FileText className="mr-2 h-4 w-4" />
                Salvar OS
              </Button>
              <Button 
                onClick={finalizarOS} 
                className="flex-1"
                disabled={!clienteSelecionado || !formaPagamento || (produtosSelecionados.length === 0 && servicosSelecionados.length === 0)}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Finalizar OS
              </Button>
            </div>

            {/* Alertas */}
            {produtosSelecionados.length === 0 && servicosSelecionados.length === 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4" />
                Adicione pelo menos um produto ou serviço
              </div>
            )}

            {!clienteSelecionado && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4" />
                Selecione um cliente para continuar
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NovaOSSupabase;