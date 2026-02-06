"use client";

import { InlineWidget } from "react-calendly";
import { Calendar, ExternalLink, AlertCircle } from "lucide-react";

export default function CalendlyWidget({ url }) {
  if (!url) {
    return (
      <div className="bg-white rounded-md border border-dashed border-border p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-background-light flex items-center justify-center text-text-muted">
          <Calendar size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-text-heading">No Calendly Link Found</h3>
          <p className="text-xs text-text-muted max-w-[240px]">
            Please add your Calendly URL in your Profile Settings to enable the scheduling widget.
          </p>
        </div>
        <button 
          onClick={() => window.location.href = "/settings"}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
        >
          Go to Settings <ExternalLink size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md border border-border shadow-lg shadow-primary/5 overflow-hidden flex flex-col min-h-[650px]">
      <div className="p-4 border-b border-border bg-background-light/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-heading leading-tight">Your Scheduler</h3>
            <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Live Calendly Widget</p>
          </div>
        </div>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 rounded-md hover:bg-white text-text-muted hover:text-primary transition-colors border border-transparent hover:border-border"
          title="Open in new tab"
        >
          <ExternalLink size={16} />
        </a>
      </div>
      <div className="flex-1 w-full bg-white">
        <InlineWidget 
          url={url} 
          styles={{
            height: "100%",
            width: "100%"
          }}
          pageSettings={{
            backgroundColor: 'ffffff',
            hideEventTypeDetails: false,
            hideLandingPageDetails: false,
            primaryColor: '006bff',
            textColor: '4d5055'
          }}
        />
      </div>
    </div>
  );
}
