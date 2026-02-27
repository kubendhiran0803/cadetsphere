
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    Linking,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Cadet {
    id: string;
    name: string;
    role: string;
    email: string;
    unique_id?: string;
    mobile_number?: string;
    mobile_req?: number;
}

export default function CadetDirectory() {
    const [cadets, setCadets] = useState<Cadet[]>([]);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    // We only want to show Cadets to Staff
    const API_URL = "http://192.168.43.201:5000/api/auth/cadets";
    const REQUEST_MOBILE_URL = "http://192.168.43.201:5000/api/contact/request";

    const loadCadets = useCallback(async () => {
        try {
            const res = await fetch(API_URL);
            if (res.ok) {
                const data: Cadet[] = await res.json();
                // Filter only Cadets
                setCadets(data.filter(c => c.role === 'Cadet'));
            } else {
                console.log("Failed to fetch cadets");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to load cadets");
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadCadets();
        }, [loadCadets])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadCadets();
        setRefreshing(false);
    }, [loadCadets]);

    const handleRequestMobile = async (target: "all" | "single", user?: Cadet) => {
        try {
            const body = target === "all" ? { target: "all" } : { target: "single", id: user?.id };
            const res = await fetch(REQUEST_MOBILE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                Alert.alert("Success", target === "all" ? "Requested mobile numbers from ALL cadets." : "Requested mobile number from " + user?.name);
                loadCadets();
            } else {
                Alert.alert("Error", "Failed to send request.");
            }
        } catch (error) {
            Alert.alert("Error", "Server unreachable");
        }
    };

    const handleCall = (mobile: string) => {
        let phoneNumber = '';
        if (Platform.OS === 'android') {
            phoneNumber = `tel:${mobile}`;
        } else {
            phoneNumber = `telprompt:${mobile}`;
        }
        Linking.openURL(phoneNumber);
    };

    const renderCadet = ({ item }: { item: Cadet }) => (
        <View style={styles.cadetCard}>
            <View style={styles.cadetHeader}>
                <View style={styles.cadetHeaderLeft}>
                    <Ionicons name="person-circle" size={44} color="#6366F1" />
                    <View style={styles.cadetInfo}>
                        <Text style={styles.name}>{item.name}</Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.uniqueId}>{item.unique_id || "No ID"}</Text>
                        </View>
                    </View>
                </View>

                {/* Call Button if number exists */}
                {item.mobile_number ? (
                    <TouchableOpacity style={styles.callButton} onPress={() => handleCall(item.mobile_number!)}>
                        <Ionicons name="call" size={20} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <Ionicons name="call" size={20} color="#e5e7eb" />
                )}
            </View>

            <View style={styles.details}>
                <Text style={styles.email}>{item.email}</Text>
                <View style={styles.mobileRow}>
                    <Ionicons name="phone-portrait-outline" size={14} color="#6b7280" />
                    <Text style={styles.mobileText}>
                        {item.mobile_number ? item.mobile_number : "No Mobile"}
                    </Text>
                    {item.mobile_req ? (
                        <Text style={styles.pendingBadge}> • Request Pending</Text>
                    ) : (
                        !item.mobile_number && (
                            <TouchableOpacity onPress={() => handleRequestMobile("single", item)}>
                                <Text style={styles.requestLink}>Request Update</Text>
                            </TouchableOpacity>
                        )
                    )}
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Cadet Directory</Text>
                    <Text style={styles.subtitle}>{cadets.length} Cadets Found</Text>
                </View>
                <TouchableOpacity style={styles.requestAllBtn} onPress={() => Alert.alert("Confirm", "Request mobile number from ALL cadets?", [{ text: "Cancel" }, { text: "Yes", onPress: () => handleRequestMobile("all") }])}>
                    <Ionicons name="notifications-outline" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={cadets}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderCadet}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#111827",
    },
    subtitle: {
        fontSize: 14,
        color: "#6b7280",
        marginTop: 4,
    },
    requestAllBtn: {
        backgroundColor: "#f59e0b",
        padding: 12,
        borderRadius: 12,
        elevation: 2,
    },
    cadetCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
    },
    cadetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cadetHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    cadetInfo: {
        marginLeft: 14,
    },
    name: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1f2937",
    },
    roleBadge: {
        marginTop: 2,
    },
    uniqueId: {
        fontSize: 13,
        color: "#6366F1",
        fontWeight: "600",
    },
    callButton: {
        backgroundColor: '#10B981',
        padding: 10,
        borderRadius: 20,
        elevation: 2,
    },
    details: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
        paddingTop: 10,
    },
    email: {
        fontSize: 13,
        color: "#6b7280",
        marginBottom: 4,
    },
    mobileRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    mobileText: {
        fontSize: 13,
        color: "#374151",
        fontWeight: "600",
        marginLeft: 6,
    },
    pendingBadge: {
        fontSize: 12,
        color: "#f59e0b",
        fontWeight: "600",
        fontStyle: 'italic',
        marginLeft: 4,
    },
    requestLink: {
        fontSize: 12,
        color: "#4F46E5",
        fontWeight: "700",
        marginLeft: 8,
        textDecorationLine: 'underline'
    }
});
