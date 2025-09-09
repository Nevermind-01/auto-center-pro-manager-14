import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface ConfirmDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  osNumero: string;
}

export function ConfirmDeleteModal({
  open,
  onOpenChange,
  onConfirm,
  osNumero,
}: ConfirmDeleteModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir OS {osNumero}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-2">
            <p>
              <strong>Esta ação não pode ser desfeita.</strong>
            </p>
            <p>
              A OS <strong>{osNumero}</strong> e todos os dados relacionados serão excluídos permanentemente:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Produtos e serviços da OS</li>
              <li>Comissões associadas</li>
              <li>Movimentações de caixa relacionadas</li>
              <li>Histórico de movimentações</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              Apenas OS canceladas podem ser excluídas.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir Permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}