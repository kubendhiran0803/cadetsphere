import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Alert,
    Dimensions,
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

const { width } = Dimensions.get('window');

interface Cadet {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface AttendanceRecord {
    cadetId: string;
    name: string;
    status: "Present" | "Absent";
    date: string;
}

const API_BASE = "http://192.168.43.201:5000/api";

export default function AttendancePage() {
    const router = useRouter();
    const [cadets, setCadets] = useState<Cadet[]>([]);
    const [attendance, setAttendance] = useState<{ [key: string]: "Present" | "Absent" }>({});
    const [viewMode, setViewMode] = useState<"mark" | "view">("mark");
    const [submittedRecords, setSubmittedRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    useFocusEffect(
        useCallback(() => {
            loadCadets();
        }, [])
    );

    React.useEffect(() => {
        loadAttendance(selectedDate);
    }, [selectedDate]);

    const getFormattedDate = (date: Date) => {
        return date.toISOString().split("T")[0];
    };

    const formatDateDisplay = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'long',
            day: 'numeric'
        });
    };

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const loadCadets = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/auth/cadets`);
            const data = await res.json();
            if (res.ok) {
                setCadets(data);
            }
        } catch (error) {
            // silent fail or retry logic in real app
        } finally {
            setLoading(false);
        }
    };

    const loadAttendance = async (date: Date) => {
        try {
            const dateStr = getFormattedDate(date);
            const res = await fetch(`${API_BASE}/attendance/${dateStr}`);
            const data = await res.json();
            if (res.ok) {
                const formatted: AttendanceRecord[] = data.map((d: any) => ({
                    cadetId: d.cadet_id || d.cadetId,
                    name: d.cadet_name || d.name,
                    status: d.status,
                    date: d.date
                }));
                setSubmittedRecords(formatted);

                const markingState: { [key: string]: "Present" | "Absent" } = {};
                formatted.forEach(r => {
                    markingState[r.cadetId] = r.status;
                });

                if (formatted.length > 0) {
                    setAttendance(markingState);
                } else {
                    setAttendance({});
                }
            }
        } catch (error) {
            console.log("Error loading attendance", error);
        }
    };

    const markStatus = (id: string, status: "Present" | "Absent") => {
        setAttendance((prev) => ({ ...prev, [id]: status }));
    };

    const submitAttendance = async () => {
        if (Object.keys(attendance).length === 0) {
            Alert.alert("Info", "Please mark attendance for at least one cadet.");
            return;
        }

        const dateStr = getFormattedDate(selectedDate);

        const records = cadets.map((cadet) => ({
            cadetId: cadet.id,
            name: cadet.name,
            status: attendance[cadet.id] || "Absent",
            date: dateStr,
        }));

        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/attendance`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ records, date: dateStr }),
            });

            const data = await res.json();

            if (res.ok) {
                Alert.alert("Success", "Attendance updated successfully!");
                loadAttendance(selectedDate);
                setViewMode("view");
            } else {
                Alert.alert("Error", data.message || "Failed to submit");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to connect to server");
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const renderMarkItem = ({ item, index }: { item: Cadet, index: number }) => {
        const currentStatus = attendance[item.id];
        return (
            <Animated.View
                entering={FadeInDown.delay(index * 50).springify()}
                style={styles.card}
            >
                <View style={styles.cardLeft}>
                    <View style={[styles.avatar, { backgroundColor: '#4F46E5' }]}>
                        <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={styles.cardName}>{item.name}</Text>
                        <Text style={styles.cardId}>ID: {item.id}</Text>
                    </View>
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => markStatus(item.id, "Present")}
                        style={[
                            styles.statusBtn,
                            currentStatus === "Present" ? styles.presentActive : styles.statusInactive
                        ]}
                    >
                        <MaterialCommunityIcons
                            name="check"
                            size={20}
                            color={currentStatus === "Present" ? "#fff" : "#9CA3AF"}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => markStatus(item.id, "Absent")}
                        style={[
                            styles.statusBtn,
                            currentStatus === "Absent" ? styles.absentActive : styles.statusInactive
                        ]}
                    >
                        <MaterialCommunityIcons
                            name="close"
                            size={20}
                            color={currentStatus === "Absent" ? "#fff" : "#9CA3AF"}
                        />
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    };

    const renderViewItem = ({ item, index }: { item: AttendanceRecord, index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 50).springify()}
            style={styles.recordCard}
        >
            <View style={styles.cardLeft}>
                <View style={[styles.avatarSmall, { backgroundColor: '#E0E7FF' }]}>
                    <Text style={[styles.avatarTextSmall, { color: '#4F46E5' }]}>
                        {getInitials(item.name)}
                    </Text>
                </View>
                <Text style={styles.recordName}>{item.name}</Text>
            </View>

            <View style={[
                styles.statusBadge,
                item.status === "Present" ? styles.badgePresent : styles.badgeAbsent
            ]}>
                <Text style={[
                    styles.statusText,
                    item.status === "Present" ? styles.textPresent : styles.textAbsent
                ]}>
                    {item.status}
                </Text>
            </View>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <SafeAreaView style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Attendance</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            {/* Date Navigator */}
            <View style={styles.dateStrip}>
                <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateNavBtn}>
                    <Ionicons name="chevron-back" size={20} color="#4F46E5" />
                </TouchableOpacity>
                <View style={styles.dateDisplay}>
                    <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#4F46E5" />
                    <Text style={styles.dateText}>{formatDateDisplay(selectedDate)}</Text>
                </View>
                <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateNavBtn}>
                    <Ionicons name="chevron-forward" size={20} color="#4F46E5" />
                </TouchableOpacity>
            </View>

            {/* Toggle */}
            <View style={styles.segmentContainer}>
                <View style={styles.segmentWrapper}>
                    <TouchableOpacity
                        style={[styles.segment, viewMode === "mark" && styles.segmentActive]}
                        onPress={() => setViewMode("mark")}
                    >
                        <Text style={[styles.segmentText, viewMode === "mark" && styles.segmentTextActive]}>
                            Mark
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.segment, viewMode === "view" && styles.segmentActive]}
                        onPress={() => {
                            loadAttendance(selectedDate);
                            setViewMode("view");
                        }}
                    >
                        <Text style={[styles.segmentText, viewMode === "view" && styles.segmentTextActive]}>
                            Entries
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* List */}
            <View style={styles.content}>
                {loading ? (
                    <View style={styles.center}>
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                ) : viewMode === "mark" ? (
                    <FlatList
                        data={cadets}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderMarkItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <FlatList
                        data={submittedRecords}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderViewItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.center}>
                                <MaterialCommunityIcons name="file-document-outline" size={48} color="#D1D5DB" />
                                <Text style={styles.emptyText}>No records found for this date</Text>
                            </View>
                        }
                    />
                )}
            </View>

            {/* Floating Submit Button (Only in Mark Mode) */}
            {viewMode === "mark" && !loading && cadets.length > 0 && (
                <Animated.View entering={FadeInUp.delay(300)}>
                    <TouchableOpacity
                        style={styles.fab}
                        onPress={submitAttendance}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.fabText}>Review & Submit</Text>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#fff" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    header: {
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
    },
    dateStrip: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: "#fff",
    },
    dateNavBtn: {
        padding: 8,
        backgroundColor: "#EEF2FF",
        borderRadius: 12,
    },
    dateDisplay: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EEF2FF",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 180,
        justifyContent: "center",
    },
    dateText: {
        marginLeft: 8,
        fontSize: 15,
        fontWeight: "600",
        color: "#4F46E5",
    },
    segmentContainer: {
        paddingHorizontal: 24,
        marginVertical: 16,
    },
    segmentWrapper: {
        flexDirection: "row",
        backgroundColor: "#E5E7EB",
        borderRadius: 12,
        padding: 4,
    },
    segment: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 8,
    },
    segmentActive: {
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    segmentText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
    },
    segmentTextActive: {
        color: "#111827",
    },
    content: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 100, // Space for FAB
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    avatarText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
    cardInfo: {
        flex: 1,
    },
    cardName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1F2937",
        marginBottom: 4,
    },
    cardId: {
        fontSize: 12,
        color: "#9CA3AF",
    },
    cardActions: {
        flexDirection: "row",
        gap: 8,
    },
    statusBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1.5,
    },
    statusInactive: {
        borderColor: "#E5E7EB",
        backgroundColor: "#F9FAFB",
    },
    presentActive: {
        backgroundColor: "#10B981",
        borderColor: "#10B981",
    },
    absentActive: {
        backgroundColor: "#EF4444",
        borderColor: "#EF4444",
    },
    recordCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    avatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    avatarTextSmall: {
        fontSize: 12,
        fontWeight: "700",
    },
    recordName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgePresent: {
        backgroundColor: "#ECFDF5",
    },
    badgeAbsent: {
        backgroundColor: "#FEF2F2",
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    textPresent: {
        color: "#059669",
    },
    textAbsent: {
        color: "#DC2626",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 40,
    },
    loadingText: {
        color: "#6B7280",
        marginTop: 12,
    },
    emptyText: {
        color: "#9CA3AF",
        marginTop: 12,
    },
    fab: {
        position: "absolute",
        bottom: 30,
        left: 24,
        right: 24,
        backgroundColor: "#4F46E5",
        borderRadius: 16,
        height: 56,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#4F46E5",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    fabText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
});
