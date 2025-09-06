import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, AlertTriangle } from "lucide-react";

interface MecanicoWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onReject: () => void;
}

export const MecanicoWarningModal = ({
  isOpen,
  onClose,
  onConfirm,
  onReject
}: MecanicoWarningModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Mecânico sem Serviços
          </DialogTitle>
          <DialogDescription>
            Tem mecânico porém não tem serviço vinculado. Deseja mesmo finalizar a OS?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
          <User className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-800">
            O mecânico está vinculado mas não há serviços para executar
          </span>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onReject}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>
            Sim, finalizar OS
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};