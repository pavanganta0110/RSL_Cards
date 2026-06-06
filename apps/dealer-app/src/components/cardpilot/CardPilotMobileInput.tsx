import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Keyboard, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/theme";
import CardPilotMobileVoiceButton from "./CardPilotMobileVoiceButton";

interface CardPilotMobileInputProps {
  onSendMessage: (text: string) => void;
  loading: boolean;
  isTranscribing?: boolean;
}

export default function CardPilotMobileInput({
  onSendMessage,
  loading,
  isTranscribing,
}: CardPilotMobileInputProps) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim() || loading) return;
    onSendMessage(text.trim());
    setText("");
    Keyboard.dismiss();
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: COLORS.zinc950,
        padding: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
      }}
    >
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Ask CardPilot..."
        placeholderTextColor={COLORS.zinc500}
        editable={!loading}
        style={{
          flex: 1,
          height: 48,
          borderRadius: 24,
          backgroundColor: COLORS.zinc900,
          borderWidth: 1,
          borderColor: COLORS.border,
          paddingHorizontal: 16,
          color: COLORS.white,
          fontSize: 15,
        }}
      />

      <CardPilotMobileVoiceButton
        onTranscript={(transcribedText) => {
          if (transcribedText) {
            onSendMessage(transcribedText);
          }
        }}
        isTranscribing={isTranscribing}
      />

      <TouchableOpacity
        onPress={handleSend}
        disabled={!text.trim() || loading}
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: text.trim() && !loading ? COLORS.primary : COLORS.zinc800,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Ionicons
            name="send"
            size={20}
            color={text.trim() && !loading ? COLORS.white : COLORS.zinc500}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}
