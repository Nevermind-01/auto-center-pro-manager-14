import { useState } from "react";
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
  FileText
} from "lucide-react";

// Interfaces
interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  endereco: string;
  telefone: string;
  email: string;
}

interface Produto {
  id: number;
  nome: string;
  marca: string;
  valor: number;
}

interface ProdutoSelecionado extends Produto {
  quantidade: number;
}

interface Servico {
  id: number;
  descricao: string;
  valor: number;
}

interface OS {
  id: number;
  numero: string;
  cliente: Cliente;
  produtos: Produto[];
  servicos: Servico[];
  valorTotal: number;
  desconto: number;
  valorFinal: number;
  formaPagamento: string;
  parcelas?: number;
  comprovanteCheque?: string;
  status: "Aberta" | "Em Andamento" | "Finalizada" | "Cancelada";
  data: string;
  registradoPor: string;
  observacoes: string;
}

const NovaOS = () => {
  const { toast } = useToast();
  
  // Estados
  const [searchClienteTerm, setSearchClienteTerm] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showAllClientes, setShowAllClientes] = useState(false);
  const [searchProdutoTerm, setSearchProdutoTerm] = useState("");
  const [novoCliente, setNovoCliente] = useState({
    nome: "",
    cpf: "",
    endereco: "",
    telefone: "",
    email: ""
  });

  // Produtos e Serviços
  const [produtosSelecionados, setProdutosSelecionados] = useState<ProdutoSelecionado[]>([]);
  const [servicosSelecionados, setServicosSelecionados] = useState<Servico[]>([]);
  const [novoServico, setNovoServico] = useState({ descricao: "", valor: 0 });

  // Forma de pagamento
  const [formaPagamento, setFormaPagamento] = useState("");
  const [parcelas, setParcelas] = useState(1);
  const [comprovanteCheque, setComprovanteCheque] = useState<File | null>(null);

  // Outros campos
  const [desconto, setDesconto] = useState(0);
  const [observacoes, setObservacoes] = useState("");

  // Dados mockados
  const [clientes] = useState<Cliente[]>([
    {
      id: 1,
      nome: "João Silva",
      cpf: "123.456.789-00",
      endereco: "Rua das Flores, 123 - Centro",
      telefone: "(11) 99999-0001",
      email: "joao@email.com"
    },
    {
      id: 2,
      nome: "Maria Santos",
      cpf: "987.654.321-00",
      endereco: "Av. Principal, 456 - Jardim América",
      telefone: "(11) 99999-0002",
      email: "maria@email.com"
    },
    {
      id: 3,
      nome: "Pedro Costa",
      cpf: "456.789.123-00",
      endereco: "Rua do Comércio, 789 - Vila Nova",
      telefone: "(11) 99999-0003",
      email: "pedro@email.com"
    }
  ]);

  const [produtos] = useState<Produto[]>([
    { id: 1, nome: "Óleo Motor", marca: "Mobil", valor: 45.90 },
    { id: 2, nome: "Filtro de Ar", marca: "Mann", valor: 25.50 },
    { id: 3, nome: "Filtro de Óleo", marca: "Bosch", valor: 18.75 },
    { id: 4, nome: "Pastilha de Freio", marca: "TRW", valor: 85.00 },
    { id: 5, nome: "Disco de Freio", marca: "Bendix", valor: 120.00 },
    { id: 6, nome: "Vela de Ignição", marca: "NGK", valor: 35.90 },
    { id: 7, nome: "Correia Dentada", marca: "Gates", valor: 95.75 },
    { id: 8, nome: "Bateria", marca: "Moura", valor: 280.00 }
  ]);

  // Funções
  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchClienteTerm.toLowerCase()) ||
    cliente.cpf.includes(searchClienteTerm.replace(/\D/g, ''))
  );

  const produtosFiltrados = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchProdutoTerm.toLowerCase()) ||
    produto.marca.toLowerCase().includes(searchProdutoTerm.toLowerCase())
  );

  const adicionarProduto = (produto: Produto) => {
    const produtoExistente = produtosSelecionados.find(p => p.id === produto.id);
    if (produtoExistente) {
      // Se o produto já existe, incrementa a quantidade
      setProdutosSelecionados(produtosSelecionados.map(p => 
        p.id === produto.id 
          ? { ...p, quantidade: (p.quantidade || 1) + 1 }
          : p
      ));
    } else {
      // Se é um produto novo, adiciona com quantidade 1
      setProdutosSelecionados([...produtosSelecionados, { ...produto, quantidade: 1 }]);
    }
  };

  const removerProduto = (produtoId: number) => {
    setProdutosSelecionados(produtosSelecionados.filter(p => p.id !== produtoId));
  };

  const adicionarServico = () => {
    if (novoServico.descricao && novoServico.valor > 0) {
      const servico: Servico = {
        id: Date.now(),
        descricao: novoServico.descricao,
        valor: novoServico.valor
      };
      setServicosSelecionados([...servicosSelecionados, servico]);
      setNovoServico({ descricao: "", valor: 0 });
    }
  };

  const removerServico = (servicoId: number) => {
    setServicosSelecionados(servicosSelecionados.filter(s => s.id !== servicoId));
  };

  const calcularTotal = () => {
    const totalProdutos = produtosSelecionados.reduce((total, produto) => total + (produto.valor * produto.quantidade), 0);
    const totalServicos = servicosSelecionados.reduce((total, servico) => total + servico.valor, 0);
    const total = totalProdutos + totalServicos;
    return {
      totalProdutos,
      totalServicos,
      total,
      totalComDesconto: total - desconto
    };
  };

  const cadastrarCliente = () => {
    if (!novoCliente.nome || !novoCliente.cpf) {
      toast({
        title: "Erro",
        description: "Nome e CPF são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const cliente: Cliente = {
      id: Date.now(),
      ...novoCliente
    };

    setClienteSelecionado(cliente);
    setShowClienteModal(false);
    setNovoCliente({
      nome: "",
      cpf: "",
      endereco: "",
      telefone: "",
      email: ""
    });

    toast({
      title: "Cliente cadastrado",
      description: "Cliente cadastrado com sucesso!",
    });
  };

  const finalizarOS = () => {
    if (!clienteSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um cliente.",
        variant: "destructive"
      });
      return;
    }

    if (!formaPagamento) {
      toast({
        title: "Erro",
        description: "Selecione uma forma de pagamento.",
        variant: "destructive"
      });
      return;
    }

    if (formaPagamento === "cheque" && !comprovanteCheque) {
      toast({
        title: "Erro",
        description: "Anexe o comprovante do cheque.",
        variant: "destructive"
      });
      return;
    }

    const total = calcularTotal();
    
    const novaOS: OS = {
      id: Date.now(),
      numero: `OS${String(Date.now()).slice(-6)}`,
      cliente: clienteSelecionado,
      produtos: produtosSelecionados,
      servicos: servicosSelecionados,
      valorTotal: total.total,
      desconto,
      valorFinal: total.totalComDesconto,
      formaPagamento,
      parcelas: formaPagamento === "cartao-credito" ? parcelas : undefined,
      comprovanteCheque: comprovanteCheque?.name,
      status: "Aberta",
      data: new Date().toISOString().split('T')[0],
      registradoPor: "Admin", // Aqui você colocaria o usuário logado
      observacoes
    };

    console.log("Nova OS:", novaOS);

    // Reset form
    setClienteSelecionado(null);
    setProdutosSelecionados([]);
    setServicosSelecionados([]);
    setFormaPagamento("");
    setParcelas(1);
    setComprovanteCheque(null);
    setDesconto(0);
    setObservacoes("");
    setSearchClienteTerm("");

    toast({
      title: "OS criada",
      description: `Ordem de Serviço ${novaOS.numero} criada com sucesso!`,
    });
  };

  const totais = calcularTotal();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">NOVA OS</h1>
          <p className="text-muted-foreground">Sistema de Ordem de Serviço</p>
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
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pesquisa Cliente */}
            <div className="space-y-2">
              <Label>Pesquisar Cliente (Nome ou CPF)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Digite nome ou CPF..."
                    value={searchClienteTerm}
                    onChange={(e) => setSearchClienteTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAllClientes(true)}
                  title="Ver todos os clientes"
                >
                  <Users className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Lista de clientes filtrados */}
            {searchClienteTerm && clientesFiltrados.length > 0 && (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {clientesFiltrados.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                    onClick={() => {
                      setClienteSelecionado(cliente);
                      setSearchClienteTerm("");
                    }}
                  >
                    <div className="font-medium">{cliente.nome}</div>
                    <div className="text-sm text-muted-foreground">{cliente.cpf}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Cliente selecionado */}
            {clienteSelecionado && (
              <Card className="bg-accent/50">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{clienteSelecionado.nome}</div>
                      <div className="text-sm text-muted-foreground">{clienteSelecionado.cpf}</div>
                      <div className="text-sm text-muted-foreground">{clienteSelecionado.endereco}</div>
                      <div className="text-sm text-muted-foreground">{clienteSelecionado.telefone}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setClienteSelecionado(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botão novo cliente */}
            <Dialog open={showClienteModal} onOpenChange={setShowClienteModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Cliente</DialogTitle>
                  <DialogDescription>
                    Cadastre um novo cliente no sistema
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={novoCliente.nome}
                      onChange={(e) => setNovoCliente({...novoCliente, nome: e.target.value})}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={novoCliente.cpf}
                      onChange={(e) => setNovoCliente({...novoCliente, cpf: e.target.value})}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={novoCliente.endereco}
                      onChange={(e) => setNovoCliente({...novoCliente, endereco: e.target.value})}
                      placeholder="Endereço completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={novoCliente.telefone}
                      onChange={(e) => setNovoCliente({...novoCliente, telefone: e.target.value})}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={novoCliente.email}
                      onChange={(e) => setNovoCliente({...novoCliente, email: e.target.value})}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <Button onClick={cadastrarCliente} className="w-full">
                    Cadastrar Cliente
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Modal Ver Todos Clientes */}
            <Dialog open={showAllClientes} onOpenChange={setShowAllClientes}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Todos os Clientes</DialogTitle>
                  <DialogDescription>
                    Selecione um cliente da lista
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {clientes.map((cliente) => (
                      <div
                        key={cliente.id}
                        className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => {
                          setClienteSelecionado(cliente);
                          setShowAllClientes(false);
                        }}
                      >
                        <div className="font-medium">{cliente.nome}</div>
                        <div className="text-sm text-muted-foreground">{cliente.cpf}</div>
                        <div className="text-sm text-muted-foreground">{cliente.endereco}</div>
                        <div className="text-sm text-muted-foreground">{cliente.telefone}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Coluna 2: Produtos e Serviços */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Produtos & Serviços
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Produtos */}
            <div className="space-y-2">
              <Label>Produtos Disponíveis</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos por nome ou marca..."
                    value={searchProdutoTerm}
                    onChange={(e) => setSearchProdutoTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {(searchProdutoTerm ? produtosFiltrados : produtos).map((produto) => (
                  <div
                    key={produto.id}
                    className="p-2 hover:bg-accent cursor-pointer border-b last:border-b-0 flex justify-between items-center"
                    onClick={() => adicionarProduto(produto)}
                  >
                    <div>
                      <div className="font-medium text-sm">{produto.nome}</div>
                      <div className="text-xs text-muted-foreground">{produto.marca}</div>
                    </div>
                    <div className="text-sm font-medium">R$ {produto.valor.toFixed(2)}</div>
                  </div>
                ))}
              </div>
              {searchProdutoTerm && produtosFiltrados.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-2 border rounded-md">
                  Nenhum produto encontrado
                </div>
              )}
            </div>

            {/* Produtos Selecionados */}
            <div className="space-y-2">
              <Label>Produtos Selecionados</Label>
              <div className="border rounded-md min-h-[100px] p-2">
                {produtosSelecionados.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Nenhum produto selecionado
                  </div>
                ) : (
                  <div className="space-y-2">
                     {produtosSelecionados.map((produto) => (
                       <div key={produto.id} className="flex justify-between items-center bg-accent/50 p-2 rounded">
                         <div className="flex-1">
                           <div className="font-medium text-sm">{produto.nome}</div>
                           <div className="text-xs text-muted-foreground">
                             {produto.marca} - R$ {produto.valor.toFixed(2)} cada
                           </div>
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="flex items-center gap-1 bg-background border rounded px-2 py-1">
                             <Button
                               variant="ghost"
                               size="sm"
                               className="h-6 w-6 p-0"
                               onClick={() => {
                                 if (produto.quantidade > 1) {
                                   setProdutosSelecionados(produtosSelecionados.map(p => 
                                     p.id === produto.id 
                                       ? { ...p, quantidade: p.quantidade - 1 }
                                       : p
                                   ));
                                 }
                               }}
                               disabled={produto.quantidade <= 1}
                             >
                               -
                             </Button>
                             <span className="text-sm font-medium w-8 text-center">{produto.quantidade}</span>
                             <Button
                               variant="ghost"
                               size="sm"
                               className="h-6 w-6 p-0"
                               onClick={() => {
                                 setProdutosSelecionados(produtosSelecionados.map(p => 
                                   p.id === produto.id 
                                     ? { ...p, quantidade: p.quantidade + 1 }
                                     : p
                                 ));
                               }}
                             >
                               +
                             </Button>
                           </div>
                           <Button
                             variant="ghost"
                             size="sm"
                             className="h-6 w-6 p-0"
                             onClick={() => removerProduto(produto.id)}
                           >
                             <X className="h-4 w-4" />
                           </Button>
                         </div>
                       </div>
                     ))}
                  </div>
                )}
              </div>
              <div className="bg-muted p-2 rounded text-sm">
                <strong>Total Produtos: R$ {totais.totalProdutos.toFixed(2)}</strong>
              </div>
            </div>

            {/* Serviços */}
            <Separator />
            <div className="space-y-2">
              <Label>Adicionar Serviços</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Descrição do serviço"
                  value={novoServico.descricao}
                  onChange={(e) => setNovoServico({...novoServico, descricao: e.target.value})}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Valor"
                  value={novoServico.valor || ""}
                  onChange={(e) => setNovoServico({...novoServico, valor: parseFloat(e.target.value) || 0})}
                  className="w-24"
                />
                <Button onClick={adicionarServico} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Serviços Adicionados */}
            <div className="space-y-2">
              <Label>Serviços Adicionados</Label>
              <div className="space-y-2">
                {servicosSelecionados.map((servico) => (
                  <div key={servico.id} className="flex justify-between items-center bg-accent/50 p-2 rounded">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{servico.descricao}</div>
                      <div className="text-xs text-muted-foreground">R$ {servico.valor.toFixed(2)}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removerServico(servico.id)}
                    >
                      <X className="h-4 w-4" />
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
              Pagamento & Finalização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumo de Valores */}
            <div className="bg-muted p-3 rounded space-y-1">
              <div className="flex justify-between text-sm">
                <span>Produtos:</span>
                <span>R$ {totais.totalProdutos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Serviços:</span>
                <span>R$ {totais.totalServicos.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>R$ {totais.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Desconto:</span>
                <span>- R$ {desconto.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total Final:</span>
                <span>R$ {totais.totalComDesconto.toFixed(2)}</span>
              </div>
            </div>

            {/* Desconto */}
            <div className="space-y-2">
              <Label htmlFor="desconto">Desconto (R$)</Label>
              <Input
                id="desconto"
                type="number"
                step="0.01"
                value={desconto || ""}
                onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            {/* Forma de Pagamento */}
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cartao-debito">Cartão de Débito</SelectItem>
                  <SelectItem value="cartao-credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Parcelas para cartão de crédito */}
            {formaPagamento === "cartao-credito" && (
              <div className="space-y-2">
                <Label>Parcelas (até 24x)</Label>
                <Select value={parcelas.toString()} onValueChange={(value) => setParcelas(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}x de R$ {(totais.totalComDesconto / num).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Upload do cheque */}
            {formaPagamento === "cheque" && (
              <div className="space-y-2">
                <Label>Comprovação do Cheque</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setComprovanteCheque(e.target.files?.[0] || null)}
                    className="hidden"
                    id="cheque-upload"
                  />
                  <label htmlFor="cheque-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      {comprovanteCheque ? comprovanteCheque.name : "Clique para adicionar foto"}
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>

            {/* Registrado por */}
            <div className="bg-muted/50 p-2 rounded text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Registrado por: <strong>Admin</strong></span>
              </div>
            </div>

            {/* Botão Finalizar */}
            <Button 
              onClick={finalizarOS} 
              className="w-full"
              disabled={!clienteSelecionado || !formaPagamento}
            >
              Finalizar OS
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NovaOS;