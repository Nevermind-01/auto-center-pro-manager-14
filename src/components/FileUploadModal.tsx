import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, File, Image } from 'lucide-react';
import { useEmpresaFiles } from '@/hooks/useEmpresaFiles';
import { useAsyncAction } from '@/hooks/useAsyncAction';

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (url: string) => void;
  fileType: 'image' | 'document';
  fileName: string;
  title: string;
  description?: string;
}

export const FileUploadModal = ({ 
  open, 
  onOpenChange, 
  onSuccess, 
  fileType, 
  fileName, 
  title,
  description 
}: FileUploadModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { uploadFile } = useEmpresaFiles();

  const { execute: handleUpload, isLoading } = useAsyncAction(
    async () => {
      if (!selectedFile) return;
      
      const url = await uploadFile(selectedFile, fileName, fileType);
      if (url) {
        onSuccess(url);
        handleClose();
      }
    },
    'file-upload'
  );

  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Criar preview para imagens
      if (fileType === 'image' && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  }, [fileType]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
  }, []);

  const acceptedTypes = fileType === 'image' 
    ? '.png,.jpg,.jpeg,.svg' 
    : '.pdf,.p12,.pfx';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">
              Selecione o arquivo
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept={acceptedTypes}
              onChange={handleFileSelect}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: {acceptedTypes}. Máximo: 10MB
            </p>
          </div>

          {selectedFile && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {fileType === 'image' ? (
                    <Image className="h-8 w-8 text-primary" />
                  ) : (
                    <File className="h-8 w-8 text-primary" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {preview && (
                <div className="mt-3">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-32 w-full object-contain rounded"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isLoading}
            >
              {isLoading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar arquivo
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};