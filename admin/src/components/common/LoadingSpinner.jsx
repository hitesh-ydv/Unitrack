import React from "react";
import { Loader2 } from "lucide-react";

export const LoadingSpinner = ({ message = "Loading data...", size = "md" }) => {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 space-y-3">
      <Loader2 className={`${sizeMap[size] || sizeMap.md} text-indigo-400 animate-spin`} />
      {message && <p className="text-xs text-slate-400 tracking-wide font-medium">{message}</p>}
    </div>
  );
};
