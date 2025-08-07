import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Users } from "lucide-react";

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
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">👨‍🍳</span>
          </div>
          <DialogTitle className="text-xl">Keep Adapting Your Favorite Recipes!</DialogTitle>
          <DialogDescription className="text-base">
            You've discovered how easy it is to make any recipe work for your diet! 
            You've used <strong>{usageCount}/{limit}</strong> free adaptations this month.
          </DialogDescription>
        </DialogHeader>
        
        {/* Success momentum */}
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg my-4">
          <div className="flex items-center mb-2">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            <span className="font-medium text-green-800">Great progress!</span>
          </div>
          <p className="text-sm text-green-700">
            You just saved 30+ minutes of recipe research. Unlock unlimited adaptations to keep the momentum going!
          </p>
        </div>

        {/* Social proof */}
        <div className="bg-blue-50 p-3 rounded border mb-4">
          <div className="flex items-center mb-2">
            <Users className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium">Join 10,000+ home cooks</span>
          </div>
          <p className="text-sm text-blue-700 italic">
            "I adapted 47 recipes for my gluten-free family. Saved $200/month on groceries!" - Sarah M.
          </p>
        </div>

        {/* Value proposition */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            <span>Unlimited recipe adaptations</span>
          </div>
          <div className="flex items-center text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            <span>Match recipes to grocery sales (save 40%)</span>
          </div>
          <div className="flex items-center text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            <span>Export to shopping lists</span>
          </div>
        </div>

        {/* Urgency element */}
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4">
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-yellow-600 mr-2" />
            <span className="text-sm font-medium text-yellow-800">
              Limited time: First month only $4.99 (save $5)
            </span>
          </div>
        </div>

        <DialogFooter className="flex flex-col space-y-2">
          <Button onClick={onUpgrade} className="w-full bg-green-600 hover:bg-green-700 text-lg py-3">
            Get MY Unlimited Recipe Adaptations → $9.99/mo
          </Button>
          <Button variant="ghost" onClick={onClose} className="text-gray-500">
            Maybe later
          </Button>
          <p className="text-xs text-gray-500 text-center">
            30-day money-back guarantee • Cancel anytime
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
