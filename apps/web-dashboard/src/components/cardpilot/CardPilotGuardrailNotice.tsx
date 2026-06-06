import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function CardPilotGuardrailNotice() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold block mb-0.5">CardPilot AI Scope Guardrails</span>
        I am programmed to assist exclusively with sports card databases, inventory pricing, transactions, sold listings, and dealer operations. Unrelated queries will be politely rejected.
      </div>
    </div>
  );
}
