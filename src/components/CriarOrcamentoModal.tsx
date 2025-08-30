import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Search, X } from 'lucide-react';
import * as useSupabaseQueries from '@/hooks/useSupabaseQueries';
import { useMecanicos } from '@/hooks/useMecanicos';
import { useOrcamentoMutations, type CreateOrcamentoData } from '@/hooks/useOrcamentos';
import { useAuth } from '@/hooks/useAuth';
import { Truck } from 'lucide-react';
import { AtualizarKmModal } from '@/components/AtualizarKmModal';

interface CriarOrcamentoModalProps {
  open: boolean;
  onClose: () => void;
  orcamentoParaEditar?: any | null;
}

export function CriarOrcamentoModal({ open, onClose, orcamentoParaEditar }: CriarOrcamentoModalProps) {
  const { user } = useAuth();
  const { data: clientes = [] } = useSupabaseQueries.useClientes();
  const { data: produtos = [] } = useSupabaseQueries.useProdutos();
  const { data: servicos = [] } = useSupabaseQueries.useServicos();
  const { data: mecanicos = [] } = useMecanicos();
  const { createOrcamento, updateOrcamento } = useOrcamentoMutations();
  const { createVeiculo } = useSupabaseQueries.useVeiculoMutations();

  const [formData, setFormData] = useState({
    numeroOrcamento: '',
    clienteId: '',
    clienteNome: '',
    veiculoId: '',
    mecanicoId: '',
    validade: '',
    observacoes: '',
    observacoesInternas: '',
    valorDesconto: 0,
  });

  const [produtosSelecionados, setProdutosSelecionados] = useState<Array<{
    id: string;
    nome: string;
    quantidade: number;
    valor: number;
  }>>([]);

  const [servicosSelecionados, setServicosSelecionados] = useState<Array<{
    id?: string;
    nome: string;
    valor: number;
  }>>([]);

  const [produtoSearch, setProdutoSearch] = useState('');
  const [servicoSearch, setServicoSearch] = useState('');
  const [showProdutoSearch, setShowProdutoSearch] = useState(false);
  const [showServicoSearch, setShowServicoSearch] = useState(false);
  
  // Estados para novo veículo
  const [showVeiculoModal, setShowVeiculoModal] = useState(false);
  const [isAddingVeiculo, setIsAddingVeiculo] = useState(false);
  const [novoVeiculo, setNovoVeiculo] = useState({
    marca: "",
    modelo: "",
    placa: "",
    ano: "",
    cor: "",
    km_atual: "",
    observacoes: ""
  });

  // Estados para atualização de KM
  const [showAtualizarKmModal, setShowAtualizarKmModal] = useState(false);
  const [veiculoParaAtualizarKm, setVeiculoParaAtualizarKm] = useState<any>(null);

  // Gerar número do orçamento automaticamente ou carregar dados para edição
  useEffect(() => {
    if (open) {
      if (orcamentoParaEditar) {
        // Modo edição - carregar dados existentes
        setFormData({
          numeroOrcamento: orcamentoParaEditar.numero_orcamento,
          clienteId: orcamentoParaEditar.cliente_id,
          clienteNome: orcamentoParaEditar.cliente_nome,
          veiculoId: orcamentoParaEditar.veiculo_id || '',
          mecanicoId: orcamentoParaEditar.mecanico_id || '',
          validade: orcamentoParaEditar.validade.split('T')[0], // Apenas a data
          observacoes: orcamentoParaEditar.observacoes || '',
          observacoesInternas: orcamentoParaEditar.observacoes_internas || '',
          valorDesconto: orcamentoParaEditar.valor_desconto || 0,
        });
        
        // Carregar produtos
        if (orcamentoParaEditar.orcamento_produtos?.length > 0) {
          setProdutosSelecionados(orcamentoParaEditar.orcamento_produtos.map((p: any) => ({
            id: p.produto_id,
            nome: p.produto_nome,
            quantidade: p.quantidade,
            valor: p.preco_unitario,
          })));
        }
        
        // Carregar serviços
        if (orcamentoParaEditar.orcamento_servicos?.length > 0) {
          setServicosSelecionados(orcamentoParaEditar.orcamento_servicos.map((s: any) => ({
            id: s.servico_id,
            nome: s.servico_nome,
            valor: s.preco,
          })));
        }
      } else {
        // Modo criação - gerar número novo
        const numeroOrcamento = `ORC-${Date.now()}`;
        setFormData(prev => ({ ...prev, numeroOrcamento }));
      }
    }
  }, [open, orcamentoParaEditar]);

  // Buscar veículos do cliente selecionado
  const { data: veiculos = [] } = useSupabaseQueries.useVeiculosByCliente(formData.clienteId || '');

  const handleClienteChange = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    setFormData(prev => ({
      ...prev,
      clienteId,
      clienteNome: cliente?.nome || '',
      veiculoId: '', // Reset veiculo when client changes
    }));
  };

  const adicionarProduto = (produto: any) => {
    const jaExiste = produtosSelecionados.find(p => p.id === produto.id);
    if (!jaExiste) {
      setProdutosSelecionados(prev => [...prev, {
        id: produto.id,
        nome: produto.nome,
        quantidade: 1,
        valor: produto.preco_venda,
      }]);
    }
    setShowProdutoSearch(false);
    setProdutoSearch('');
  };

  const removerProduto = (produtoId: string) => {
    setProdutosSelecionados(prev => prev.filter(p => p.id !== produtoId));
  };

  const atualizarQuantidadeProduto = (produtoId: string, quantidade: number) => {
    if (quantidade <= 0) return;
    setProdutosSelecionados(prev =>
      prev.map(p => p.id === produtoId ? { ...p, quantidade } : p)
    );
  };

  const adicionarServico = (servico?: any) => {
    if (servico) {
      const jaExiste = servicosSelecionados.find(s => s.id === servico.id);
      if (!jaExiste) {
        setServicosSelecionados(prev => [...prev, {
          id: servico.id,
          nome: servico.nome,
          valor: servico.preco,
        }]);
      }
    } else {
      // Adicionar serviço personalizado
      setServicosSelecionados(prev => [...prev, {
        nome: 'Novo Serviço',
        valor: 0,
      }]);
    }
    setShowServicoSearch(false);
    setServicoSearch('');
  };

  const removerServico = (index: number) => {
    setServicosSelecionados(prev => prev.filter((_, i) => i !== index));
  };

  const atualizarServico = (index: number, campo: 'nome' | 'valor', valor: string | number) => {
    setServicosSelecionados(prev =>
      prev.map((s, i) => i === index ? { ...s, [campo]: valor } : s)
    );
  };

  // Função para adicionar novo veículo
  const adicionarNovoVeiculo = async () => {
    if (!novoVeiculo.marca || !novoVeiculo.modelo || !novoVeiculo.placa) {
      alert('Marca, modelo e placa são obrigatórios.');
      return;
    }

    if (!formData.clienteId) {
      alert('Selecione um cliente primeiro.');
      return;
    }

    setIsAddingVeiculo(true);

    try {
      const veiculo = await createVeiculo.mutateAsync({
        cliente_id: formData.clienteId,
        marca: novoVeiculo.marca,
        modelo: novoVeiculo.modelo,
        placa: novoVeiculo.placa,
        ano: novoVeiculo.ano || null,
        cor: novoVeiculo.cor || null,
        km_atual: novoVeiculo.km_atual ? Number(novoVeiculo.km_atual) : 0,
        observacoes: novoVeiculo.observacoes || null
      });

      // Selecionar o veículo recém-criado - abrir modal de KM primeiro
      setVeiculoParaAtualizarKm(veiculo);
      setShowAtualizarKmModal(true);
      
      // Limpar formulário
      setNovoVeiculo({
        marca: "",
        modelo: "",
        placa: "",
        ano: "",
        cor: "",
        km_atual: "",
        observacoes: ""
      });
      
      setShowVeiculoModal(false);
    } catch (error) {
      console.error('Erro ao adicionar veículo:', error);
      alert('Erro ao adicionar veículo.');
    } finally {
      setIsAddingVeiculo(false);
    }
  };

  // Cálculos
  const valorTotalProdutos = produtosSelecionados.reduce((total, produto) => 
    total + (produto.valor * produto.quantidade), 0
  );

  const valorTotalServicos = servicosSelecionados.reduce((total, servico) => 
    total + servico.valor, 0
  );

  const valorTotal = valorTotalProdutos + valorTotalServicos;
  const valorFinal = valorTotal - formData.valorDesconto;

  const handleSubmit = async () => {
    if (!formData.clienteId || !formData.validade) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const data: CreateOrcamentoData = {
      numeroOrcamento: formData.numeroOrcamento,
      clienteId: formData.clienteId,
      clienteNome: formData.clienteNome,
      veiculoId: formData.veiculoId || undefined,
      mecanicoId: formData.mecanicoId || undefined,
      valorTotal,
      valorDesconto: formData.valorDesconto,
      valorFinal,
      validade: formData.validade,
      observacoes: formData.observacoes || undefined,
      observacoesInternas: formData.observacoesInternas || undefined,
      produtos: produtosSelecionados,
      servicos: servicosSelecionados,
    };

    if (orcamentoParaEditar) {
      // Modo edição
      await updateOrcamento.mutateAsync({ id: orcamentoParaEditar.id, data });
    } else {
      // Modo criação
      await createOrcamento.mutateAsync(data);
    }
    
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      numeroOrcamento: '',
      clienteId: '',
      clienteNome: '',
      veiculoId: '',
      mecanicoId: '',
      validade: '',
      observacoes: '',
      observacoesInternas: '',
      valorDesconto: 0,
    });
    setProdutosSelecionados([]);
    setServicosSelecionados([]);
    setProdutoSearch('');
    setServicoSearch('');
    setShowProdutoSearch(false);
    setShowServicoSearch(false);
    setShowVeiculoModal(false);
    setNovoVeiculo({
      marca: "",
      modelo: "",
      placa: "",
      ano: "",
      cor: "",
      km_atual: "",
      observacoes: ""
    });
    onClose();
  };

  const produtosFiltrados = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(produtoSearch.toLowerCase()) ||
    produto.marca?.toLowerCase().includes(produtoSearch.toLowerCase()) ||
    produto.codigo?.toLowerCase().includes(produtoSearch.toLowerCase())
  );

  const servicosFiltrados = servicos.filter(servico =>
    servico.nome.toLowerCase().includes(servicoSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{orcamentoParaEditar ? 'Editar Orçamento' : 'Criar Novo Orçamento'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numeroOrcamento">Número do Orçamento</Label>
                <Input
                  id="numeroOrcamento"
                  value={formData.numeroOrcamento}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="validade">Validade *</Label>
                <Input
                  id="validade"
                  type="date"
                  value={formData.validade}
                  onChange={(e) => setFormData(prev => ({ ...prev, validade: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="cliente">Cliente *</Label>
                <Select value={formData.clienteId} onValueChange={handleClienteChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="veiculo">Veículo</Label>
                <Select 
                  value={formData.veiculoId} 
                  onValueChange={(value) => {
                    const veiculo = veiculos.find(v => v.id === value);
                    if (veiculo) {
                      // Abrir modal para atualizar KM antes de selecionar o veículo
                      setVeiculoParaAtualizarKm(veiculo);
                      setShowAtualizarKmModal(true);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {veiculos.map(veiculo => (
                      <SelectItem key={veiculo.id} value={veiculo.id}>
                        {veiculo.marca} {veiculo.modelo} - {veiculo.placa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.clienteId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVeiculoModal(true)}
                    className="w-full mt-2"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Adicionar Novo Veículo
                  </Button>
                )}
              </div>
              <div className="col-span-2">
                <Label htmlFor="mecanico">Mecânico</Label>
                <Select value={formData.mecanicoId} onValueChange={(value) => setFormData(prev => ({ ...prev, mecanicoId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um mecânico" />
                  </SelectTrigger>
                  <SelectContent>
                    {mecanicos.map(mecanico => (
                      <SelectItem key={mecanico.id} value={mecanico.id}>
                        {mecanico.nome} - {mecanico.especialidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Produtos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Produtos</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProdutoSearch(!showProdutoSearch)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
            </CardHeader>
            <CardContent>
              {showProdutoSearch && (
                <div className="mb-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="h-4 w-4" />
                    <Input
                      placeholder="Buscar produto..."
                      value={produtoSearch}
                      onChange={(e) => setProdutoSearch(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowProdutoSearch(false);
                        setProdutoSearch('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {produtosFiltrados.map(produto => (
                      <div
                        key={produto.id}
                        className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                        onClick={() => adicionarProduto(produto)}
                      >
                        <div>
                          <div className="font-medium">{produto.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            {produto.marca} - Estoque: {produto.quantidade}
                          </div>
                        </div>
                        <Badge variant="outline">
                          R$ {produto.preco_venda.toFixed(2).replace('.', ',')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {produtosSelecionados.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="w-24">Qtd.</TableHead>
                      <TableHead className="w-32">Valor Unit.</TableHead>
                      <TableHead className="w-32">Total</TableHead>
                      <TableHead className="w-16">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtosSelecionados.map(produto => (
                      <TableRow key={produto.id}>
                        <TableCell>{produto.nome}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => atualizarQuantidadeProduto(produto.id, produto.quantidade - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{produto.quantidade}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => atualizarQuantidadeProduto(produto.id, produto.quantidade + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>R$ {produto.valor.toFixed(2).replace('.', ',')}</TableCell>
                        <TableCell>R$ {(produto.valor * produto.quantidade).toFixed(2).replace('.', ',')}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerProduto(produto.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum produto adicionado
                </p>
              )}
            </CardContent>
          </Card>

          {/* Serviços */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Serviços</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowServicoSearch(!showServicoSearch)}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Serviço
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adicionarServico()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Serviço Personalizado
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showServicoSearch && (
                <div className="mb-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="h-4 w-4" />
                    <Input
                      placeholder="Buscar serviço..."
                      value={servicoSearch}
                      onChange={(e) => setServicoSearch(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowServicoSearch(false);
                        setServicoSearch('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {servicosFiltrados.map(servico => (
                      <div
                        key={servico.id}
                        className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                        onClick={() => adicionarServico(servico)}
                      >
                        <div>
                          <div className="font-medium">{servico.nome}</div>
                          <div className="text-sm text-muted-foreground">{servico.descricao}</div>
                        </div>
                        <Badge variant="outline">
                          R$ {servico.preco.toFixed(2).replace('.', ',')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {servicosSelecionados.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serviço</TableHead>
                      <TableHead className="w-32">Valor</TableHead>
                      <TableHead className="w-16">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servicosSelecionados.map((servico, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            value={servico.nome}
                            onChange={(e) => atualizarServico(index, 'nome', e.target.value)}
                            className="border-none p-0 h-auto"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={servico.valor}
                            onChange={(e) => atualizarServico(index, 'valor', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerServico(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum serviço adicionado
                </p>
              )}
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="observacoes">Observações (visível no orçamento)</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Observações que aparecerão no orçamento..."
                />
              </div>
              <div>
                <Label htmlFor="observacoesInternas">Observações Internas</Label>
                <Textarea
                  id="observacoesInternas"
                  value={formData.observacoesInternas}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoesInternas: e.target.value }))}
                  placeholder="Observações internas (não aparece no orçamento)..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Resumo Financeiro */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Produtos:</span>
                <span>R$ {valorTotalProdutos.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between">
                <span>Serviços:</span>
                <span>R$ {valorTotalServicos.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {valorTotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="desconto">Desconto:</Label>
                <Input
                  id="desconto"
                  type="number"
                  step="0.01"
                  value={formData.valorDesconto}
                  onChange={(e) => setFormData(prev => ({ ...prev, valorDesconto: parseFloat(e.target.value) || 0 }))}
                  className="w-32"
                />
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>R$ {valorFinal.toFixed(2).replace('.', ',')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createOrcamento.isPending || updateOrcamento.isPending}
            >
              {(createOrcamento.isPending || updateOrcamento.isPending) ? 'Salvando...' : 
               orcamentoParaEditar ? 'Atualizar Orçamento' : 'Salvar Orçamento'}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Modal para adicionar novo veículo */}
      <Dialog open={showVeiculoModal} onOpenChange={setShowVeiculoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Veículo</DialogTitle>
            <DialogDescription>
              Cadastre um novo veículo para o cliente selecionado
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
                <Label htmlFor="ano">Ano/Modelo</Label>
                <Input
                  id="ano"
                  value={novoVeiculo.ano}
                  onChange={(e) => setNovoVeiculo({...novoVeiculo, ano: e.target.value})}
                  placeholder="Ex: 2015/2016"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cor">Cor</Label>
                <Input
                  id="cor"
                  value={novoVeiculo.cor}
                  onChange={(e) => setNovoVeiculo({...novoVeiculo, cor: e.target.value})}
                  placeholder="Ex: Branco"
                />
              </div>
              <div>
                <Label htmlFor="km_atual">KM Atual</Label>
                <Input
                  id="km_atual"
                  type="number"
                  value={novoVeiculo.km_atual}
                  onChange={(e) => setNovoVeiculo({...novoVeiculo, km_atual: e.target.value})}
                  placeholder="Ex: 50000"
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
            <Button 
              onClick={adicionarNovoVeiculo} 
              disabled={isAddingVeiculo}
            >
              {isAddingVeiculo ? "Adicionando..." : "Adicionar Veículo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para atualizar KM do veículo */}
      <AtualizarKmModal
        veiculo={veiculoParaAtualizarKm}
        open={showAtualizarKmModal}
        onOpenChange={setShowAtualizarKmModal}
        onKmUpdated={(novoKm) => {
          // Atualizar o veículo selecionado com o novo KM e definir no formData
          const veiculoAtualizado = { 
            ...veiculoParaAtualizarKm, 
            km_atual: novoKm 
          };
          setFormData(prev => ({ ...prev, veiculoId: veiculoAtualizado.id }));
          setVeiculoParaAtualizarKm(null);
        }}
        orcamentoId={orcamentoParaEditar?.id}
        observacoes="Seleção para Orçamento"
      />
    </Dialog>
  );
}