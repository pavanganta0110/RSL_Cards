import React from "react";
import { View } from "react-native";
import { Typography } from "../ui/Typography";
import { COLORS } from "../../constants/theme";
import CardPilotMobileConfirmation from "./CardPilotMobileConfirmation";
import CardPilotMobileResultCard from "./CardPilotMobileResultCard";

export interface MobileChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actionRequired?: {
    actionId: string;
    actionType: string;
    message: string;
  } | null;
  searchResults?: any[];
}

interface CardPilotMobileMessageProps {
  message: MobileChatMessage;
  onConfirmAction: (id: string) => Promise<void>;
  onCancelAction: (id: string) => Promise<void>;
  onAddToWatchlist: (item: any) => Promise<void>;
  onAddToInventory: (item: any) => Promise<void>;
}

export default function CardPilotMobileMessage({
  message,
  onConfirmAction,
  onCancelAction,
  onAddToWatchlist,
  onAddToInventory,
}: CardPilotMobileMessageProps) {
  const isBot = message.role === "assistant";

  return (
    <View
      style={{
        padding: 12,
        borderRadius: 16,
        backgroundColor: isBot ? COLORS.zinc900 : COLORS.zinc800,
        alignSelf: isBot ? "flex-start" : "flex-end",
        maxWidth: "85%",
        marginVertical: 4,
        gap: 6,
      }}
    >
      <Typography variant="label" color={isBot ? COLORS.primary : COLORS.zinc500} weight="700">
        {isBot ? "CardPilot" : "You"}
      </Typography>

      <Typography variant="body" color={COLORS.zinc100} style={{ lineHeight: 20 }}>
        {message.content}
      </Typography>

      {message.actionRequired && (
        <CardPilotMobileConfirmation
          actionId={message.actionRequired.actionId}
          actionType={message.actionRequired.actionType}
          message={message.content}
          onConfirm={onConfirmAction}
          onCancel={onCancelAction}
        />
      )}

      {message.searchResults && message.searchResults.length > 0 && (
        <View style={{ gap: 8, marginTop: 8 }}>
          {message.searchResults.map((item, idx) => (
            <CardPilotMobileResultCard
              key={item.itemId || idx}
              item={item}
              onAddToWatchlist={onAddToWatchlist}
              onAddToInventory={onAddToInventory}
            />
          ))}
        </View>
      )}
    </View>
  );
}
