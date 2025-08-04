import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  title: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}

export const PricingCard = ({ title, price, features, highlighted }: PricingCardProps) => {
  return (
    <div className={cn("p-6 rounded-lg border", highlighted ? "border-green-500" : "border-gray-300")}>
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="text-4xl font-bold my-4">{price}</p>
      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center">
            <Check className="h-5 w-5 text-green-500 mr-2" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button className={cn("w-full mt-6", highlighted && "bg-green-600 hover:bg-green-700")}>
        Get Started
      </Button>
    </div>
  );
};
