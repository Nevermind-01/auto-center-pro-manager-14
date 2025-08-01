-- Phase 1: Critical RLS Policy Fixes - Add user isolation

-- Add user_id columns to tables that need user isolation
ALTER TABLE public.produtos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.categorias ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.clientes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.servicos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.veiculos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.vendas ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.movimentacoes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.contas_a_pagar ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.log_movimentacoes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create user roles system for access control
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles (prevents recursive RLS issues)
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID DEFAULT auth.uid())
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = check_user_id LIMIT 1;
$$;

-- Helper function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(check_user_id UUID, required_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = check_user_id AND role = required_role
  );
$$;

-- Update RLS policies with proper user isolation
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can manage produtos" ON public.produtos;
DROP POLICY IF EXISTS "Authenticated users can manage categorias" ON public.categorias;
DROP POLICY IF EXISTS "Authenticated users can manage clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can manage servicos" ON public.servicos;
DROP POLICY IF EXISTS "Authenticated users can manage veiculos" ON public.veiculos;
DROP POLICY IF EXISTS "Authenticated users can manage vendas" ON public.vendas;
DROP POLICY IF EXISTS "Authenticated users can manage movimentacoes" ON public.movimentacoes;
DROP POLICY IF EXISTS "Authenticated users can manage contas_a_pagar" ON public.contas_a_pagar;
DROP POLICY IF EXISTS "Authenticated users can manage log_movimentacoes" ON public.log_movimentacoes;
DROP POLICY IF EXISTS "Authenticated users can manage venda_produtos" ON public.venda_produtos;
DROP POLICY IF EXISTS "Authenticated users can manage venda_servicos" ON public.venda_servicos;

-- Create secure user-isolated policies for produtos
CREATE POLICY "Users can view their own produtos" ON public.produtos
  FOR SELECT USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert their own produtos" ON public.produtos
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own produtos" ON public.produtos
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can delete their own produtos" ON public.produtos
  FOR DELETE USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Create secure user-isolated policies for categorias
CREATE POLICY "Users can view their own categorias" ON public.categorias
  FOR SELECT USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert their own categorias" ON public.categorias
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own categorias" ON public.categorias
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can delete their own categorias" ON public.categorias
  FOR DELETE USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Create secure user-isolated policies for clientes
CREATE POLICY "Users can view their own clientes" ON public.clientes
  FOR SELECT USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert their own clientes" ON public.clientes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own clientes" ON public.clientes
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can delete their own clientes" ON public.clientes
  FOR DELETE USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Create secure user-isolated policies for servicos
CREATE POLICY "Users can view their own servicos" ON public.servicos
  FOR SELECT USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert their own servicos" ON public.servicos
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own servicos" ON public.servicos
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can delete their own servicos" ON public.servicos
  FOR DELETE USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Create secure user-isolated policies for veiculos
CREATE POLICY "Users can view their own veiculos" ON public.veiculos
  FOR SELECT USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert their own veiculos" ON public.veiculos
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own veiculos" ON public.veiculos
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can delete their own veiculos" ON public.veiculos
  FOR DELETE USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Create secure user-isolated policies for vendas
CREATE POLICY "Users can view their own vendas" ON public.vendas
  FOR SELECT USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert their own vendas" ON public.vendas
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own vendas" ON public.vendas
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can delete their own vendas" ON public.vendas
  FOR DELETE USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Create secure user-isolated policies for movimentacoes
CREATE POLICY "Users can view their own movimentacoes" ON public.movimentacoes
  FOR SELECT USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert their own movimentacoes" ON public.movimentacoes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own movimentacoes" ON public.movimentacoes
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can delete their own movimentacoes" ON public.movimentacoes
  FOR DELETE USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Create secure user-isolated policies for contas_a_pagar
CREATE POLICY "Users can view their own contas_a_pagar" ON public.contas_a_pagar
  FOR SELECT USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert their own contas_a_pagar" ON public.contas_a_pagar
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own contas_a_pagar" ON public.contas_a_pagar
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can delete their own contas_a_pagar" ON public.contas_a_pagar
  FOR DELETE USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Create secure user-isolated policies for log_movimentacoes
CREATE POLICY "Users can view their own log_movimentacoes" ON public.log_movimentacoes
  FOR SELECT USING (
    user_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert their own log_movimentacoes" ON public.log_movimentacoes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all log_movimentacoes" ON public.log_movimentacoes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create secure policies for venda_produtos (inherits from vendas)
CREATE POLICY "Users can view venda_produtos for their vendas" ON public.venda_produtos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendas 
      WHERE vendas.id = venda_produtos.venda_id 
      AND (vendas.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can insert venda_produtos for their vendas" ON public.venda_produtos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendas 
      WHERE vendas.id = venda_produtos.venda_id 
      AND vendas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update venda_produtos for their vendas" ON public.venda_produtos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.vendas 
      WHERE vendas.id = venda_produtos.venda_id 
      AND (vendas.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can delete venda_produtos for their vendas" ON public.venda_produtos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.vendas 
      WHERE vendas.id = venda_produtos.venda_id 
      AND (vendas.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Create secure policies for venda_servicos (inherits from vendas)
CREATE POLICY "Users can view venda_servicos for their vendas" ON public.venda_servicos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendas 
      WHERE vendas.id = venda_servicos.venda_id 
      AND (vendas.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can insert venda_servicos for their vendas" ON public.venda_servicos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendas 
      WHERE vendas.id = venda_servicos.venda_id 
      AND vendas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update venda_servicos for their vendas" ON public.venda_servicos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.vendas 
      WHERE vendas.id = venda_servicos.venda_id 
      AND (vendas.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can delete venda_servicos for their vendas" ON public.venda_servicos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.vendas 
      WHERE vendas.id = venda_servicos.venda_id 
      AND (vendas.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Create policies for user_roles table
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all user roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger to automatically assign user role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'user');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();