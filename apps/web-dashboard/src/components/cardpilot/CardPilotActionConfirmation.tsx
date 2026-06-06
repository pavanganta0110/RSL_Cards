import React, { useState } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';

interface CardPilotActionConfirmationProps {
  actionId: string;
  actionType: string;
  payload: any;
  message: string;
  onConfirm: (actionId: string) => Promise<void>;
  onCancel: (actionId: string) => Promise<void>;
}

export default function CardPilotActionConfirmation({
  actionId,
  actionType,
  payload,
  message,
  onConfirm,
  onCancel,
}: CardPilotActionConfirmationProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'pending' | 'completed' | 'cancelled' | 'failed'>('pending');

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(actionId);
      setStatus('completed');
    } catch {
      setStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await onCancel(actionId);
      setStatus('cancelled');
    } catch {
      setStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'completed') {
    return (
      <div className="p-4 rounded-xl bg-success/10 border border-success/30 text-success text-sm flex items-center gap-2">
        <Check className="w-5 h-5" /> Action successfully executed and synced.
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="p-4 rounded-xl bg-border border border-border text-text-secondary text-sm flex items-center gap-2">
        <X className="w-5 h-5" /> Action cancelled by dealer.
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-surface border border-accent-blue/30 space-y-4">
      <div className="flex gap-3">
        <AlertTriangle className="w-5 h-5 text-accent-blue flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-white font-bold text-sm block">Action Required: Dealer Confirmation</span>
          <p className="text-text-secondary text-sm">{message}</p>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-white hover:bg-white/5 text-xs font-semibold transition-all duration-200"
        >
          <X className="w-4 h-4" /> Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-blue hover:bg-blue-600 text-white text-xs font-semibold transition-all duration-200"
        >
          <Check className="w-4 h-4" /> Confirm & Execute
        </button>
      </div>
    </div>
  );
}
