import React, { useRef, useEffect } from "react";
import { View, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/theme";
import { Typography } from "../ui/Typography";
import CardPilotMobileMessage, { MobileChatMessage } from "./CardPilotMobileMessage";

interface CardPilotMobileChatProps {
  messages: MobileChatMessage[];
  loading: boolean;
  onConfirmAction: (actionId: string) => Promise<void>;
  onCancelAction: (actionId: string) => Promise<void>;
  onAddToWatchlist: (item: any) => Promise<void>;
  onAddToInventory: (item: any) => Promise<void>;
}

export default function CardPilotMobileChat({
  messages,
  loading,
  onConfirmAction,
  onCancelAction,
  onAddToWatchlist,
  onAddToInventory,
}: CardPilotMobileChatProps) {
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, loading]);

  const renderHeader = () => (
    <View
      style={{
        padding: 12,
        borderRadius: 12,
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        borderWidth: 1,
        borderColor: "rgba(245, 158, 11, 0.2)",
        flexDirection: "row",
        gap: 10,
        marginHorizontal: 12,
        marginTop: 12,
        marginBottom: 8,
      }}
    >
      <Ionicons name="warning" size={20} color={COLORS.warning} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Typography variant="body" color={COLORS.warning} weight="700" style={{ marginBottom: 2 }}>
          CardPilot AI Scope Guardrails
        </Typography>
        <Typography variant="label" color={COLORS.warning}>
          I can only help with sports cards, inventory, pricing, listings, sales, and dealer operations. Unrelated queries will be politely rejected.
        </Typography>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 12, marginHorizontal: 12 }}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Typography variant="body" color={COLORS.zinc400}>
          CardPilot is thinking and checking comps...
        </Typography>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
      <Ionicons name="sparkles" size={48} color={COLORS.primary} />
      <Typography variant="h3" color={COLORS.white} weight="700" style={{ textAlign: "center" }}>
        Welcome to CardPilot AI
      </Typography>
      <Typography variant="body" color={COLORS.zinc400} style={{ textAlign: "center", lineHeight: 20 }}>
        Ask me sports card questions, comps analysis, price updates, or trigger listings. E.g., "What is my total portfolio valuation?" or "Search Mahomes Prizm comps".
      </Typography>
    </View>
  );

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
      style={{ flex: 1, backgroundColor: COLORS.background }}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 12, marginVertical: 2 }}>
          <CardPilotMobileMessage
            message={item}
            onConfirmAction={onConfirmAction}
            onCancelAction={onCancelAction}
            onAddToWatchlist={onAddToWatchlist}
            onAddToInventory={onAddToInventory}
          />
        </View>
      )}
    />
  );
}
