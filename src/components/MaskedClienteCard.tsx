import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, EyeOff, Shield, Car } from 'lucide-react';
import { Cliente } from '@/hooks/useSupabaseQueries';
import { useAuditLog } from '@/hooks/useAuditLog';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface MaskedClienteCardProps {
  cliente: Cliente;
  onEdit: (cliente: Cliente) => void;
  onDelete: (id: string) => void;
  onViewVeiculos: (cliente: Cliente) => void;
}

export function MaskedClienteCard({ cliente, onEdit, onDelete, onViewVeiculos }: MaskedClienteCardProps) {
  const [showSensitive, setShowSensitive] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { logAction } = useAuditLog();

  // Check if user has admin role in current empresa
  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const { data, error } = await supabase.rpc('is_current_empresa_admin');
        if (!error) {
          setIsAdmin(data || false);
        }
      } catch (error) {
        logger.warn('Failed to check admin role:', error);
        setIsAdmin(false);
      }
    };

    checkAdminRole();
  }, []);
  
  const maskData = (data: string | null, showLast: number = 4): string => {
    if (!data || data.length <= showLast) return data || '';
    if (isAdmin || showSensitive) return data;
    return '*'.repeat(data.length - showLast) + data.slice(-showLast);
  };

  const toggleSensitiveData = async () => {
    const newShowState = !showSensitive;
    setShowSensitive(newShowState);
    
    // Log PII access for audit purposes
    if (newShowState) {
      await logAction({
        action: 'PII_ACCESS',
        resource_type: 'cliente',
        resource_id: cliente.id,
        details: {
          cliente_nome: cliente.nome,
          accessed_fields: ['email', 'telefone', 'cpf', 'cnpj', 'rg'].filter(field => 
            cliente[field as keyof Cliente]
          )
        }
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{cliente.nome}</h3>
              {(cliente.cpf || cliente.cnpj || cliente.rg) && (
                <div title="Dados sensíveis protegidos">
                  <Shield className="w-4 h-4 text-amber-500" />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                {cliente.email && (
                  <p>
                    Email: <span className="font-mono">{maskData(cliente.email)}</span>
                  </p>
                )}
                {cliente.telefone && (
                  <p>
                    Telefone: <span className="font-mono">{maskData(cliente.telefone)}</span>
                  </p>
                )}
                {cliente.cpf && (
                  <p>
                    CPF: <span className="font-mono">{maskData(cliente.cpf)}</span>
                  </p>
                )}
                {cliente.cnpj && (
                  <p>
                    CNPJ: <span className="font-mono">{maskData(cliente.cnpj)}</span>
                  </p>
                )}
                {cliente.rg && (
                  <p>
                    RG: <span className="font-mono">{maskData(cliente.rg)}</span>
                  </p>
                )}
              </div>
              <div>
                {(cliente.rua || cliente.numero_residencia || cliente.bairro || cliente.cidade || cliente.estado) && (
                  <div>
                    <p className="font-medium">Endereço:</p>
                    {cliente.rua && (
                      <p>{cliente.rua}{cliente.numero_residencia && `, ${cliente.numero_residencia}`}</p>
                    )}
                    {cliente.bairro && <p>{cliente.bairro}</p>}
                    {cliente.cidade && (
                      <p>{cliente.cidade}{cliente.estado && ` - ${cliente.estado}`}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {(cliente.cpf || cliente.cnpj || cliente.rg || cliente.email || cliente.telefone) && (
              <div className="pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSensitiveData}
                  className="text-xs"
                >
                  {showSensitive ? (
                    <>
                      <EyeOff className="w-3 h-3 mr-1" />
                      Ocultar dados sensíveis
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 mr-1" />
                      Mostrar dados sensíveis
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewVeiculos(cliente)}
              title="Visualizar veículos"
            >
              <Car className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(cliente)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(cliente.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}