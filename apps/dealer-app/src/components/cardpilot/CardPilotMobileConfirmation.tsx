import React, { useState } from "react";
import { View, TouchableOpacity, ActivityIndicator } from "react-native";
import { Typography } from "../ui/Typography";
import { COLORS } from "../../constants/theme";

interface CardPilotMobileConfirmationProps {
  actionId: string;
  actionType: string;
  message: string;
  onConfirm: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}

export default function CardPilotMobileConfirmation({
  actionId,
  actionType,
  message,
  onConfirm,
  onCancel,
}: CardPilotMobileConfirmationProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"pending" | "confirmed" | "cancelled">("pending");

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(actionId);
      setStatus("confirmed");
    } catch {
      // failed
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await onCancel(actionId);
      setStatus("cancelled");
    } catch {
      // failed
    } finally {
      setLoading(false);
    }
  };

  if (status === "confirmed") {
    return (
      <View style={{ padding: 12, borderRadius: 12, backgroundColor: "rgba(0, 200, 83, 0.1)", borderLeftWidth: 4, borderLeftColor: COLORS.primary, marginTop: 8 }}>
        <Typography variant="body" color={COLORS.primary}>✓ Action executed successfully.</Typography>
      </View>
    );
  }

  if (status === "cancelled") {
    return (
      <View style={{ padding: 12, borderRadius: 12, backgroundColor: COLORS.zinc800, marginTop: 8 }}>
        <Typography variant="body" color={COLORS.zinc400}>✕ Action cancelled by dealer.</Typography>
      </View>
    );
  }

  return (
    <View
      style={{
        padding: 12,
        borderRadius: 12,
        backgroundColor: COLORS.zinc900,
        borderColor: COLORS.primary + "55",
        borderWidth: 1,
        marginTop: 8,
        gap: 12,
      }}
    >
      <Typography variant="h3" color={COLORS.white} weight="700">
        Confirm Action Required
      </Typography>
      <Typography variant="body" color={COLORS.zinc300}>
        {message}
      </Typography>

      <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}>
        <TouchableOpacity
          onPress={handleCancel}
          disabled={loading}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: COLORS.zinc700,
          }}
        >
          <Typography variant="label" color={COLORS.zinc400}>
            Cancel
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={loading}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 8,
            backgroundColor: COLORS.primary,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {loading && <ActivityIndicator size="small" color={COLORS.white} style={{ marginRight: 6 }} />}
          <Typography variant="label" color={COLORS.white} weight="700">
            Confirm
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );
}
