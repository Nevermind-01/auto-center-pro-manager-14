-- Fix foreign key constraint issue for user deletion
-- Allow mecanico_id to be null in vendas table and update constraint behavior

-- First, make sure mecanico_id can be null in vendas table
ALTER TABLE public.vendas ALTER COLUMN mecanico_id DROP NOT NULL;

-- Drop the existing foreign key constraint
ALTER TABLE public.vendas DROP CONSTRAINT IF EXISTS vendas_mecanico_id_fkey;

-- Add the foreign key constraint with SET NULL on delete
-- This way when a mechanic is deleted, the mecanico_id in sales records becomes null
ALTER TABLE public.vendas 
ADD CONSTRAINT vendas_mecanico_id_fkey 
FOREIGN KEY (mecanico_id) 
REFERENCES public.mecanicos(id) 
ON DELETE SET NULL;