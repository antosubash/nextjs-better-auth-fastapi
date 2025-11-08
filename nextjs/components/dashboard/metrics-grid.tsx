import { ReactNode } from "react";

interface MetricsGridProps {
  children: ReactNode;
  className?: string;
}

export function MetricsGrid({ children, className = "" }: MetricsGridProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}
    >
      {children}
    </div>
  );
}

