import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEmpresaContext } from '@/hooks/useEmpresaContext';
import { Database } from '@/integrations/supabase/types';

// Types
type Produto = Database['public']['Tables']['produtos']['Row'];
type ProdutoInsert = Database['public']['Tables']['produtos']['Insert'];
type ProdutoUpdate = Database['public']['Tables']['produtos']['Update'];

type Categoria = Database['public']['Tables']['categorias']['Row'];
type CategoriaInsert = Database['public']['Tables']['categorias']['Insert'];

type Movimentacao = Database['public']['Tables']['movimentacoes']['Row'];
type MovimentacaoInsert = Database['public']['Tables']['movimentacoes']['Insert'];

export type Cliente = Database['public']['Tables']['clientes']['Row'];
export type ClienteInsert = Database['public']['Tables']['clientes']['Insert'];

type Servico = Database['public']['Tables']['servicos']['Row'];
type ServicoInsert = Database['public']['Tables']['servicos']['Insert'];

type Venda = Database['public']['Tables']['vendas']['Row'];
type VendaInsert = Database['public']['Tables']['vendas']['Insert'];

type VendaProduto = Database['public']['Tables']['venda_produtos']['Row'];
type VendaProdutoInsert = Database['public']['Tables']['venda_produtos']['Insert'];

type VendaServico = Database['public']['Tables']['venda_servicos']['Row'];
type VendaServicoInsert = Database['public']['Tables']['venda_servicos']['Insert'];

// Log types
type LogMovimentacao = Database['public']['Tables']['log_movimentacoes']['Row'];
type LogMovimentacaoInsert = Database['public']['Tables']['log_movimentacoes']['Insert'];

// Vehicles types
export type Veiculo = Database['public']['Tables']['veiculos']['Row'];
export type VeiculoInsert = Database['public']['Tables']['veiculos']['Insert'];

// Products hooks
export const useProdutos = () => {
  const { empresaId } = useEmpresaContext();
  
  return useQuery({
    queryKey: ['produtos', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *,
          categoria:categorias(nome)
        `)
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });
};

export const useProdutoById = (id: string) => {
  const { empresaId } = useEmpresaContext();
  
  return useQuery({
    queryKey: ['produto', id, empresaId],
    queryFn: async () => {
      if (!empresaId) return null;
      
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *,
          categoria:categorias(nome)
        `)
        .eq('id', id)
        .eq('empresa_id', empresaId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!empresaId
  });
};

export const useProdutoMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { empresaId } = useEmpresaContext();

  const createProduto = useMutation({
    mutationFn: async (produto: Omit<ProdutoInsert, 'user_id' | 'empresa_id'>) => {
      if (!user || !empresaId) throw new Error('User not authenticated or no empresa selected');
      
      const { data, error } = await supabase
        .from('produtos')
        .insert({ ...produto, user_id: user.id, empresa_id: empresaId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos', empresaId] });
    }
  });

  const updateProduto = useMutation({
    mutationFn: async ({ id, ...produto }: ProdutoUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('produtos')
        .update(produto)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos', empresaId] });
    }
  });

  const deleteProduto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos', empresaId] });
    }
  });

  return { createProduto, updateProduto, deleteProduto };
};

// Categories hooks
export const useCategorias = () => {
  const { empresaId } = useEmpresaContext();
  
  return useQuery({
    queryKey: ['categorias', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('nome');
      
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });
};

export const useCategoriaMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { empresaId } = useEmpresaContext();

  const createCategoria = useMutation({
    mutationFn: async (categoria: Omit<CategoriaInsert, 'user_id' | 'empresa_id'>) => {
      if (!user || !empresaId) throw new Error('User not authenticated or no empresa selected');
      
      const { data, error } = await supabase
        .from('categorias')
        .insert({ ...categoria, user_id: user.id, empresa_id: empresaId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias', empresaId] });
    }
  });

  return { createCategoria };
};

// Stock movements hooks
export const useMovimentacoes = () => {
  const { empresaId } = useEmpresaContext();
  
  return useQuery({
    queryKey: ['movimentacoes', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      
      const { data, error } = await supabase
        .from('movimentacoes')
        .select(`
          *,
          produto:produtos(nome, marca)
        `)
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });
};

export const useMovimentacaoMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { empresaId } = useEmpresaContext();

  const createMovimentacao = useMutation({
    mutationFn: async (movimentacao: Omit<MovimentacaoInsert, 'user_id' | 'empresa_id'>) => {
      if (!user || !empresaId) throw new Error('User not authenticated or no empresa selected');
      
      const { data, error } = await supabase
        .from('movimentacoes')
        .insert({ ...movimentacao, user_id: user.id, empresa_id: empresaId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentacoes', empresaId] });
      queryClient.invalidateQueries({ queryKey: ['produtos', empresaId] });
    }
  });

  return { createMovimentacao };
};

// Clients hooks
export const useClientes = () => {
  const { empresaId } = useEmpresaContext();
  
  return useQuery({
    queryKey: ['clientes', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      
      // Use secure masked function that automatically filters by empresa and masks PII
      const { data, error } = await supabase.rpc('get_masked_clientes');
      
      if (error) throw error;
      
      // Data is already filtered by empresa_id and sorted in the RPC function
      return data || [];
    },
    enabled: !!empresaId,
  });
};

export const useClienteById = (id: string) => {
  const { empresaId } = useEmpresaContext();
  
  return useQuery({
    queryKey: ['clientes', id, empresaId],
    queryFn: async () => {
      if (!empresaId) return null;
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .eq('empresa_id', empresaId)
        .single();
      
      if (error) throw error;
      return data as Cliente;
    },
    enabled: !!id && !!empresaId,
  });
};

export const useClienteMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { empresaId } = useEmpresaContext();

  const createCliente = useMutation({
    mutationFn: async (cliente: Omit<ClienteInsert, 'user_id' | 'empresa_id'>) => {
      if (!user || !empresaId) throw new Error('User not authenticated or no empresa selected');
      
      const { data, error } = await supabase
        .from('clientes')
        .insert({ ...cliente, user_id: user.id, empresa_id: empresaId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', empresaId] });
    }
  });

  const updateCliente = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Cliente> & { id: string }) => {
      const { data, error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', empresaId] });
    },
  });

  const deleteCliente = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', empresaId] });
    },
  });

  return { createCliente, updateCliente, deleteCliente };
};

// Services hooks
export const useServicos = () => {
  const { empresaId } = useEmpresaContext();
  
  return useQuery({
    queryKey: ['servicos', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('nome');
      
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });
};

export const useServicoMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { empresaId } = useEmpresaContext();

  const createServico = useMutation({
    mutationFn: async (servico: Omit<ServicoInsert, 'user_id' | 'empresa_id'>) => {
      if (!user || !empresaId) throw new Error('User not authenticated or no empresa selected');
      
      const { data, error } = await supabase
        .from('servicos')
        .insert({ ...servico, user_id: user.id, empresa_id: empresaId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos', empresaId] });
    }
  });

  return { createServico };
};

// Vehicles hooks
export const useVeiculos = () => {
  const { empresaId } = useEmpresaContext();
  
  return useQuery({
    queryKey: ['veiculos', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      
      const { data, error } = await supabase
        .from('veiculos')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });
};

export const useVeiculosByCliente = (clienteId: string | null) => {
  const { empresaId } = useEmpresaContext();
  
  return useQuery({
    queryKey: ['veiculos', clienteId, empresaId],
    queryFn: async () => {
      if (!clienteId || !empresaId) return [];
      
      const { data, error } = await supabase
        .from('veiculos')
        .select('*')
        .eq('cliente_id', clienteId)
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!clienteId && !!empresaId
  });
};

export const useVeiculoMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { empresaId } = useEmpresaContext();

  const createVeiculo = useMutation({
    mutationFn: async (veiculo: Omit<VeiculoInsert, 'user_id' | 'empresa_id'>) => {
      if (!user || !empresaId) throw new Error('User not authenticated or no empresa selected');
      
      const { data, error } = await supabase
        .from('veiculos')
        .insert({ ...veiculo, user_id: user.id, empresa_id: empresaId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidar queries gerais de veículos
      queryClient.invalidateQueries({ queryKey: ['veiculos', empresaId] });
      // Invalidar query específica por cliente para atualizar imediatamente
      if (data.cliente_id) {
        queryClient.invalidateQueries({ queryKey: ['veiculos', data.cliente_id, empresaId] });
      }
    }
  });

  return { createVeiculo };
};

// Sales hooks
interface VendasFilters {
  startDate?: Date;
  endDate?: Date;
}

export const useVendas = (filters?: VendasFilters) => {
  const { empresaId } = useEmpresaContext();
  
  return useQuery({
    queryKey: ['vendas', filters, empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      
      let query = supabase
        .from('vendas')
        .select(`
          *,
          venda_produtos(*),
          venda_servicos(*),
          veiculo:veiculos(*)
        `)
        .eq('empresa_id', empresaId);

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });
};

export const useVendaMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { empresaId } = useEmpresaContext();

  const createVenda = useMutation({
    mutationFn: async (venda: Omit<VendaInsert, 'user_id' | 'empresa_id'>) => {
      if (!user || !empresaId) throw new Error('User not authenticated or no empresa selected');
      
      const { data, error } = await supabase
        .from('vendas')
        .insert({ ...venda, user_id: user.id, empresa_id: empresaId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas', undefined, empresaId] });
    }
  });

  const createVendaProduto = useMutation({
    mutationFn: async (vendaProduto: VendaProdutoInsert) => {
      const { data, error } = await supabase
        .from('venda_produtos')
        .insert(vendaProduto)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const createVendaServico = useMutation({
    mutationFn: async (vendaServico: VendaServicoInsert) => {
      const { data, error } = await supabase
        .from('venda_servicos')
        .insert(vendaServico)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const updateVenda = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Venda> & { id: string }) => {
      const { data, error } = await supabase
        .from('vendas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas', undefined, empresaId] });
      queryClient.invalidateQueries({ queryKey: ['produtos', empresaId] });
    }
  });

  const deleteVendaProdutos = useMutation({
    mutationFn: async (vendaId: string) => {
      const { error } = await supabase
        .from('venda_produtos')
        .delete()
        .eq('venda_id', vendaId);
      
      if (error) throw error;
    }
  });

  const deleteVendaServicos = useMutation({
    mutationFn: async (vendaId: string) => {
      const { error } = await supabase
        .from('venda_servicos')
        .delete()
        .eq('venda_id', vendaId);
      
      if (error) throw error;
    }
  });

  return { 
    createVenda, 
    createVendaProduto, 
    createVendaServico, 
    updateVenda,
    deleteVendaProdutos,
    deleteVendaServicos
  };
};

// Utility functions for stock management
export const useEstoqueOperations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const darBaixaEstoque = useMutation({
    mutationFn: async ({ 
      produtoId, 
      quantidade, 
      osNumero 
    }: { 
      produtoId: string; 
      quantidade: number; 
      osNumero: string; 
    }) => {
      if (!user) throw new Error('User not authenticated');
      // Get current product
      const { data: produto, error: produtoError } = await supabase
        .from('produtos')
        .select('quantidade')
        .eq('id', produtoId)
        .single();

      if (produtoError) throw produtoError;
      if (!produto) throw new Error('Produto não encontrado');

      const quantidadeAnterior = produto.quantidade;
      const novaQuantidade = quantidadeAnterior - quantidade;

      if (novaQuantidade < 0) {
        throw new Error('Estoque insuficiente');
      }

      // Update product quantity
      const { error: updateError } = await supabase
        .from('produtos')
        .update({ quantidade: novaQuantidade })
        .eq('id', produtoId);

      if (updateError) throw updateError;

      // Record movement
      const { error: movError } = await supabase
        .from('movimentacoes')
        .insert({
          produto_id: produtoId,
          tipo: 'saida',
          quantidade,
          quantidade_anterior: quantidadeAnterior,
          motivo: `Baixa por venda - OS: ${osNumero}`,
          os_numero: osNumero,
          user_id: user.id
        });

      if (movError) throw movError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
    }
  });

  const adicionarEstoque = useMutation({
    mutationFn: async ({ 
      produtoId, 
      quantidade, 
      motivo,
      valorUnitario
    }: { 
      produtoId: string; 
      quantidade: number; 
      motivo: string;
      valorUnitario?: number;
    }) => {
      if (!user) throw new Error('User not authenticated');
      // Get current product
      const { data: produto, error: produtoError } = await supabase
        .from('produtos')
        .select('quantidade')
        .eq('id', produtoId)
        .single();

      if (produtoError) throw produtoError;
      if (!produto) throw new Error('Produto não encontrado');

      const quantidadeAnterior = produto.quantidade;
      const novaQuantidade = quantidadeAnterior + quantidade;

      // Update product quantity
      const { error: updateError } = await supabase
        .from('produtos')
        .update({ quantidade: novaQuantidade })
        .eq('id', produtoId);

      if (updateError) throw updateError;

      // Record movement
      const { error: movError } = await supabase
        .from('movimentacoes')
        .insert({
          produto_id: produtoId,
          tipo: 'entrada',
          quantidade,
          quantidade_anterior: quantidadeAnterior,
          motivo,
          valor_unitario: valorUnitario,
          user_id: user.id
        });

      if (movError) throw movError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
    }
  });

  return { darBaixaEstoque, adicionarEstoque };
};

// Log movimentações hooks
export const useLogMovimentacoes = () => {
  const { empresaId } = useEmpresaContext();
  
  return useQuery({
    queryKey: ['log_movimentacoes', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      
      const { data, error } = await supabase
        .from('log_movimentacoes')
        .select(`
          *,
          venda:vendas!log_movimentacoes_os_id_fkey(numero_os, cliente_nome)
        `)
        .eq('empresa_id', empresaId)
        .order('data_hora', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });
};

export const useLogMovimentacaoMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { empresaId } = useEmpresaContext();

  const createLog = useMutation({
    mutationFn: async (log: Omit<LogMovimentacaoInsert, 'user_id' | 'empresa_id'>) => {
      if (!user || !empresaId) throw new Error('User not authenticated or no empresa selected');
      
      const { data, error } = await supabase
        .from('log_movimentacoes')
        .insert({ ...log, user_id: user.id, empresa_id: empresaId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['log_movimentacoes', empresaId] });
    }
  });

  return { createLog };
};