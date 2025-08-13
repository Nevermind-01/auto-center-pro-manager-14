import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Search, LogOut, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { MigracaoEmpresaButton } from "@/components/MigracaoEmpresaButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, signOut } = useAuth();
  const { empresaAtual, loading: loadingEmpresa } = useEmpresa();

  const getInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <SidebarTrigger />
          
          {/* Indicador da Empresa Atual */}
          <div className="flex items-center space-x-2 px-3 py-1 bg-muted/50 rounded-md">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {loadingEmpresa ? 'Carregando...' : empresaAtual?.nome || 'Nenhuma empresa'}
            </span>
          </div>
          
          {/* Botão de migração temporário para usuários existentes */}
          {!loadingEmpresa && !empresaAtual && (
            <MigracaoEmpresaButton />
          )}
          
          <div className="hidden md:flex items-center space-x-2 max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar..." 
              className="border-0 bg-muted/50 focus-visible:ring-1"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 h-auto p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user ? getInitials(user.email || '') : 'AD'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">
                    {user?.user_metadata?.full_name || 'Usuário'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email || 'admin@autocenter.com'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="text-sm text-muted-foreground cursor-default">
                {user?.email || 'admin@autocenter.com'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={signOut}
                className="text-destructive cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}