import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calculator, AlertTriangle } from "lucide-react";

interface ComissaoWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onReject: () => void;
  mecanicoNome?: string;
}

export const ComissaoWarningModal = ({
  isOpen,
  onClose,
  onConfirm,
  onReject,
  mecanicoNome
}: ComissaoWarningModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Comissão Não Marcada
          </DialogTitle>
          <DialogDescription>
            A comissão não está marcada para o mecânico {mecanicoNome}. Deseja finalizar sem registrar comissão?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
          <Calculator className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-800">
            A OS será finalizada sem comissão para o mecânico
          </span>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onReject}>
            Voltar e marcar comissão
          </Button>
          <Button onClick={onConfirm}>
            Finalizar sem comissão
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};