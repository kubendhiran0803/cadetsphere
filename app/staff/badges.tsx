import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

interface Cadet {
    id: number;
    name: string;
    email: string;
}

interface Badge {
    id: number;
    cadet_email: string;
    badge_name: string;
    badge_icon: string;
    reason: string;
    awarded_by: string;
    awarded_at: string;
}

const AVAILABLE_BADGES = [
    { name: "Recruit", icon: "account-hard-hat", color: "#6B7280" }, // Grey
    { name: "Bronze Star", icon: "star-circle", color: "#CD7F32" }, // Bronze
    { name: "Silver Star", icon: "star-circle", color: "#C0C0C0" }, // Silver
    { name: "Gold Star", icon: "star-circle", color: "#FFD700" }, // Gold
    { name: "Leadership", icon: "shield-account", color: "#4F46E5" }, // Indigo
    { name: "Discipline", icon: "police-badge", color: "#EF4444" }, // Red
    { name: "All-Rounder", icon: "trophy", color: "#8B5CF6" }, // Violet
];

export default function BadgesManager() {
    const router = useRouter();
    const [cadets, setCadets] = useState<Cadet[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCadet, setSelectedCadet] = useState<Cadet | null>(null);
    const [cadetBadges, setCadetBadges] = useState<Badge[]>([]);

    // Award Modal
    const [modalVisible, setModalVisible] = useState(false);

    const BASE_URL = "http://192.168.43.201:5000/api";

    const fetchCadets = async () => {
        try {
            const res = await fetch(`${BASE_URL}/badges/cadets`);
            const data = await res.json();
            if (res.ok) setCadets(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCadetBadges = async (email: string) => {
        try {
            const res = await fetch(`${BASE_URL}/badges/list/${email}`);
            const data = await res.json();
            if (res.ok) setCadetBadges(data);
        } catch (err) {
            console.error(err);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchCadets();
        }, [])
    );

    const handleSelectCadet = (cadet: Cadet) => {
        setSelectedCadet(cadet);
        fetchCadetBadges(cadet.email);
    };

    const awardBadge = async (badge: typeof AVAILABLE_BADGES[0]) => {
        if (!selectedCadet) return;
        try {
            const staffEmail = await AsyncStorage.getItem("userEmail") || "Staff"; // Fallback if no email
            const payload = {
                cadet_email: selectedCadet.email,
                badge_name: badge.name,
                badge_icon: badge.icon,
                awarded_by: staffEmail,
                reason: "Awarded by staff", // Could add input for this
            };

            const res = await fetch(`${BASE_URL}/badges/award`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                Alert.alert("Success", `Awarded ${badge.name} to ${selectedCadet.name}`);
                fetchCadetBadges(selectedCadet.email);
                setModalVisible(false);
            } else {
                Alert.alert("Error", "Failed to award badge");
            }
        } catch (err) {
            Alert.alert("Error", "Network error");
        }
    };

    const renderCadet = ({ item }: { item: Cadet }) => (
        <TouchableOpacity
            style={[
                styles.cadetCard,
                selectedCadet?.id === item.id && styles.cadetCardActive,
            ]}
            onPress={() => handleSelectCadet(item)}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View>
                <Text style={styles.cadetName}>{item.name}</Text>
                <Text style={styles.cadetEmail}>{item.email}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderBadge = ({ item }: { item: Badge }) => (
        <View style={styles.historyItem}>
            <View style={[styles.historyIcon, { backgroundColor: "#F3F4F6" }]}>
                <MaterialCommunityIcons name={item.badge_icon as any} size={24} color="#4F46E5" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.historyName}>{item.badge_name}</Text>
                <Text style={styles.historyMeta}>
                    By {item.awarded_by} • {new Date(item.awarded_at).toLocaleDateString()}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Badge Management</Text>
                <TouchableOpacity onPress={fetchCadets} style={{ marginLeft: "auto", padding: 8 }}>
                    <Ionicons name="refresh" size={24} color="#4F46E5" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Left Side: Cadet List */}
                <View style={styles.listContainer}>
                    <Text style={styles.sectionTitle}>Cadets</Text>
                    {loading ? (
                        <ActivityIndicator size="small" color="#4F46E5" />
                    ) : (
                        <FlatList
                            data={cadets}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderCadet}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>No cadets found.</Text>
                            }
                        />
                    )}
                </View>

                {/* Right Side / Detail View (if selected) */}
                {selectedCadet ? (
                    <View style={styles.detailContainer}>
                        <View style={styles.detailHeader}>
                            <Text style={styles.detailName}>{selectedCadet.name}</Text>
                            <Text style={styles.detailEmail}>{selectedCadet.email}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.awardButton}
                            onPress={() => setModalVisible(true)}
                        >
                            <MaterialCommunityIcons name="trophy-award" size={20} color="#fff" />
                            <Text style={styles.awardButtonText}>Award Badge</Text>
                        </TouchableOpacity>

                        <Text style={styles.historyTitle}>Badge History</Text>
                        <FlatList
                            data={cadetBadges}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderBadge}
                            ListEmptyComponent={<Text style={styles.emptyText}>No badges awarded yet.</Text>}
                        />
                    </View>
                ) : (
                    <View style={styles.placeholderContainer}>
                        <MaterialCommunityIcons name="shield-account-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.placeholderText}>Select a cadet to view or award badges</Text>
                    </View>
                )}
            </View>

            {/* Award Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Badge</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            <View style={styles.badgeGrid}>
                                {AVAILABLE_BADGES.map((b) => (
                                    <TouchableOpacity
                                        key={b.name}
                                        style={styles.badgeOption}
                                        onPress={() => awardBadge(b)}
                                    >
                                        <View style={[styles.badgeIconBg, { backgroundColor: b.color + '20' }]}>
                                            <MaterialCommunityIcons name={b.icon as any} size={32} color={b.color} />
                                        </View>
                                        <Text style={styles.badgeOptionText}>{b.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

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
        flexDirection: "column", // Can make this row for tablet
    },
    listContainer: {
        height: 200, // Fixed height for list part on mobile
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 12,
        color: "#4B5563",
    },
    cadetCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "transparent",
    },
    cadetCardActive: {
        backgroundColor: "#EEF2FF",
        borderColor: "#4F46E5",
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#C7D2FE",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#4F46E5",
    },
    cadetName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1F2937",
    },
    cadetEmail: {
        fontSize: 12,
        color: "#6B7280",
    },

    // Detail Area
    detailContainer: {
        flex: 1,
        padding: 20,
    },
    detailHeader: {
        marginBottom: 20,
    },
    detailName: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#111827",
    },
    detailEmail: {
        fontSize: 14,
        color: "#6B7280",
    },
    awardButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#4F46E5",
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    awardButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },
    historyTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 12,
        color: "#111827",
    },
    historyItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        elevation: 1,
    },
    historyIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    historyName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1F2937",
    },
    historyMeta: {
        fontSize: 12,
        color: "#6B7280",
    },
    emptyText: {
        textAlign: "center",
        color: "#9CA3AF",
        marginTop: 20,
    },

    // Placeholder
    placeholderContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    placeholderText: {
        marginTop: 16,
        fontSize: 16,
        color: "#9CA3AF",
        textAlign: "center",
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: "80%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#111827",
    },
    badgeGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    badgeOption: {
        width: "48%",
        backgroundColor: "#F9FAFB",
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    badgeIconBg: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    badgeOptionText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
    }
});
