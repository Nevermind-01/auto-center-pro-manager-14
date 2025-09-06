import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle } from "lucide-react";

interface ProdutoOnlyWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onReject: () => void;
}

export const ProdutoOnlyWarningModal = ({
  isOpen,
  onClose,
  onConfirm,
  onReject
}: ProdutoOnlyWarningModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Venda Apenas de Produtos
          </DialogTitle>
          <DialogDescription>
            Esta OS contém apenas produtos, sem serviços ou mecânico vinculado. Deseja finalizar mesmo assim?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
          <Package className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-800">
            A OS será finalizada como venda de produtos apenas
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