import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wrench, AlertTriangle } from "lucide-react";

interface ServiceWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onReject: () => void;
}

export const ServiceWarningModal = ({
  isOpen,
  onClose,
  onConfirm,
  onReject
}: ServiceWarningModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Serviço sem Mecânico
          </DialogTitle>
          <DialogDescription>
            Tem serviço vinculado porém não tem mecânico. Deseja mesmo finalizar a OS?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
          <Wrench className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-800">
            Os serviços serão finalizados sem mecânico responsável
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