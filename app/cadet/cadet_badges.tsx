import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface Badge {
    id: number;
    cadet_email: string;
    badge_name: string;
    badge_icon: string;
    reason: string;
    awarded_by: string;
    awarded_at: string;
}

export default function CadetBadges() {
    const router = useRouter();
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    const BASE_URL = "http://192.168.43.201:5000/api";

    const fetchBadges = async (email: string) => {
        try {
            const res = await fetch(`${BASE_URL}/badges/list/${email}`);
            const data = await res.json();
            if (res.ok) {
                setBadges(data);
            } else {
                console.error("Failed to fetch badges");
            }
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Could not fetch badges. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            const init = async () => {
                const email = await AsyncStorage.getItem("userEmail");
                if (email) {
                    setUserEmail(email);
                    fetchBadges(email);
                } else {
                    setLoading(false);
                    Alert.alert("Error", "User email not found. Please log in again.");
                    router.replace("/");
                }
            };
            init();
        }, [])
    );

    const renderBadge = ({ item, index }: { item: Badge; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 100).springify()}
            style={styles.badgeCard}
        >
            <View style={[styles.iconContainer, { backgroundColor: "#FDF2F8" }]}>
                <MaterialCommunityIcons name={item.badge_icon as any} size={32} color="#DB2777" />
            </View>
            <View style={styles.badgeInfo}>
                <Text style={styles.badgeName}>{item.badge_name}</Text>
                <Text style={styles.badgeReason}>{item.reason}</Text>
                <Text style={styles.badgeMeta}>
                    Awarded by {item.awarded_by} • {new Date(item.awarded_at).toLocaleDateString()}
                </Text>
            </View>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Badges</Text>
            </View>

            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color="#EC4899" style={{ marginTop: 40 }} />
                ) : badges.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBg}>
                            <MaterialCommunityIcons name="medal-outline" size={64} color="#9CA3AF" />
                        </View>
                        <Text style={styles.emptyTitle}>No Badges Yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Keep working hard! Badges assigned by staff will appear here.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={badges}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderBadge}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        paddingTop: Platform.OS === "android" ? 40 : 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginLeft: 16,
        color: "#1F2937",
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#F3F4F6",
    },
    content: {
        flex: 1,
    },
    listContent: {
        padding: 16,
    },
    badgeCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    badgeInfo: {
        flex: 1,
    },
    badgeName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1F2937",
        marginBottom: 4,
    },
    badgeReason: {
        fontSize: 14,
        color: "#4B5563",
        marginBottom: 6,
    },
    badgeMeta: {
        fontSize: 12,
        color: "#9CA3AF",
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
    },
    emptyIconBg: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#E5E7EB",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#374151",
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 24,
    },
});
