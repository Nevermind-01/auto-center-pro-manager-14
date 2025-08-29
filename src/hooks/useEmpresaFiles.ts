import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaContext } from './useEmpresaContext';
import { toast } from '@/hooks/use-toast';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/x-pkcs12'];

export const useEmpresaFiles = () => {
  const { empresaId } = useEmpresaContext();
  const [uploading, setUploading] = useState(false);

  const validateFile = useCallback((file: File, type: 'image' | 'document'): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Erro",
        description: "Arquivo muito grande. Máximo 10MB.",
        variant: "destructive"
      });
      return false;
    }

    const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erro",
        description: `Tipo de arquivo não suportado. Use: ${allowedTypes.join(', ')}`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  }, []);

  const uploadFile = useCallback(async (
    file: File, 
    fileName: string, 
    type: 'image' | 'document'
  ): Promise<string | null> => {
    if (!empresaId) {
      toast({
        title: "Erro",
        description: "Empresa não identificada",
        variant: "destructive"
      });
      return null;
    }

    if (!validateFile(file, type)) return null;
    
    setUploading(true);
    try {
      const fileExtension = file.name.split('.').pop();
      const filePath = `${empresaId}/${type}s/${fileName}.${fileExtension}`;
      
      const { error: uploadError } = await supabase.storage
        .from('empresa-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        toast({
          title: "Erro",
          description: "Falha no upload do arquivo",
          variant: "destructive"
        });
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('empresa-files')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erro inesperado no upload:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado no upload",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  }, [empresaId, validateFile]);

  const deleteFile = useCallback(async (filePath: string): Promise<boolean> => {
    if (!empresaId) return false;
    
    try {
      // Extrair path relativo da URL completa
      const pathParts = filePath.split('/empresa-files/');
      const relativePath = pathParts[1];
      
      if (!relativePath) return false;
      
      const { error } = await supabase.storage
        .from('empresa-files')
        .remove([relativePath]);

      if (error) {
        console.error('Erro ao deletar arquivo:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro inesperado na deleção:', error);
      return false;
    }
  }, [empresaId]);

  const getFileUrl = useCallback((filePath: string): string => {
    if (!filePath) return '';
    
    // Se já é uma URL completa, retornar como está
    if (filePath.startsWith('http')) return filePath;
    
    // Caso contrário, gerar URL público
    const { data: { publicUrl } } = supabase.storage
      .from('empresa-files')
      .getPublicUrl(filePath);
    
    return publicUrl;
  }, []);

  const convertImageToBase64 = useCallback(async (imageUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Falha ao carregar imagem');
      
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Erro ao converter imagem para base64:', error);
      return null;
    }
  }, []);

  return {
    uploading,
    uploadFile,
    deleteFile,
    getFileUrl,
    validateFile,
    convertImageToBase64,
  };
};