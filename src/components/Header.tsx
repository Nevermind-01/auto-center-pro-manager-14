import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Header() {
  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <SidebarTrigger />
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
          
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                AD
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium">Administrador</p>
              <p className="text-xs text-muted-foreground">admin@autocenter.com</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}