
import * as React from "react";

export const ReplacementIcon = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    ref={ref}
    className={className}
    {...props}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 3H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z" />
    <path d="M12 11v5" />
    <path d="m9 11 3-3 3 3" />
    <path d="M9 18h6" />
  </svg>
));
ReplacementIcon.displayName = "ReplacementIcon";
