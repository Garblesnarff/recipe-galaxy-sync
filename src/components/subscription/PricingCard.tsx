import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  title: string;
  price: string;
  originalPrice?: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  savings?: string;
}

export const PricingCard = ({ title, price, originalPrice, features, highlighted, badge, savings }: PricingCardProps) => {
  return (
    <div className={cn("p-6 rounded-lg border relative", highlighted ? "border-green-500 bg-green-50" : "border-gray-300")}>
      {badge && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
            {badge}
          </div>
        </div>
      )}
      
      <h3 className="text-2xl font-bold">{title}</h3>
      
      <div className="my-4">
        <div className="flex items-center justify-center">
          {originalPrice && (
            <span className="text-lg text-gray-500 line-through mr-2">{originalPrice}</span>
          )}
          <p className="text-4xl font-bold">{price}</p>
        </div>
        {savings && (
          <p className="text-center text-green-600 font-medium text-sm mt-1">{savings}</p>
        )}
      </div>
      
      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center">
            <Check className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      
      <Button className={cn("w-full mt-6 text-lg py-3", highlighted ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700")}>
        {highlighted ? "Get MY Pro Recipes →" : "Start Free"}
      </Button>
      
      {highlighted && (
        <p className="text-xs text-center text-gray-600 mt-2">
          30-day money-back guarantee • Cancel anytime
        </p>
      )}
    </div>
  );
};
