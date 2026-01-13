"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Carousel({ children, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      {children}
    </div>
  );
}

export function CarouselContent({ children, className = "" }) {
  return (
    <div className={`overflow-x-auto scrollbar-hide ${className}`}>
      <div className="flex gap-4 pb-4">
        {children}
      </div>
    </div>
  );
}

export function CarouselItem({ children, className = "" }) {
  return (
    <div className={`flex-shrink-0 ${className}`}>
      {children}
    </div>
  );
}

export function CarouselPrevious({ onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10 ${className}`}
      aria-label="Previous slide"
    >
      <ChevronLeft size={24} />
    </button>
  );
}

export function CarouselNext({ onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-10 ${className}`}
      aria-label="Next slide"
    >
      <ChevronRight size={24} />
    </button>
  );
}
