-- Expansão da tabela empresas com todos os campos necessários
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS razao_social TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS nome_fantasia TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS inscricao_municipal TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS cnae_principal TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS regime_tributario TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS data_fundacao DATE;

-- Campos de endereço
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS logradouro TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS municipio TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS uf TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'Brasil';

-- Campos de contato
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS telefone_principal TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS telefone_secundario TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS email_fiscal TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS email_comercial TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS site TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS facebook TEXT;

-- Campos fiscais
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS serie_nfe TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS natureza_operacao TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS ambiente_fiscal TEXT DEFAULT 'Homologação';
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS csc_token TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS codigo_regime_tributario TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS aliquota_iss DECIMAL(5,2);
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS municipio_iss TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS responsavel_tecnico TEXT;

-- Campos de arquivos/sistema
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS certificado_url TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS politica_privacidade_url TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Definir nome_fantasia como nome se não estiver definido
UPDATE public.empresas SET nome_fantasia = nome WHERE nome_fantasia IS NULL;
UPDATE public.empresas SET razao_social = nome WHERE razao_social IS NULL;

-- Criar bucket de storage para arquivos da empresa
INSERT INTO storage.buckets (id, name, public) 
VALUES ('empresa-files', 'empresa-files', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para empresa-files
CREATE POLICY "Users can view files from their empresa"
ON storage.objects FOR SELECT
USING (bucket_id = 'empresa-files' AND 
       EXISTS (
         SELECT 1 FROM public.empresas e
         JOIN public.empresa_usuarios eu ON e.id = eu.empresa_id
         WHERE eu.user_id = auth.uid() 
         AND eu.ativo = true
         AND e.id::text = (storage.foldername(name))[1]
       ));

CREATE POLICY "Owners can upload files for their empresa"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'empresa-files' AND
           EXISTS (
             SELECT 1 FROM public.empresas e
             JOIN public.empresa_usuarios eu ON e.id = eu.empresa_id
             WHERE eu.user_id = auth.uid() 
             AND eu.role = 'owner'
             AND eu.ativo = true
             AND e.id::text = (storage.foldername(name))[1]
           ));

CREATE POLICY "Owners can update files for their empresa"
ON storage.objects FOR UPDATE
USING (bucket_id = 'empresa-files' AND
       EXISTS (
         SELECT 1 FROM public.empresas e
         JOIN public.empresa_usuarios eu ON e.id = eu.empresa_id
         WHERE eu.user_id = auth.uid() 
         AND eu.role = 'owner'
         AND eu.ativo = true
         AND e.id::text = (storage.foldername(name))[1]
       ));

CREATE POLICY "Owners can delete files for their empresa"
ON storage.objects FOR DELETE
USING (bucket_id = 'empresa-files' AND
       EXISTS (
         SELECT 1 FROM public.empresas e
         JOIN public.empresa_usuarios eu ON e.id = eu.empresa_id
         WHERE eu.user_id = auth.uid() 
         AND eu.role = 'owner'
         AND eu.ativo = true
         AND e.id::text = (storage.foldername(name))[1]
       ));

-- Função para log de empresa alterações
CREATE OR REPLACE FUNCTION public.log_empresa_changes()
RETURNS TRIGGER AS $$
DECLARE
    changes_json jsonb;
    field_name text;
    old_val text;
    new_val text;
BEGIN
    -- Só faz log em UPDATEs
    IF TG_OP != 'UPDATE' THEN
        RETURN NEW;
    END IF;

    -- Construir JSON com diferenças
    changes_json := '{}'::jsonb;
    
    -- Comparar campos principais
    IF OLD.razao_social IS DISTINCT FROM NEW.razao_social THEN
        changes_json := changes_json || jsonb_build_object('razao_social', 
            jsonb_build_object('old', OLD.razao_social, 'new', NEW.razao_social));
    END IF;
    
    IF OLD.nome_fantasia IS DISTINCT FROM NEW.nome_fantasia THEN
        changes_json := changes_json || jsonb_build_object('nome_fantasia', 
            jsonb_build_object('old', OLD.nome_fantasia, 'new', NEW.nome_fantasia));
    END IF;
    
    IF OLD.cnpj IS DISTINCT FROM NEW.cnpj THEN
        changes_json := changes_json || jsonb_build_object('cnpj', 
            jsonb_build_object('old', OLD.cnpj, 'new', NEW.cnpj));
    END IF;
    
    IF OLD.email_fiscal IS DISTINCT FROM NEW.email_fiscal THEN
        changes_json := changes_json || jsonb_build_object('email_fiscal', 
            jsonb_build_object('old', OLD.email_fiscal, 'new', NEW.email_fiscal));
    END IF;
    
    -- Se houve mudanças, logar
    IF changes_json != '{}'::jsonb THEN
        INSERT INTO public.audit_logs (
            user_id,
            empresa_id,
            action,
            resource_type,
            resource_id,
            details
        ) VALUES (
            auth.uid(),
            NEW.id,
            'UPDATE',
            'empresa',
            NEW.id::text,
            changes_json
        );
    END IF;
    
    -- Definir quem fez a alteração
    NEW.updated_by := auth.uid();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para log de alterações
DROP TRIGGER IF EXISTS empresa_changes_log ON public.empresas;
CREATE TRIGGER empresa_changes_log
    BEFORE UPDATE ON public.empresas
    FOR EACH ROW
    EXECUTE FUNCTION public.log_empresa_changes();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON public.empresas(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_empresas_nome_fantasia ON public.empresas(nome_fantasia);

-- Constraint de CNPJ único
ALTER TABLE public.empresas ADD CONSTRAINT unique_cnpj UNIQUE (cnpj) DEFERRABLE INITIALLY DEFERRED;