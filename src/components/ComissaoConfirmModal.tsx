import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ComissaoConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onReject: () => void;
  mecanicoNome?: string;
}

export const ComissaoConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  onReject,
  mecanicoNome
}: ComissaoConfirmModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Calcular Comissão</DialogTitle>
          <DialogDescription>
            Deseja calcular comissão para o mecânico {mecanicoNome}?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onReject}>
            Não, finalizar sem comissão
          </Button>
          <Button onClick={onConfirm}>
            Sim, calcular comissão
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};