import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Types
type Produto = Database['public']['Tables']['produtos']['Row'];
type ProdutoInsert = Database['public']['Tables']['produtos']['Insert'];
type ProdutoUpdate = Database['public']['Tables']['produtos']['Update'];

type Categoria = Database['public']['Tables']['categorias']['Row'];
type CategoriaInsert = Database['public']['Tables']['categorias']['Insert'];

type Movimentacao = Database['public']['Tables']['movimentacoes']['Row'];
type MovimentacaoInsert = Database['public']['Tables']['movimentacoes']['Insert'];

type Cliente = Database['public']['Tables']['clientes']['Row'];
type ClienteInsert = Database['public']['Tables']['clientes']['Insert'];

type Servico = Database['public']['Tables']['servicos']['Row'];
type ServicoInsert = Database['public']['Tables']['servicos']['Insert'];

type Venda = Database['public']['Tables']['vendas']['Row'];
type VendaInsert = Database['public']['Tables']['vendas']['Insert'];

type VendaProduto = Database['public']['Tables']['venda_produtos']['Row'];
type VendaProdutoInsert = Database['public']['Tables']['venda_produtos']['Insert'];

type VendaServico = Database['public']['Tables']['venda_servicos']['Row'];
type VendaServicoInsert = Database['public']['Tables']['venda_servicos']['Insert'];

// Products hooks
export const useProdutos = () => {
  return useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
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
  });
};

export const useProdutoById = (id: string) => {
  return useQuery({
    queryKey: ['produto', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *,
          categoria:categorias(nome)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });
};

export const useProdutoMutations = () => {
  const queryClient = useQueryClient();

  const createProduto = useMutation({
    mutationFn: async (produto: ProdutoInsert) => {
      const { data, error } = await supabase
        .from('produtos')
        .insert(produto)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
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
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
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
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    }
  });

  return { createProduto, updateProduto, deleteProduto };
};

// Categories hooks
export const useCategorias = () => {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });
};

export const useCategoriaMutations = () => {
  const queryClient = useQueryClient();

  const createCategoria = useMutation({
    mutationFn: async (categoria: CategoriaInsert) => {
      const { data, error } = await supabase
        .from('categorias')
        .insert(categoria)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    }
  });

  return { createCategoria };
};

// Stock movements hooks
export const useMovimentacoes = () => {
  return useQuery({
    queryKey: ['movimentacoes'],
    queryFn: async () => {
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
  });
};

export const useMovimentacaoMutations = () => {
  const queryClient = useQueryClient();

  const createMovimentacao = useMutation({
    mutationFn: async (movimentacao: MovimentacaoInsert) => {
      const { data, error } = await supabase
        .from('movimentacoes')
        .insert(movimentacao)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    }
  });

  return { createMovimentacao };
};

// Clients hooks
export const useClientes = () => {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });
};

export const useClienteMutations = () => {
  const queryClient = useQueryClient();

  const createCliente = useMutation({
    mutationFn: async (cliente: ClienteInsert) => {
      const { data, error } = await supabase
        .from('clientes')
        .insert(cliente)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    }
  });

  return { createCliente };
};

// Services hooks
export const useServicos = () => {
  return useQuery({
    queryKey: ['servicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });
};

export const useServicoMutations = () => {
  const queryClient = useQueryClient();

  const createServico = useMutation({
    mutationFn: async (servico: ServicoInsert) => {
      const { data, error } = await supabase
        .from('servicos')
        .insert(servico)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
    }
  });

  return { createServico };
};

// Sales hooks
export const useVendas = () => {
  return useQuery({
    queryKey: ['vendas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          *,
          venda_produtos(*),
          venda_servicos(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

export const useVendaMutations = () => {
  const queryClient = useQueryClient();

  const createVenda = useMutation({
    mutationFn: async (venda: VendaInsert) => {
      const { data, error } = await supabase
        .from('vendas')
        .insert(venda)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
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

  return { createVenda, createVendaProduto, createVendaServico };
};

// Utility functions for stock management
export const useEstoqueOperations = () => {
  const queryClient = useQueryClient();

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
          os_numero: osNumero
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
          valor_unitario: valorUnitario
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