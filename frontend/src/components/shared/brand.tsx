"use client";
import { BrandMark } from "@/components/shared/brand-mark";

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-icon">
        <BrandMark />
      </span>
      KOTONG<span className="brand-dot">.</span>
    </div>
  );
}
