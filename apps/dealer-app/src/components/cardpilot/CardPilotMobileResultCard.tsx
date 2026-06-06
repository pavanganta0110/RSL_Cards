import React, { useState } from "react";
import { View, Image, TouchableOpacity } from "react-native";
import { Typography } from "../ui/Typography";
import { COLORS } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";

export interface MobileSearchResultItem {
  itemId: string;
  title: string;
  price: string;
  shipping: string;
  image?: string;
  url: string;
  condition?: string;
  grade?: string;
}

interface CardPilotMobileResultCardProps {
  item: MobileSearchResultItem;
  onAddToWatchlist: (item: MobileSearchResultItem) => Promise<void>;
  onAddToInventory: (item: MobileSearchResultItem) => Promise<void>;
}

export default function CardPilotMobileResultCard({
  item,
  onAddToWatchlist,
  onAddToInventory,
}: CardPilotMobileResultCardProps) {
  const [watchlistAdded, setWatchlistAdded] = useState(false);
  const [inventoryAdded, setInventoryAdded] = useState(false);

  const handleWatchlist = async () => {
    await onAddToWatchlist(item);
    setWatchlistAdded(true);
  };

  const handleInventory = async () => {
    await onAddToInventory(item);
    setInventoryAdded(true);
  };

  return (
    <View
      style={{
        flexDirection: "row",
        padding: 12,
        borderRadius: 12,
        backgroundColor: COLORS.zinc900,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 12,
      }}
    >
      {item.image && (
        <Image
          source={{ uri: item.image }}
          style={{ width: 60, height: 80, borderRadius: 8, backgroundColor: COLORS.zinc800 }}
          resizeMode="cover"
        />
      )}

      <View style={{ flex: 1, justifyContent: "space-between" }}>
        <Typography variant="body" color={COLORS.white} numberOfLines={2} weight="600">
          {item.title}
        </Typography>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Typography variant="h3" color={COLORS.primary} weight="700">
            ${item.price}
          </Typography>
          <Typography variant="label" color={COLORS.zinc500}>
            +${item.shipping} shipping
          </Typography>
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
          <TouchableOpacity
            onPress={handleWatchlist}
            disabled={watchlistAdded}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Ionicons
              name={watchlistAdded ? "checkmark-circle" : "eye"}
              size={14}
              color={watchlistAdded ? COLORS.primary : COLORS.zinc500}
            />
            <Typography variant="label" color={watchlistAdded ? COLORS.primary : COLORS.zinc500}>
              {watchlistAdded ? "Watched" : "Watchlist"}
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleInventory}
            disabled={inventoryAdded}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Ionicons
              name={inventoryAdded ? "checkmark-circle" : "cube"}
              size={14}
              color={inventoryAdded ? COLORS.primary : COLORS.zinc500}
            />
            <Typography variant="label" color={inventoryAdded ? COLORS.primary : COLORS.zinc500}>
              {inventoryAdded ? "Imported" : "Import"}
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
