"use client";
import { Store } from "lucide-react";

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-icon">
        <Store size={21} />
      </span>
      KOTONG<span className="brand-dot">.</span>
    </div>
  );
}
