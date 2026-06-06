import React, { useState } from "react";
import { TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/theme";

interface CardPilotMobileVoiceButtonProps {
  onTranscript: (text: string) => void;
  isTranscribing?: boolean;
}

export default function CardPilotMobileVoiceButton({
  onTranscript,
  isTranscribing,
}: CardPilotMobileVoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false);

  const handlePress = () => {
    if (isRecording) {
      setIsRecording(false);
      onTranscript("What is my total portfolio valuation?");
    } else {
      setIsRecording(true);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isTranscribing}
      style={{
        padding: 12,
        borderRadius: 24,
        backgroundColor: isRecording ? COLORS.primary + "33" : COLORS.zinc800,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {isTranscribing ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <Ionicons
          name={isRecording ? "square" : "mic"}
          size={20}
          color={isRecording ? COLORS.primary : COLORS.zinc300}
        />
      )}
    </TouchableOpacity>
  );
}
