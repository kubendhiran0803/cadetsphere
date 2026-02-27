import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Linking,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

interface Report {
    id: number;
    cadet_email: string;
    cadet_name?: string;
    activity_type: string;
    event_name: string;
    organized_by: string;
    start_date: string;
    end_date: string;
    duration_days: number;
    location: string;
    evidence_url?: string;
    photos?: string; // JSON string
    status: string;
    created_at: string;
}

export default function StaffReportsReview() {
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const BASE_URL = "http://192.168.43.201:5000/api";

    const fetchReports = async () => {
        try {
            const email = await AsyncStorage.getItem("userEmail");
            if (!email) {
                Alert.alert("Error", "User email not found");
                return;
            }

            const res = await fetch(`${BASE_URL}/reports/staff/${email}`);
            const data = await res.json();
            if (res.ok) setReports(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchReports();
        }, [])
    );

    const updateStatus = async (status: string) => {
        if (!selectedReport) return;
        try {
            const res = await fetch(`${BASE_URL}/reports/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: selectedReport.id, status }),
            });

            if (res.ok) {
                Alert.alert("Success", `Report ${status}`);
                setModalVisible(false);
                fetchReports(); // Refresh list
            }
        } catch (err) {
            Alert.alert("Error", "Failed to update status");
        }
    };

    const openLink = (url: string) => {
        if (url) {
            // Check if full URL or relative
            const finalUrl = url.startsWith("http") ? url : `${BASE_URL.replace("/api", "")}${url}`;
            Linking.openURL(finalUrl).catch(err => Alert.alert("Error", "Could not open file"));
        }
    };

    const renderReportItem = ({ item }: { item: Report }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => {
                setSelectedReport(item);
                setModalVisible(true);
            }}
        >
            <View style={styles.cardHeader}>
                <View style={styles.badgeContainer}>
                    <Text style={styles.activityBadge}>{item.activity_type}</Text>
                </View>
                <Text style={[
                    styles.statusBadge,
                    item.status === 'Approved' ? styles.statusApproved :
                        item.status === 'Rejected' ? styles.statusRejected : styles.statusPending
                ]}>
                    {item.status}
                </Text>
            </View>
            <Text style={styles.cardTitle}>{item.event_name}</Text>
            <Text style={styles.cardSubtitle}>By {item.cadet_name || item.cadet_email}</Text>
            <View style={styles.cardFooter}>
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text style={styles.cardDate}> Submitted: {new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderDetailModal = () => {
        if (!selectedReport) return null;

        const photos = selectedReport.photos ? JSON.parse(selectedReport.photos) : [];

        return (
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Report Details</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close-circle" size={32} color="#4B5563" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <View style={styles.detailSection}>
                            <Text style={styles.label}>Cadet</Text>
                            <Text style={styles.value}>{selectedReport.cadet_name || selectedReport.cadet_email}</Text>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.half}>
                                <Text style={styles.label}>Type</Text>
                                <Text style={styles.value}>{selectedReport.activity_type}</Text>
                            </View>
                            <View style={styles.half}>
                                <Text style={styles.label}>Duration</Text>
                                <Text style={styles.value}>{selectedReport.duration_days} Days</Text>
                            </View>
                        </View>

                        <View style={styles.detailSection}>
                            <Text style={styles.label}>Event Name</Text>
                            <Text style={styles.value}>{selectedReport.event_name}</Text>
                        </View>

                        <View style={styles.detailSection}>
                            <Text style={styles.label}>Organized By</Text>
                            <Text style={styles.value}>{selectedReport.organized_by}</Text>
                        </View>

                        <View style={styles.detailSection}>
                            <Text style={styles.label}>Location</Text>
                            <Text style={styles.value}>{selectedReport.location}</Text>
                        </View>

                        <View style={styles.detailSection}>
                            <Text style={styles.label}>Dates</Text>
                            <Text style={styles.value}>
                                {new Date(selectedReport.start_date).toLocaleDateString()} - {new Date(selectedReport.end_date).toLocaleDateString()}
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <Text style={styles.sectionHeader}>Evidence & Photos</Text>

                        {selectedReport.evidence_url ? (
                            <TouchableOpacity
                                style={styles.fileButton}
                                onPress={() => openLink(selectedReport.evidence_url!)}
                            >
                                <MaterialCommunityIcons name="file-document-outline" size={24} color="#4F46E5" />
                                <Text style={styles.fileButtonText}>View Certificate / Document</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.noData}>No document attached</Text>
                        )}

                        <ScrollView horizontal style={styles.photoScroll} showsHorizontalScrollIndicator={false}>
                            {photos.length > 0 ? photos.map((url: string, index: number) => (
                                <TouchableOpacity key={index} onPress={() => openLink(url)}>
                                    <Image
                                        source={{ uri: url.startsWith("http") ? url : `${BASE_URL.replace("/api", "")}${url}` }}
                                        style={styles.photoDetail}
                                    />
                                </TouchableOpacity>
                            )) : <Text style={styles.noData}>No photos uploaded</Text>}
                        </ScrollView>

                    </ScrollView>

                    {selectedReport.status === 'Pending' && (
                        <View style={styles.actionFooter}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.rejectButton]}
                                onPress={() => updateStatus('Rejected')}
                            >
                                <Ionicons name="close" size={24} color="#fff" />
                                <Text style={styles.actionButtonText}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.approveButton]}
                                onPress={() => updateStatus('Approved')}
                            >
                                <Ionicons name="checkmark" size={24} color="#fff" />
                                <Text style={styles.actionButtonText}>Approve</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </SafeAreaView>
            </Modal>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review Reports</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={reports}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderReportItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="clipboard-check-outline" size={64} color="#9CA3AF" />
                            <Text style={styles.emptyText}>No reports submitted for review.</Text>
                        </View>
                    }
                />
            )}

            {renderDetailModal()}
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
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    badgeContainer: {
        backgroundColor: "#EEF2FF",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    activityBadge: {
        fontSize: 12,
        color: "#4F46E5",
        fontWeight: "600",
    },
    statusBadge: {
        fontSize: 12,
        fontWeight: "bold",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
    },
    statusPending: {
        backgroundColor: "#FEF3C7",
        color: "#D97706",
    },
    statusApproved: {
        backgroundColor: "#D1FAE5",
        color: "#059669",
    },
    statusRejected: {
        backgroundColor: "#FEE2E2",
        color: "#DC2626",
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1F2937",
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 8,
    },
    cardFooter: {
        flexDirection: "row",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        paddingTop: 8,
    },
    cardDate: {
        fontSize: 12,
        color: "#9CA3AF",
        marginLeft: 4,
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: "#6B7280",
    },

    // Modal
    modalContainer: {
        flex: 1,
        backgroundColor: "#fff",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
    modalContent: {
        padding: 24,
        paddingBottom: 100,
    },
    detailSection: {
        marginBottom: 16,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    half: {
        width: "48%",
    },
    label: {
        fontSize: 12,
        color: "#6B7280",
        textTransform: "uppercase",
        fontWeight: "600",
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: "#1F2937",
        fontWeight: "500",
    },
    divider: {
        height: 1,
        backgroundColor: "#E5E7EB",
        marginVertical: 20,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
        color: "#111827",
    },
    fileButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F3F4F6",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    fileButtonText: {
        marginLeft: 12,
        fontSize: 16,
        color: "#4F46E5",
        fontWeight: "500",
    },
    photoScroll: {
        marginBottom: 20,
    },
    photoDetail: {
        width: 120,
        height: 120,
        borderRadius: 12,
        marginRight: 12,
        backgroundColor: "#F3F4F6",
    },
    noData: {
        color: "#9CA3AF",
        fontStyle: "italic",
    },
    actionFooter: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        padding: 20,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 6,
    },
    rejectButton: {
        backgroundColor: "#EF4444",
    },
    approveButton: {
        backgroundColor: "#10B981",
    },
    actionButtonText: {
        color: "#fff",
        fontWeight: "bold",
        marginLeft: 8,
        fontSize: 16,
    },
});
