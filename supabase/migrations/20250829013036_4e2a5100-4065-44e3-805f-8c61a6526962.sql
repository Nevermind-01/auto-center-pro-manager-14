-- Corrigir função log_empresa_changes para usar UUID correto
CREATE OR REPLACE FUNCTION public.log_empresa_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
            NEW.id,
            changes_json
        );
    END IF;
    
    -- Definir quem fez a alteração
    NEW.updated_by := auth.uid();
    
    RETURN NEW;
END;
$function$