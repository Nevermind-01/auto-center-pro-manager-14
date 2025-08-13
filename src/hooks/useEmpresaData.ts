import { useEmpresaQuery, useEmpresaMutation } from './useSupabaseQueriesEmpresa';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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

export type Veiculo = Database['public']['Tables']['veiculos']['Row'];
export type VeiculoInsert = Database['public']['Tables']['veiculos']['Insert'];

// Hook para produtos da empresa
export const useEmpresaProdutos = () => {
  return useEmpresaQuery(
    ['produtos'],
    async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *,
          categoria:categorias(nome)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  );
};

// Hook para clientes da empresa
export const useEmpresaClientes = () => {
  return useEmpresaQuery(
    ['clientes'],
    async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  );
};

// Hook para categorias da empresa
export const useEmpresaCategorias = () => {
  return useEmpresaQuery(
    ['categorias'],
    async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  );
};

// Hook para serviços da empresa
export const useEmpresaServicos = () => {
  return useEmpresaQuery(
    ['servicos'],
    async () => {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  );
};

// Hook para mecânicos da empresa
export const useEmpresaMecanicos = (ativos = true) => {
  return useEmpresaQuery(
    ['mecanicos', ativos ? 'ativos' : 'todos'],
    async () => {
      let query = supabase
        .from('mecanicos')
        .select('*')
        .order('nome', { ascending: true });

      if (ativos) {
        query = query.eq('ativo', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    }
  );
};

// Hook para vendas da empresa
interface VendasFilters {
  startDate?: Date;
  endDate?: Date;
}

export const useEmpresaVendas = (filters?: VendasFilters) => {
  const filtersKey = filters ? 
    `${filters.startDate?.toISOString() || ''}-${filters.endDate?.toISOString() || ''}` : 
    'all';
    
  return useEmpresaQuery(
    ['vendas', filtersKey],
    async () => {
      let query = supabase
        .from('vendas')
        .select(`
          *,
          venda_produtos(*),
          venda_servicos(*),
          veiculo:veiculos(*)
        `);

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  );
};

// Hook para veículos por cliente
export const useEmpresaVeiculosByCliente = (clienteId: string | null) => {
  return useEmpresaQuery(
    ['veiculos', clienteId],
    async () => {
      if (!clienteId) return [];
      
      const { data, error } = await supabase
        .from('veiculos')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    { enabled: !!clienteId }
  );
};

// Hook para movimentações da empresa
export const useEmpresaMovimentacoes = () => {
  return useEmpresaQuery(
    ['movimentacoes'],
    async () => {
      const { data, error } = await supabase
        .from('movimentacoes')
        .select(`
          *,
          produto:produtos(nome, marca)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  );
};

// Mutations hooks
export const useEmpresaProdutoMutations = () => {
  const { user } = useAuth();

  const createProduto = useEmpresaMutation(
    async ({ empresa_id, ...produto }: Omit<ProdutoInsert, 'user_id'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('produtos')
        .insert({ ...produto, user_id: user.id, empresa_id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      invalidateQueries: ['produtos']
    }
  );

  const updateProduto = useEmpresaMutation(
    async ({ empresa_id, id, ...produto }: ProdutoUpdate & { id: string; empresa_id: string }) => {
      const { data, error } = await supabase
        .from('produtos')
        .update(produto)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      invalidateQueries: ['produtos']
    }
  );

  const deleteProduto = useEmpresaMutation(
    async ({ empresa_id, id }: { id: string; empresa_id: string }) => {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    {
      invalidateQueries: ['produtos']
    }
  );

  return { createProduto, updateProduto, deleteProduto };
};

export const useEmpresaClienteMutations = () => {
  const { user } = useAuth();

  const createCliente = useEmpresaMutation(
    async ({ empresa_id, ...cliente }: Omit<ClienteInsert, 'user_id'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('clientes')
        .insert({ ...cliente, user_id: user.id, empresa_id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      invalidateQueries: ['clientes']
    }
  );

  const updateCliente = useEmpresaMutation(
    async ({ empresa_id, id, ...updates }: Partial<Cliente> & { id: string; empresa_id: string }) => {
      const { data, error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      invalidateQueries: ['clientes']
    }
  );

  const deleteCliente = useEmpresaMutation(
    async ({ empresa_id, id }: { id: string; empresa_id: string }) => {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    {
      invalidateQueries: ['clientes']
    }
  );

  return { createCliente, updateCliente, deleteCliente };
};

export const useEmpresaVeiculoMutations = () => {
  const { user } = useAuth();

  const createVeiculo = useEmpresaMutation(
    async ({ empresa_id, ...veiculo }: Omit<VeiculoInsert, 'user_id'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('veiculos')
        .insert({ ...veiculo, user_id: user.id, empresa_id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      invalidateQueries: ['veiculos']
    }
  );

  return { createVeiculo };
};

export const useEmpresaMecanicoMutations = () => {
  const { user } = useAuth();

  const createMecanico = useEmpresaMutation(
    async ({ empresa_id, ...mecanico }: any) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('mecanicos')
        .insert({ ...mecanico, user_id: user.id, empresa_id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      invalidateQueries: ['mecanicos']
    }
  );

  const updateMecanico = useEmpresaMutation(
    async ({ empresa_id, id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('mecanicos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    {
      invalidateQueries: ['mecanicos']
    }
  );

  const deleteMecanico = useEmpresaMutation(
    async ({ empresa_id, id }: { id: string; empresa_id: string }) => {
      const { error } = await supabase
        .from('mecanicos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    {
      invalidateQueries: ['mecanicos']
    }
  );

  return { createMecanico, updateMecanico, deleteMecanico };
};