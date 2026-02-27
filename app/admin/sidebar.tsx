// app/admin/sidebar.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import React from 'react';
import { Alert, Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type SidebarItemKey = "adduser" | "cadetfields" | "manage";

interface SidebarProps {
  onSelect: (key: SidebarItemKey) => void;
  active: string;
  vertical?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  showToggle?: boolean;
}

interface SidebarItem {
  key: SidebarItemKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export default function Sidebar({ onSelect, active, vertical = true, collapsed = false, onToggle = () => { }, showToggle = true }: SidebarProps) {
  const items: SidebarItem[] = [
    { key: "adduser", label: "Add User", icon: "person-add" },
    { key: "cadetfields", label: "Cadet Fields", icon: "list" },
    { key: "manage", label: "Manage", icon: "log-in" },
  ];

  const rotate = collapsed ? { transform: [{ rotate: "180deg" }] } : {};

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm("Are you sure you want to log out?");
      if (confirm) {
        AsyncStorage.clear().then(() => {
          router.replace('/');
        });
      }
    } else {
      Alert.alert(
        "Logout",
        "Are you sure you want to log out?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Logout",
            style: "destructive",
            onPress: async () => {
              await AsyncStorage.clear();
              router.replace('/');
            }
          }
        ]
      );
    }
  };

  if (!vertical) {
    return (
      <View style={[styles.sidebarHorizontalContainer]}>
        <View style={[styles.sidebar, styles.sidebarHorizontal, collapsed && styles.sidebarHorizontalCollapsed]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.item,
                  styles.itemHorizontal,
                  active === item.key && styles.activeItem,
                ]}
                onPress={() => onSelect(item.key)}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={active === item.key ? "#1d4ed8" : "#64748b"}
                />
                {!collapsed && (
                  <Text
                    style={[
                      styles.label,
                      styles.labelHorizontal,
                      active === item.key && styles.activeLabel,
                    ]}
                  >
                    {item.label}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={[styles.item, styles.itemHorizontal]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              {!collapsed && (
                <Text style={[styles.label, styles.labelHorizontal, { color: "#ef4444" }]}>
                  Logout
                </Text>
              )}
            </TouchableOpacity>

            {showToggle && (
              <TouchableOpacity
                accessibilityLabel={collapsed ? "Expand menu" : "Collapse menu"}
                onPress={onToggle}
                style={[styles.toggle, collapsed && styles.toggleCollapsed]}
                activeOpacity={0.9}
              >
                <Animated.View style={rotate}>
                  <Ionicons name={collapsed ? "chevron-down" : "chevron-up"} size={20} color="#1f3fb8" />
                </Animated.View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.sidebar, !vertical && styles.sidebarHorizontal]}>
      <View>
        {items.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.item,
              !vertical && styles.itemHorizontal,
              active === item.key && styles.activeItem,
            ]}
            onPress={() => onSelect(item.key)}
          >
            <Ionicons
              name={item.icon}
              size={22}
              color={active === item.key ? "#1d4ed8" : "#64748b"}
            />
            <Text
              style={[
                styles.label,
                !vertical && styles.labelHorizontal,
                active === item.key && styles.activeLabel,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.item, styles.logoutItem]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
        <Text style={[styles.label, { color: "#ef4444" }]}>
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 200, // Increased width for better proportions
    backgroundColor: "#ffffff", // simpler, cleaner background
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    justifyContent: "space-between", // Pushes logout to bottom
    height: "100%",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  sidebarHorizontal: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between", // Space between items and logout/toggle
    paddingVertical: 16,
    paddingTop: 60,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    height: 'auto',
  },
  itemHorizontal: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 0,
    borderRadius: 20,
    marginRight: 8,
  },
  activeItem: {
    backgroundColor: "#eff6ff", // Very subtle blue bg
  },
  label: {
    marginLeft: 12,
    fontSize: 15,
    color: "#64748b", // Slate 500
    fontWeight: "500",
  },
  labelHorizontal: {
    marginLeft: 8,
    fontSize: 14,
  },
  activeLabel: {
    color: "#1d4ed8", // Blue 700
    fontWeight: "600",
  },
  sidebarHorizontalContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  sidebarHorizontalCollapsed: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  toggle: {
    marginLeft: 12,
    backgroundColor: "#f1f5f9",
    padding: 10,
    borderRadius: 8,
  },
  toggleCollapsed: {
    backgroundColor: "#f8fafc",
  },
  // New entry for Logout button specifically if needed, or reuse item styles
  logoutItem: {
    marginTop: "auto", // Ensure it pushes down if justify-between doesn't catch it in some contexts
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 16,
  },
});

// (removed duplicate Sidebar implementation and styles)
