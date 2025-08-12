import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  useVendaMutations,
  useVeiculosByCliente,
  useVeiculoMutations,
  useLogMovimentacaoMutations,
  useVendas
} from "@/hooks/useSupabaseQueries";
import { useMecanicos } from "@/hooks/useMecanicos";
import { ComissaoConfirmModal } from "@/components/ComissaoConfirmModal";
import { ComissaoCalculatorModal } from "@/components/ComissaoCalculatorModal";
import { useSupabaseEstoque, ProdutoComCategoria } from "@/lib/supabaseEstoque";
import { supabase } from "@/integrations/supabase/client";
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
  AlertTriangle,
  Car,
  Edit,
  Truck,
  Wrench
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

// Função para normalizar texto (sem acentos)
const normalizeText = (text: string) => {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const NovaOSSupabase = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editingId = searchParams?.get('edit') || null;
  
  // Queries
  const { data: produtosDisponiveis = [], isLoading: loadingProdutos } = useProdutos();
  const { data: clientesDisponiveis = [], isLoading: loadingClientes } = useClientes();
  const { data: servicosDisponiveis = [], isLoading: loadingServicos } = useServicos();
  const { data: mecanicosDisponiveis = [] } = useMecanicos();
  const { data: vendas = [] } = useVendas();
  
  // Mutations
  const { createCliente } = useClienteMutations();
  const { createServico } = useServicoMutations();
  const { createVenda, createVendaProduto, createVendaServico, updateVenda, deleteVendaProdutos, deleteVendaServicos } = useVendaMutations();
  const { createVeiculo } = useVeiculoMutations();
  const { createLog } = useLogMovimentacaoMutations();
  
  // Estoque
  const estoqueManager = useSupabaseEstoque();
  
  // Estados
  const [searchClienteTerm, setSearchClienteTerm] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showAllClientes, setShowAllClientes] = useState(false);
  const [searchProdutoTerm, setSearchProdutoTerm] = useState("");
  
  // Estados para veículos
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<any>(null);
  const [showVeiculoModal, setShowVeiculoModal] = useState(false);
  const [mecanicoSelecionado, setMecanicoSelecionado] = useState<string>("");
  const [novoVeiculo, setNovoVeiculo] = useState({
    marca: "",
    modelo: "",
    placa: "",
    ano: "",
    observacoes: ""
  });

  // Estados para edição
  const [isEditing, setIsEditing] = useState(false);
  const [editingVenda, setEditingVenda] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [loadingEditData, setLoadingEditData] = useState(false);
  const [editDataLoaded, setEditDataLoaded] = useState(false);
  
  // Query dos veículos do cliente selecionado
  const { data: veiculosCliente = [] } = useVeiculosByCliente(clienteSelecionado?.id);
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
  const [editandoServico, setEditandoServico] = useState<ServicoSelecionado | null>(null);

  // Estados para comissão
  const [showComissaoConfirm, setShowComissaoConfirm] = useState(false);
  const [showComissaoCalculator, setShowComissaoCalculator] = useState(false);
  const [vendaIdForComissao, setVendaIdForComissao] = useState<string>("");
  
  // Estados para preservar valores durante cálculo de comissão
  const [valorServicosParaComissao, setValorServicosParaComissao] = useState<number>(0);
  const [valorTotalParaComissao, setValorTotalParaComissao] = useState<number>(0);

  // Função para gerar novo número de OS único
  const gerarNovoNumeroOS = async () => {
    let numeroValido = false;
    let novoNumero = "";
    let tentativas = 0;
    
    while (!numeroValido && tentativas < 100) {
      const agora = new Date();
      const ano = agora.getFullYear();
      const mes = String(agora.getMonth() + 1).padStart(2, '0');
      const dia = String(agora.getDate()).padStart(2, '0');
      const hora = String(agora.getHours()).padStart(2, '0');
      const minuto = String(agora.getMinutes()).padStart(2, '0');
      const segundo = String(agora.getSeconds()).padStart(2, '0');
      
      // Adicionar segundos se houver tentativas anteriores
      novoNumero = tentativas > 0 
        ? `OS${ano}${mes}${dia}${hora}${minuto}${segundo}${tentativas}`
        : `OS${ano}${mes}${dia}${hora}${minuto}`;
      
      // Verificar se o número já existe
      const { data: existeOS } = await supabase
        .from('vendas')
        .select('id')
        .eq('numero_os', novoNumero)
        .maybeSingle();
      
      if (!existeOS) {
        numeroValido = true;
      } else {
        tentativas++;
        // Aguardar 100ms antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    if (!numeroValido) {
      throw new Error("Não foi possível gerar um número de OS único");
    }
    
    return novoNumero;
  };

  // Gerar número da OS automaticamente
  useEffect(() => {
    if (!editingId && !isEditing && !numeroOS) {
      const inicializarNumeroOS = async () => {
        try {
          const novoNumero = await gerarNovoNumeroOS();
          setNumeroOS(novoNumero);
        } catch (error) {
          console.error('Erro ao gerar número inicial da OS:', error);
          // Fallback para número simples em caso de erro
          const agora = new Date();
          const ano = agora.getFullYear();
          const mes = String(agora.getMonth() + 1).padStart(2, '0');
          const dia = String(agora.getDate()).padStart(2, '0');
          const hora = String(agora.getHours()).padStart(2, '0');
          const minuto = String(agora.getMinutes()).padStart(2, '0');
          setNumeroOS(`OS${ano}${mes}${dia}${hora}${minuto}`);
        }
      };

      inicializarNumeroOS();
    }
  }, [editingId, isEditing, numeroOS]);

  // Carregar dados para edição - aguarda clientes carregarem primeiro
  useEffect(() => {
    const carregarDadosEdicao = async () => {
      // Só processa edição se:
      // 1. Tem editingId
      // 2. Dados ainda não foram carregados
      // 3. Clientes já foram carregados (evita condição de corrida)
      // 4. Vendas já foram carregadas
      if (editingId && !editDataLoaded && !loadingClientes && clientesDisponiveis.length > 0 && vendas.length > 0) {
        setLoadingEditData(true);
        const vendaParaEditar = vendas.find(v => v.id === editingId);
        
        if (vendaParaEditar) {
          setIsEditing(true);
          setEditingVenda(vendaParaEditar);
          setOriginalData(JSON.parse(JSON.stringify(vendaParaEditar))); // Deep copy
          
          // Preencher campos com dados existentes
          setNumeroOS(vendaParaEditar.numero_os);
          
          // Calcular desconto em porcentagem
          const descontoPercentual = vendaParaEditar.valor_total > 0 
            ? (vendaParaEditar.valor_desconto || 0) / vendaParaEditar.valor_total * 100
            : 0;
          setDesconto(descontoPercentual);
          
          setFormaPagamento(vendaParaEditar.forma_pagamento || '');
          setParcelas(vendaParaEditar.parcelas || 1);
          setObservacoes(vendaParaEditar.observacoes || '');
          
          // Buscar cliente - agora garantimos que a lista já está carregada
          const cliente = clientesDisponiveis.find(c => c.id === vendaParaEditar.cliente_id);
          if (cliente) {
            setClienteSelecionado(cliente);
          }
          
          // Carregar mecânico se houver
          if (vendaParaEditar.mecanico_id) {
            setMecanicoSelecionado(vendaParaEditar.mecanico_id);
          }
          
          setEditDataLoaded(true);
          
          // Feedback visual apenas quando tudo estiver pronto
          toast({
            title: "OS carregada",
            description: `OS ${vendaParaEditar.numero_os} carregada com sucesso para edição.`,
          });
        } else if (!loadingEditData) {
          toast({
            title: "Erro",
            description: "OS não encontrada.",
            variant: "destructive",
          });
        }
        
        setLoadingEditData(false);
      }
    };

    carregarDadosEdicao();
  }, [editingId, editDataLoaded, loadingClientes, clientesDisponiveis, vendas, loadingEditData, toast]);

  // Carregar produtos e serviços da venda em edição
  useEffect(() => {
    if (editingVenda && editingVenda.venda_produtos && editingVenda.venda_servicos && editDataLoaded) {
      // Carregar produtos
      const produtosSelecionados = editingVenda.venda_produtos.map((vp: any) => {
        // Buscar dados completos do produto para pegar a marca
        const produtoCompleto = produtosDisponiveis.find(p => p.id === vp.produto_id);
        return {
          id: vp.produto_id,
          nome: vp.produto_nome,
          marca: produtoCompleto?.marca || '', 
          valor: Number(vp.preco_unitario),
          quantidade: vp.quantidade
        };
      });
      setProdutosSelecionados(produtosSelecionados);
      
      // Carregar serviços
      const servicosSelecionados = editingVenda.venda_servicos.map((vs: any) => ({
        id: vs.servico_id,
        nome: vs.servico_nome,
        valor: Number(vs.preco)
      }));
      setServicosSelecionados(servicosSelecionados);
      
      // Carregar veículo se existir
      if (editingVenda.veiculo && Array.isArray(editingVenda.veiculo) && editingVenda.veiculo.length > 0) {
        setVeiculoSelecionado(editingVenda.veiculo[0]);
      } else if (editingVenda.veiculo && !Array.isArray(editingVenda.veiculo)) {
        setVeiculoSelecionado(editingVenda.veiculo);
      }
    }
  }, [editingVenda, editDataLoaded, produtosDisponiveis]);

  // Filtrar clientes baseado na busca
  const clientesFiltrados = clientesDisponiveis.filter((cliente) =>
    cliente.nome.toLowerCase().includes(searchClienteTerm.toLowerCase()) ||
    cliente.telefone?.toLowerCase().includes(searchClienteTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchClienteTerm.toLowerCase())
  );

  // Filtrar produtos baseado na busca (sem acento)
  const produtosFiltrados = produtosDisponiveis.filter((produto) => {
    const searchNormalized = normalizeText(searchProdutoTerm);
    return normalizeText(produto.nome).includes(searchNormalized) ||
           normalizeText(produto.marca || '').includes(searchNormalized) ||
           normalizeText(produto.codigo || '').includes(searchNormalized);
  }).filter(produto => produto.status === 'ativo' && produto.quantidade > 0);

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


  // Função para resetar formulário
  const resetarFormulario = async () => {
    setClienteSelecionado(null);
    setVeiculoSelecionado(null);
    setMecanicoSelecionado("");
    setProdutosSelecionados([]);
    setServicosSelecionados([]);
    setDesconto(0);
    setFormaPagamento("");
    setParcelas(1);
    setObservacoes("");
    setSearchClienteTerm("");
    setSearchProdutoTerm("");
    setIsEditing(false);
    setEditingVenda(null);
    setOriginalData(null);
    setEditDataLoaded(false);
    setLoadingEditData(false);
    
    // Gerar novo número de OS único
    try {
      const novoNumero = await gerarNovoNumeroOS();
      setNumeroOS(novoNumero);
    } catch (error) {
      console.error('Erro ao gerar novo número de OS:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar novo número de OS.",
        variant: "destructive",
      });
    }
  };

  // Reset quando sair do modo de edição
  useEffect(() => {
    if (!editingId && (isEditing || editDataLoaded)) {
      resetarFormulario();
    }
  }, [editingId, isEditing, editDataLoaded]);

  // Handlers
  const selecionarCliente = (cliente: any) => {
    setClienteSelecionado(cliente);
    setSearchClienteTerm("");
    setVeiculoSelecionado(null); // Reset veículo quando trocar cliente
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
      if (editandoServico) {
        // Editando serviço existente
        const servicoAtualizado: ServicoSelecionado = {
          ...editandoServico,
          nome: novoServico.nome,
          descricao: novoServico.descricao || undefined,
          valor: novoServico.valor
        };

        setServicosSelecionados(servicos => 
          servicos.map(s => 
            s === editandoServico ? servicoAtualizado : s
          )
        );

        setEditandoServico(null);
        toast({
          title: "Serviço atualizado",
          description: `${servicoAtualizado.nome} foi atualizado.`,
        });
      } else {
        // Adicionando novo serviço
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
        
        toast({
          title: "Serviço adicionado",
          description: `${servico.nome} foi adicionado à OS.`,
        });
      }

      setNovoServico({ nome: "", descricao: "", valor: 0 });
      setShowServicoModal(false);
      
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

  const editarServico = (servico: ServicoSelecionado) => {
    setEditandoServico(servico);
    setNovoServico({
      nome: servico.nome,
      descricao: servico.descricao || "",
      valor: servico.valor
    });
    setShowServicoModal(true);
  };

  // Handlers para veículos
  const adicionarNovoVeiculo = async () => {
    if (!novoVeiculo.marca || !novoVeiculo.modelo || !novoVeiculo.placa) {
      toast({
        title: "Erro",
        description: "Marca, modelo e placa são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!clienteSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um cliente primeiro.",
        variant: "destructive",
      });
      return;
    }

    try {
      const veiculo = await createVeiculo.mutateAsync({
        cliente_id: clienteSelecionado.id,
        marca: novoVeiculo.marca,
        modelo: novoVeiculo.modelo,
        placa: novoVeiculo.placa,
        ano: novoVeiculo.ano || null,
        observacoes: novoVeiculo.observacoes || null
      });

      setVeiculoSelecionado(veiculo);
      setNovoVeiculo({
        marca: "",
        modelo: "",
        placa: "",
        ano: "",
        observacoes: ""
      });
      setShowVeiculoModal(false);
      
      toast({
        title: "Veículo adicionado",
        description: `${veiculo.marca} ${veiculo.modelo} foi adicionado.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar veículo.",
        variant: "destructive",
      });
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
      if (isEditing && editingVenda) {
        // Deletar produtos e serviços antigos
        await deleteVendaProdutos.mutateAsync(editingVenda.id);
        await deleteVendaServicos.mutateAsync(editingVenda.id);

        // Atualizar venda existente
        const vendaAtualizada = await updateVenda.mutateAsync({
          id: editingVenda.id,
          cliente_id: clienteSelecionado.id,
          cliente_nome: clienteSelecionado.nome,
          veiculo_id: veiculoSelecionado?.id || null,
          mecanico_id: mecanicoSelecionado === "none" ? null : mecanicoSelecionado || null,
          valor_total: valorTotal,
          valor_desconto: valorDesconto,
          valor_final: valorFinal,
          forma_pagamento: (formaPagamento || 'dinheiro') as any,
          parcelas: formaPagamento === 'parcelado' ? parcelas : 1,
          observacoes: observacoes || null
        });

        // Adicionar produtos atualizados da venda
        for (const produto of produtosSelecionados) {
          await createVendaProduto.mutateAsync({
            venda_id: editingVenda.id,
            produto_id: produto.id,
            produto_nome: produto.nome,
            quantidade: produto.quantidade,
            preco_unitario: produto.valor,
            preco_total: produto.valor * produto.quantidade
          });
        }

        // Adicionar serviços atualizados da venda
        for (const servico of servicosSelecionados) {
          await createVendaServico.mutateAsync({
            venda_id: editingVenda.id,
            servico_id: servico.id || null,
            servico_nome: servico.nome,
            preco: servico.valor
          });
        }

        // Registrar log de edição
        await createLog.mutateAsync({
          os_id: editingVenda.id,
          tipo: 'edicao',
          usuario: 'Admin',
          observacoes: `OS ${numeroOS} editada`,
          dados_anteriores: originalData,
          dados_novos: vendaAtualizada
        });

        toast({
          title: "OS atualizada",
          description: `OS ${numeroOS} foi atualizada com sucesso.`,
        });

        // Voltar para histórico
        navigate('/history');
      } else {
        // Criar nova venda
        const venda = await createVenda.mutateAsync({
          numero_os: numeroOS,
          cliente_id: clienteSelecionado.id,
          cliente_nome: clienteSelecionado.nome,
          veiculo_id: veiculoSelecionado?.id || null,
          mecanico_id: mecanicoSelecionado === "none" ? null : mecanicoSelecionado || null,
          valor_total: valorTotal,
          valor_desconto: valorDesconto,
          valor_final: valorFinal,
          forma_pagamento: (formaPagamento || 'dinheiro') as any,
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

        // Registrar log de criação
        await createLog.mutateAsync({
          os_id: venda.id,
          tipo: 'criacao',
          usuario: 'Admin',
          observacoes: `OS ${numeroOS} criada como pendente`
        });

        toast({
          title: "OS salva",
          description: `OS ${numeroOS} foi salva com sucesso como pendente.`,
        });

        // Limpar formulário e gerar novo número de OS
        await resetarFormulario();
      }
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

    // Validações específicas para calcular comissão
    const temServicos = servicosSelecionados.length > 0;
    const temMecanico = mecanicoSelecionado && mecanicoSelecionado !== "none";
    
    if (temServicos && temMecanico && !isEditing) {
      // Validações adicionais para comissão
      if (!temServicos) {
        toast({
          title: "Erro",
          description: "É necessário ter pelo menos um serviço para calcular comissão.",
          variant: "destructive",
        });
        return;
      }

      // Abrir modal de confirmação de comissão
      setShowComissaoConfirm(true);
      return;
    }

    // Se não tem serviços ou mecânico, ou está editando, finalizar direto
    await processarFinalizacao();
  };

  const processarFinalizacao = async () => {
    try {
      let vendaId: string;

      if (isEditing && editingVenda) {
        // Modo edição - atualizar venda existente
        // Deletar produtos e serviços antigos
        await deleteVendaProdutos.mutateAsync(editingVenda.id);
        await deleteVendaServicos.mutateAsync(editingVenda.id);

        // Atualizar venda existente para finalizada
        const vendaAtualizada = await updateVenda.mutateAsync({
          id: editingVenda.id,
          cliente_id: clienteSelecionado.id,
          cliente_nome: clienteSelecionado.nome,
          veiculo_id: veiculoSelecionado?.id || null,
          valor_total: valorTotal,
          valor_desconto: valorDesconto,
          valor_final: valorFinal,
          forma_pagamento: formaPagamento as any,
          parcelas: formaPagamento === 'parcelado' ? parcelas : 1,
          observacoes: observacoes || null,
          status: 'finalizada'
        });

        vendaId = editingVenda.id;

        // Registrar log de edição
        await createLog.mutateAsync({
          os_id: editingVenda.id,
          tipo: 'edicao',
          usuario: 'Admin',
          observacoes: `OS ${numeroOS} editada`,
          dados_anteriores: originalData,
          dados_novos: vendaAtualizada
        });
      } else {
        // Modo criação - criar nova venda
        const venda = await createVenda.mutateAsync({
          numero_os: numeroOS,
          cliente_id: clienteSelecionado.id,
          cliente_nome: clienteSelecionado.nome,
          veiculo_id: veiculoSelecionado?.id || null,
          mecanico_id: mecanicoSelecionado === "none" ? null : mecanicoSelecionado || null,
          valor_total: valorTotal,
          valor_desconto: valorDesconto,
          valor_final: valorFinal,
          forma_pagamento: formaPagamento as any,
          parcelas: formaPagamento === 'parcelado' ? parcelas : 1,
          observacoes: observacoes || null,
          status: 'finalizada'
        });

        vendaId = venda.id;

        // Registrar log de criação
        await createLog.mutateAsync({
          os_id: venda.id,
          tipo: 'criacao',
          usuario: 'Admin',
          observacoes: `OS ${numeroOS} criada`
        });

        // Registrar log de finalização separadamente
        await createLog.mutateAsync({
          os_id: venda.id,
          tipo: 'finalizacao',
          usuario: 'Admin',
          observacoes: `OS ${numeroOS} finalizada`
        });
      }

      // Adicionar produtos da venda
      for (const produto of produtosSelecionados) {
        await createVendaProduto.mutateAsync({
          venda_id: vendaId,
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
          venda_id: vendaId,
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

      // Armazenar vendaId para comissão se necessário
      console.log("💾 Armazenando vendaId para comissão:", vendaId);
      setVendaIdForComissao(vendaId);

      toast({
        title: "OS finalizada",
        description: `OS ${numeroOS} foi finalizada com sucesso.`,
      });

      // Se não vai calcular comissão, fazer o reset/navegação normal
      // Não resetar aqui se estivermos no fluxo de comissão
      console.log("🔍 Verificando se deve resetar formulário. ShowComissaoCalculator:", showComissaoCalculator);
      if (!showComissaoCalculator && vendaIdForComissao === "") {
        if (isEditing) {
          // Se estava editando, voltar para o histórico
          navigate('/history');
        } else {
          // Se era nova OS, limpar formulário para criar outra
          resetarFormulario();
        }
      }

    } catch (error) {
      console.error('Erro ao finalizar OS:', error);
      toast({
        title: "Erro",
        description: "Erro ao finalizar a OS. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleComissaoConfirm = () => {
    console.log("🔄 Confirmando cálculo de comissão");
    setShowComissaoConfirm(false);
    
    // Validar mecânico obrigatório
    if (!mecanicoSelecionado || mecanicoSelecionado === "none") {
      toast({
        title: "Erro",
        description: "Selecione um mecânico para calcular comissão.",
        variant: "destructive",
      });
      return;
    }

    // Validar se há serviços
    if (servicosSelecionados.length === 0) {
      toast({
        title: "Erro",
        description: "É necessário ter pelo menos um serviço para calcular comissão.",
        variant: "destructive",
      });
      return;
    }

    // Preparar e abrir modal de comissão
    processarFinalizacaoComComissao();
  };

  const handleComissaoReject = () => {
    console.log("❌ Rejeitando cálculo de comissão");
    setShowComissaoConfirm(false);
    // Finalizar sem comissão
    processarFinalizacao();
  };

  const processarFinalizacaoComComissao = async () => {
    console.log("🚀 Preparando modal de comissão (finalização será atômica)");
    
    // Capturar valores para exibição no modal (apenas informativos)
    console.log("💰 Capturando valores informativos - Serviços:", valorServicos, "Total:", valorTotal);
    setValorServicosParaComissao(valorServicos);
    setValorTotalParaComissao(valorTotal);
    
    // Para edição, definir vendaId
    if (isEditing && editingVenda?.id) {
      setVendaIdForComissao(editingVenda.id);
    } else {
      // Para nova OS, deixar vazio - será criada atomicamente no modal
      setVendaIdForComissao("");
    }
    
    // Abrir modal de comissão para finalização atômica
    console.log("📋 Abrindo modal de comissão para finalização atômica");
    setShowComissaoCalculator(true);
  };

  const handleComissaoFinalized = () => {
    console.log("🎉 Comissão finalizada, fechando modal e resetando");
    setShowComissaoCalculator(false);
    setVendaIdForComissao("");
    
    // Limpar valores preservados para comissão
    setValorServicosParaComissao(0);
    setValorTotalParaComissao(0);
    
    // Resetar formulário se não estava editando
    if (!isEditing) {
      resetarFormulario();
    } else {
      navigate('/history');
    }
  };

  // Determinar estado de carregamento
  const isLoadingInitialData = loadingClientes || loadingProdutos || loadingServicos;
  const isWaitingForClientesToLoad = editingId && !editDataLoaded && loadingClientes;
  const isLoadingOSData = editingId && !editDataLoaded && !loadingClientes && loadingEditData;

  if (isLoadingInitialData || isWaitingForClientesToLoad || isLoadingOSData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg font-medium">
            {isWaitingForClientesToLoad 
              ? "Carregando clientes..." 
              : isLoadingOSData 
                ? "OS carregada..." 
                : "Carregando..."}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            {isWaitingForClientesToLoad 
              ? "Aguardando lista de clientes para carregar OS" 
              : isLoadingOSData 
                ? "Finalizando carregamento dos dados da OS" 
                : "Preparando sistema"}
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
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Edite uma OS existente" : "Crie uma nova OS para seus clientes"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <Badge variant="secondary" className="px-3 py-1">
              <Edit className="mr-1 h-3 w-3" />
              Editando
            </Badge>
          )}
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

        {/* Seção de Veículos */}
        {clienteSelecionado && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Veículo do Cliente
              </CardTitle>
              <CardDescription>Selecione o veículo para esta OS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {veiculosCliente.length > 0 ? (
                <div className="space-y-2">
                  <Label>Veículos Disponíveis</Label>
                  <Select 
                    value={veiculoSelecionado?.id || ""} 
                    onValueChange={(value) => {
                      const veiculo = veiculosCliente.find(v => v.id === value);
                      setVeiculoSelecionado(veiculo || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {veiculosCliente.map((veiculo) => (
                        <SelectItem key={veiculo.id} value={veiculo.id}>
                          {veiculo.marca} {veiculo.modelo} - {veiculo.placa} ({veiculo.ano})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {veiculoSelecionado && (
                    <div className="p-3 border rounded-lg bg-blue-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{veiculoSelecionado.marca} {veiculoSelecionado.modelo}</div>
                          <div className="text-sm text-gray-600">Placa: {veiculoSelecionado.placa}</div>
                          <div className="text-sm text-gray-600">Ano: {veiculoSelecionado.ano}</div>
                          {veiculoSelecionado.observacoes && (
                            <div className="text-sm text-gray-600">Obs: {veiculoSelecionado.observacoes}</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setVeiculoSelecionado(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Nenhum veículo cadastrado para este cliente
                </div>
              )}
              
              <Dialog open={showVeiculoModal} onOpenChange={setShowVeiculoModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Truck className="h-4 w-4 mr-2" />
                    Adicionar Novo Veículo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Veículo</DialogTitle>
                    <DialogDescription>
                      Cadastre um novo veículo para {clienteSelecionado.nome}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="marca">Marca *</Label>
                        <Input
                          id="marca"
                          value={novoVeiculo.marca}
                          onChange={(e) => setNovoVeiculo({...novoVeiculo, marca: e.target.value})}
                          placeholder="Ex: Toyota"
                        />
                      </div>
                      <div>
                        <Label htmlFor="modelo">Modelo *</Label>
                        <Input
                          id="modelo"
                          value={novoVeiculo.modelo}
                          onChange={(e) => setNovoVeiculo({...novoVeiculo, modelo: e.target.value})}
                          placeholder="Ex: Corolla"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="placa">Placa *</Label>
                        <Input
                          id="placa"
                          value={novoVeiculo.placa}
                          onChange={(e) => setNovoVeiculo({...novoVeiculo, placa: e.target.value})}
                          placeholder="Ex: ABC-1234"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ano">Ano</Label>
                        <Input
                          id="ano"
                          value={novoVeiculo.ano}
                          onChange={(e) => setNovoVeiculo({...novoVeiculo, ano: e.target.value})}
                          placeholder="Ex: 2015"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={novoVeiculo.observacoes}
                        onChange={(e) => setNovoVeiculo({...novoVeiculo, observacoes: e.target.value})}
                        placeholder="Observações sobre o veículo..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowVeiculoModal(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={adicionarNovoVeiculo}>
                      Adicionar Veículo
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}

        {/* Seção de Mecânico */}
        {clienteSelecionado && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Mecânico Responsável
              </CardTitle>
              <CardDescription>Selecione o mecânico responsável (opcional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mecânico (Opcional)</Label>
                <Select 
                  value={mecanicoSelecionado} 
                  onValueChange={setMecanicoSelecionado}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um mecânico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {mecanicosDisponiveis.map((mecanico) => (
                      <SelectItem key={mecanico.id} value={mecanico.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{mecanico.nome}</span>
                          {mecanico.especialidade && (
                            <span className="text-xs text-muted-foreground">{mecanico.especialidade}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {mecanicoSelecionado && (
                  <div className="p-3 border rounded-lg bg-green-50">
                    {(() => {
                      const mecanico = mecanicosDisponiveis.find(m => m.id === mecanicoSelecionado);
                      return mecanico ? (
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <Wrench className="h-4 w-4" />
                            {mecanico.nome}
                          </div>
                          {mecanico.especialidade && (
                            <div className="text-sm text-gray-600">
                              Especialidade: {mecanico.especialidade}
                            </div>
                          )}
                          {mecanico.telefone && (
                            <div className="text-sm text-gray-600">
                              Telefone: {mecanico.telefone}
                            </div>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Serviços Disponíveis</Label>
                <Dialog open={showServicoModal} onOpenChange={(open) => {
                  setShowServicoModal(open);
                  if (!open) {
                    setEditandoServico(null);
                    setNovoServico({ nome: "", descricao: "", valor: 0 });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Novo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editandoServico ? "Editar Serviço" : "Adicionar Serviço"}
                      </DialogTitle>
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
                      <Button variant="outline" onClick={() => {
                        setShowServicoModal(false);
                        setEditandoServico(null);
                        setNovoServico({ nome: "", descricao: "", valor: 0 });
                      }}>
                        Cancelar
                      </Button>
                      <Button onClick={adicionarNovoServico}>
                        {editandoServico ? "Atualizar" : "Adicionar"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Serviços existentes */}
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                {servicosDisponiveis.length > 0 ? (
                  servicosDisponiveis.map((servico) => (
                    <div
                      key={servico.id}
                      className="p-2 border rounded cursor-pointer hover:bg-white flex justify-between items-center bg-white"
                      onClick={() => adicionarServicoExistente(servico)}
                    >
                      <div>
                        <div className="font-medium text-sm">{servico.nome}</div>
                        <div className="text-xs text-gray-600">R$ {Number(servico.preco).toFixed(2)}</div>
                      </div>
                      <Plus className="h-4 w-4 text-green-600" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Nenhum serviço cadastrado
                  </div>
                )}
              </div>

              {/* Separador visual */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Serviços da OS</span>
                </div>
              </div>

              {/* Serviços Selecionados - Box destacado */}
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-blue-900">Serviços Selecionados</h3>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {servicosSelecionados.length} item(s)
                  </Badge>
                </div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {servicosSelecionados.length > 0 ? (
                    servicosSelecionados.map((servico, index) => (
                      <div key={servico.id || index} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{servico.nome}</div>
                          <div className="text-xs text-gray-600">R$ {servico.valor.toFixed(2)}</div>
                          {servico.descricao && (
                            <div className="text-xs text-gray-500 mt-1">{servico.descricao}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editarServico(servico)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerServico(servico.id, index)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded-lg">
                      Nenhum serviço selecionado
                    </div>
                  )}
                </div>
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
              {isEditing ? (
                <Button onClick={salvarOS} className="flex-1">
                  <FileText className="mr-2 h-4 w-4" />
                  Salvar OS
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={salvarOS} 
                    className="flex-1"
                    disabled={!clienteSelecionado || (produtosSelecionados.length === 0 && servicosSelecionados.length === 0)}
                  >
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
                </>
              )}
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

      {/* Modais de Comissão */}
      <ComissaoConfirmModal
        isOpen={showComissaoConfirm}
        onClose={() => setShowComissaoConfirm(false)}
        onConfirm={handleComissaoConfirm}
        onReject={handleComissaoReject}
        mecanicoNome={mecanicosDisponiveis.find(m => m.id === mecanicoSelecionado)?.nome}
      />

      <ComissaoCalculatorModal
        isOpen={showComissaoCalculator}
        onClose={() => setShowComissaoCalculator(false)}
        onFinalized={handleComissaoFinalized}
        vendaId={vendaIdForComissao}
        mecanicoId={mecanicoSelecionado}
        mecanicoNome={mecanicosDisponiveis.find(m => m.id === mecanicoSelecionado)?.nome || ""}
        valorServicos={valorServicosParaComissao}
        valorTotal={valorTotalParaComissao}
        osData={{
          clienteSelecionado,
          veiculoSelecionado,
          servicosSelecionados,
          produtosSelecionados,
          formaPagamento,
          parcelas,
          valorDesconto,
          observacoes,
          numeroOS,
          isEditing,
          editingVenda
        }}
      />
    </div>
  );
};

export default NovaOSSupabase;