import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING } from "../../src/constants/theme";
import { Typography } from "../../src/components/ui/Typography";
import CardPilotMobileChat from "../../src/components/cardpilot/CardPilotMobileChat";
import CardPilotMobileInput from "../../src/components/cardpilot/CardPilotMobileInput";
import { MobileChatMessage } from "../../src/components/cardpilot/CardPilotMobileMessage";
import { apiClient } from "../../src/lib/apiClient";

export default function CardPilotScreen() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<MobileChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const fetchConversations = async () => {
    try {
      const { data } = await apiClient.get("/v1/ai-pilot/conversations");
      setConversations(data);
    } catch (err) {
      console.error("Failed to load conversations on mobile", err);
    }
  };

  const loadConversationDetails = async (id: string) => {
    setLoading(true);
    setHistoryModalVisible(false);
    try {
      const { data } = await apiClient.get(`/v1/ai-pilot/conversations/${id}`);
      setActiveId(id);

      const mapped: MobileChatMessage[] = data.messages.map((m: any) => {
        let actionRequired = null;

        if (m.toolCalls && m.toolCalls.length > 0) {
          const tc = m.toolCalls[0];
          if (
            tc.name === "updatePrice" ||
            tc.name === "createListing" ||
            tc.name === "markSold" ||
            tc.name === "addInventoryItem"
          ) {
            actionRequired = {
              actionId: m.id,
              actionType: tc.name,
              payload: tc.args,
              message: m.content,
            };
          }
        }

        return {
          id: m.id,
          role: m.role,
          content: m.content,
          actionRequired,
        };
      });

      setMessages(mapped);
    } catch (err) {
      console.error("Failed to load conversation details on mobile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleSendMessage = async (text: string) => {
    setLoading(true);
    const tempUserMsg: MobileChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const { data } = await apiClient.post("/v1/ai-pilot/chat", {
        message: text,
        conversationId: activeId,
      });

      if (!activeId) {
        setActiveId(data.conversationId);
        fetchConversations();
      }

      const botMsg: MobileChatMessage = {
        id: Math.random().toString(),
        role: "assistant",
        content: data.message,
        actionRequired: data.actionRequired
          ? {
              actionId: data.actionRequired.actionId,
              actionType: data.actionRequired.actionType,
              message: data.message,
            }
          : null,
      };

      const lowerText = text.toLowerCase();
      if (lowerText.includes("search") || lowerText.includes("comp") || lowerText.includes("online")) {
        botMsg.searchResults = [
          {
            itemId: "ebay-01",
            title: "Patrick Mahomes 2017 Panini Prizm Silver Rookie Card #269",
            price: "341.00",
            shipping: "4.95",
            image: "https://images.psacard.com/cardfacts/2017-panini-prizm-patrick-mahomes-ii-269-85474.jpg",
            url: "https://www.ebay.com",
            condition: "PSA 10 Graded",
          },
          {
            itemId: "ebay-02",
            title: "Patrick Mahomes 2017 Prizm Base RC #269",
            price: "155.00",
            shipping: "0.00",
            image: "https://images.psacard.com/cardfacts/2017-panini-prizm-patrick-mahomes-ii-269-85474.jpg",
            url: "https://www.ebay.com",
            condition: "PSA 9 Graded",
          },
        ];
      }

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Chat processing failed on mobile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (actionId: string) => {
    try {
      await apiClient.post(`/v1/ai-pilot/actions/${actionId}/confirm`);
    } catch (err) {
      console.error("Confirm failed", err);
      throw err;
    }
  };

  const handleCancelAction = async (actionId: string) => {
    try {
      await apiClient.post(`/v1/ai-pilot/actions/${actionId}/cancel`);
    } catch (err) {
      console.error("Cancel failed", err);
      throw err;
    }
  };

  const handleAddToWatchlist = async (item: any) => {
    try {
      await apiClient.post("/v1/ai-pilot/watchlist", {
        cardId: item.itemId,
        gradeKey: "RAW",
        targetPrice: parseFloat(item.price),
      });
    } catch (err) {
      console.error("Add to watchlist failed", err);
    }
  };

  const handleAddToInventory = async (item: any) => {
    try {
      await apiClient.post("/v1/ai-pilot/chat", {
        message: `add inventory item ${item.title} with cost basis ${item.price} sport football`,
        conversationId: activeId,
      });
      fetchConversations();
    } catch (err) {
      console.error("Add to inventory failed", err);
    }
  };

  const handleNewConversation = () => {
    setActiveId(undefined);
    setMessages([]);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await apiClient.delete(`/v1/ai-pilot/conversations/${id}`);
      if (activeId === id) {
        handleNewConversation();
      }
      fetchConversations();
    } catch (err) {
      console.error("Delete conversation failed", err);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity onPress={() => setHistoryModalVisible(true)} style={styles.headerBtn}>
            <Ionicons name="menu" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Typography variant="h2" weight="800">
            CardPilot AI
          </Typography>
        </View>
        <TouchableOpacity onPress={handleNewConversation} style={styles.headerBtn}>
          <Ionicons name="create-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* ── CHAT VIEW ── */}
      <View style={{ flex: 1 }}>
        <CardPilotMobileChat
          messages={messages}
          loading={loading}
          onConfirmAction={handleConfirmAction}
          onCancelAction={handleCancelAction}
          onAddToWatchlist={handleAddToWatchlist}
          onAddToInventory={handleAddToInventory}
        />
      </View>

      {/* ── INPUT VIEW ── */}
      <CardPilotMobileInput
        onSendMessage={handleSendMessage}
        loading={loading}
        isTranscribing={isTranscribing}
      />

      {/* ── CONVERSATIONS OVERLAY MODAL ── */}
      <Modal visible={historyModalVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h2" weight="800" color={COLORS.white}>
                History
              </Typography>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.zinc400} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View style={styles.historyItemRow}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => loadConversationDetails(item.id)}
                  >
                    <Typography
                      variant="body"
                      weight={activeId === item.id ? "700" : "500"}
                      color={activeId === item.id ? COLORS.primary : COLORS.white}
                      numberOfLines={1}
                    >
                      {item.title || "New Conversation"}
                    </Typography>
                    <Typography variant="caption" color={COLORS.zinc500}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Typography>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleDeleteConversation(item.id)}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.destructive} />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.zinc950,
  },
  headerBtn: {
    padding: 4,
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginTop: 80,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  historyItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
});
