import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  usageCount: number;
  limit: number;
  onUpgrade: () => void;
}

export const PaywallModal = ({ isOpen, onClose, feature, usageCount, limit, onUpgrade }: PaywallModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade to Pro</DialogTitle>
          <DialogDescription>
            You've used {usageCount}/{limit} free {feature}s this month. Upgrade to Pro for unlimited access.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onUpgrade}>Upgrade</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
