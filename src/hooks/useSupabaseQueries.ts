import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEmpresaContext } from '@/hooks/useEmpresaContext';
import { Database } from '@/integrations/supabase/types';

// Types
type Produto = Database['public']['Tables']['produtos']['Row'];
type ProdutoInsert = Omit<Database['public']['Tables']['produtos']['Insert'], 'preco_medio'>;
type ProdutoUpdate = Omit<Database['public']['Tables']['produtos']['Update'], 'preco_medio'>;

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
export type VeiculoKmHistorico = Database['public']['Tables']['veiculo_km_historico']['Row'];

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
          id,
          nome,
          marca,
          codigo,
          codigo_interno,
          ncm_sh,
          codigo_barras,
          categoria_id,
          empresa_id,
          preco_custo,
          preco_medio,
          preco_venda,
          quantidade,
          estoque_minimo,
          data_entrada,
          status,
          created_at,
          updated_at,
          user_id,
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
          id,
          nome,
          marca,
          codigo,
          codigo_interno,
          ncm_sh,
          codigo_barras,
          categoria_id,
          empresa_id,
          preco_custo,
          preco_medio,
          preco_venda,
          quantidade,
          estoque_minimo,
          data_entrada,
          status,
          created_at,
          updated_at,
          user_id,
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
      console.log('=== DEBUG: createProduto mutation ===');
      console.log('User:', user);
      console.log('EmpresaId:', empresaId);
      console.log('Produto:', produto);

      if (!user) {
        const errorMsg = 'Usuário não autenticado. Faça login novamente.';
        console.error('ERROR:', errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!empresaId) {
        const errorMsg = 'Nenhuma empresa selecionada. Configure sua empresa primeiro.';
        console.error('ERROR:', errorMsg);
        throw new Error(errorMsg);
      }

      const insertData = { ...produto, user_id: user.id, empresa_id: empresaId };
      console.log('Insert data:', insertData);
      
      const { data, error } = await supabase
        .from('produtos')
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Erro do banco de dados: ${error.message}`);
      }
      
      console.log('SUCCESS: Produto created:', data);
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

// Hook para histórico de KM dos veículos
export const useVeiculoKmHistorico = (veiculoId: string | null) => {
  const { empresaId } = useEmpresaContext();
  
  return useQuery({
    queryKey: ['veiculo_km_historico', veiculoId, empresaId],
    queryFn: async (): Promise<VeiculoKmHistorico[]> => {
      if (!veiculoId || !empresaId) return [];
      
      const { data, error } = await supabase
        .from('veiculo_km_historico')
        .select('*')
        .eq('veiculo_id', veiculoId)
        .eq('empresa_id', empresaId)
        .order('data_atualizacao', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!veiculoId && !!empresaId,
  });
};

// Hook para atualizar KM do veículo
export const useUpdateVeiculoKm = () => {
  const queryClient = useQueryClient();
  const { empresaId } = useEmpresaContext();

  return useMutation({
    mutationFn: async ({
      veiculoId,
      novoKm,
      osId,
      orcamentoId,
      observacoes
    }: {
      veiculoId: string;
      novoKm: number;
      osId?: string;
      orcamentoId?: string;
      observacoes?: string;
    }) => {
      const { data, error } = await supabase.rpc('update_veiculo_km', {
        p_veiculo_id: veiculoId,
        p_km_novo: novoKm,
        p_os_id: osId || null,
        p_orcamento_id: orcamentoId || null,
        p_observacoes: observacoes || null
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['veiculos', empresaId] });
      queryClient.invalidateQueries({ queryKey: ['veiculo_km_historico', variables.veiculoId, empresaId] });
      
      // Se houver cliente_id, invalidar veículos do cliente
      queryClient.invalidateQueries({ queryKey: ['veiculos'] });
    }
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
      queryClient.invalidateQueries({ queryKey: ['veiculos', empresaId] });
      if (data.cliente_id) {
        queryClient.invalidateQueries({ queryKey: ['veiculos', data.cliente_id, empresaId] });
      }
    }
  });

  const updateVeiculo = useMutation({
    mutationFn: async ({ id, ...veiculo }: { id: string } & Partial<Omit<VeiculoInsert, 'user_id' | 'empresa_id'>>) => {
      if (!user || !empresaId) throw new Error('User not authenticated or no empresa selected');
      
      const { data, error } = await supabase
        .from('veiculos')
        .update(veiculo)
        .eq('id', id)
        .eq('empresa_id', empresaId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['veiculos', empresaId] });
      if (data.cliente_id) {
        queryClient.invalidateQueries({ queryKey: ['veiculos', data.cliente_id, empresaId] });
      }
    }
  });

  const deleteVeiculo = useMutation({
    mutationFn: async (id: string) => {
      if (!empresaId) throw new Error('Empresa não selecionada');
      
      const { data: veiculo } = await supabase
        .from('veiculos')
        .select('cliente_id')
        .eq('id', id)
        .eq('empresa_id', empresaId)
        .single();
      
      const { error } = await supabase
        .from('veiculos')
        .delete()
        .eq('id', id)
        .eq('empresa_id', empresaId);
      
      if (error) throw error;
      return { id, cliente_id: veiculo?.cliente_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['veiculos', empresaId] });
      if (data.cliente_id) {
        queryClient.invalidateQueries({ queryKey: ['veiculos', data.cliente_id, empresaId] });
      }
    }
  });

  return { createVeiculo, updateVeiculo, deleteVeiculo };
};

// ============= VENDAS E HISTORIC =============

export const useVendasByCliente = (clienteId: string | null) => {
  const { empresaId } = useEmpresaContext();
  
  return useQuery({
    queryKey: ['vendas', 'cliente', clienteId, empresaId],
    queryFn: async () => {
      if (!clienteId || !empresaId) return [];
      
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          *,
          venda_produtos (
            id,
            produto_nome,
            quantidade,
            preco_unitario,
            preco_total
          ),
          venda_servicos (
            id,
            servico_nome,
            preco
          ),
          veiculos (
            marca,
            modelo,
            placa
          )
        `)
        .eq('cliente_id', clienteId)
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!clienteId && !!empresaId,
  });
};

export const useOrcamentosByCliente = (clienteId: string | null) => {
  const { empresaId } = useEmpresaContext();
  
  return useQuery({
    queryKey: ['orcamentos', 'cliente', clienteId, empresaId],
    queryFn: async () => {
      if (!clienteId || !empresaId) return [];
      
      const { data, error } = await supabase
        .from('orcamentos')
        .select(`
          *,
          orcamento_produtos (
            id,
            produto_nome,
            quantidade,
            preco_unitario,
            preco_total
          ),
          orcamento_servicos (
            id,
            servico_nome,
            preco
          ),
          veiculos (
            marca,
            modelo,
            placa
          )
        `)
        .eq('cliente_id', clienteId)
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!clienteId && !!empresaId,
  });
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

  const deleteVenda = useMutation({
    mutationFn: async (vendaId: string) => {
      if (!empresaId) throw new Error('Empresa não selecionada');
      
      // Verificar se a OS está cancelada antes de permitir exclusão
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .select('status, numero_os')
        .eq('id', vendaId)
        .eq('empresa_id', empresaId)
        .single();
        
      if (vendaError) throw vendaError;
      if (!venda) throw new Error('OS não encontrada');
      if (venda.status !== 'cancelada') {
        throw new Error('Apenas OS canceladas podem ser excluídas');
      }

      // Deletar em ordem de dependência (do mais dependente para o menos)
      
      // 1. Deletar produtos da venda
      const { error: produtosError } = await supabase
        .from('venda_produtos')
        .delete()
        .eq('venda_id', vendaId);
      if (produtosError) throw produtosError;

      // 2. Deletar serviços da venda
      const { error: servicosError } = await supabase
        .from('venda_servicos')
        .delete()
        .eq('venda_id', vendaId);
      if (servicosError) throw servicosError;

      // 3. Deletar comissões relacionadas
      const { error: comissoesError } = await supabase
        .from('comissoes_mecanicos')
        .delete()
        .eq('venda_id', vendaId);
      if (comissoesError) throw comissoesError;

      // 4. Deletar movimentações de caixa relacionadas
      const { error: movimentacoesError } = await supabase
        .from('movimentacoes_caixa')
        .delete()
        .eq('referencia_id', vendaId)
        .eq('tipo_origem', 'OS');
      if (movimentacoesError) throw movimentacoesError;

      // 5. Deletar a venda principal
      const { error: vendaDeleteError } = await supabase
        .from('vendas')
        .delete()
        .eq('id', vendaId)
        .eq('empresa_id', empresaId);
      if (vendaDeleteError) throw vendaDeleteError;

      return { vendaId, numeroOS: venda.numero_os };
    },
    onSuccess: ({ vendaId, numeroOS }) => {
      queryClient.invalidateQueries({ queryKey: ['vendas', undefined, empresaId] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes_caixa'] });
      queryClient.invalidateQueries({ queryKey: ['comissoes_mecanico'] });
      queryClient.invalidateQueries({ queryKey: ['log_movimentacoes', empresaId] });
      
      // Log de auditoria para rastreabilidade
      supabase.from('audit_logs').insert({
        user_id: user?.id,
        empresa_id: empresaId,
        action: 'DELETE',
        resource_type: 'venda',
        resource_id: vendaId,
        details: { numeroOS, action: 'OS_EXCLUIDA' }
      });
    }
  });

  return { 
    createVenda, 
    createVendaProduto, 
    createVendaServico, 
    updateVenda,
    deleteVendaProdutos,
    deleteVendaServicos,
    deleteVenda
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
  // Safe context access with fallback
  let empresaId: string | null = null;
  let loading = true;
  
  try {
    const context = useEmpresaContext();
    empresaId = context.empresaId;
    loading = context.loading;
  } catch (error) {
    console.error('EmpresaContext not available in useLogMovimentacoes:', error);
    // Return a default query result when context is not available
    return {
      data: [],
      isLoading: false,
      error: new Error('EmpresaContext not available'),
      isError: true,
      refetch: () => Promise.resolve({ data: [], error: null }),
      isFetching: false,
      status: 'error' as const
    };
  }
  
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
    enabled: !!empresaId && !loading,
  });
};

export const useLogMovimentacaoMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { empresaId } = useEmpresaContext();

  const createLog = useMutation({
    mutationFn: async (log: Omit<LogMovimentacaoInsert, 'user_id' | 'empresa_id'>) => {
      if (!user || !empresaId) {
        console.error('❌ User or empresaId missing:', { user: !!user, empresaId });
        throw new Error('User not authenticated or no empresa selected');
      }
      
      console.log('📝 Criando log com dados:', {
        ...log,
        user_id: user.id,
        empresa_id: empresaId
      });
      
      const { data, error } = await supabase
        .from('log_movimentacoes')
        .insert({ ...log, user_id: user.id, empresa_id: empresaId })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao criar log:', error);
        throw error;
      }
      
      console.log('✅ Log criado com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['log_movimentacoes', empresaId] });
    }
  });

  return { createLog };
};