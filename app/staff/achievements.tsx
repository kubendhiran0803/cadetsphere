import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

interface Cadet {
    id: number;
    name: string;
    email: string;
}

interface Achievement {
    id: number;
    title: string;
    category: string;
    level: string;
    date_of_achievement: string;
    description: string;
    proof_url: string;
    status: string;
}

const CATEGORIES = ["Camp", "Competition", "Certificate", "Award", "Leadership"];
const LEVELS = ["School", "District", "State", "National"];

export default function AchievementsManager() {
    const router = useRouter();
    const [cadets, setCadets] = useState<Cadet[]>([]);
    const [selectedCadet, setSelectedCadet] = useState<Cadet | null>(null);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
    const [newLevel, setNewLevel] = useState(LEVELS[0]);
    const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
    const [newDesc, setNewDesc] = useState("");
    const [newProof, setNewProof] = useState("");
    const [uploading, setUploading] = useState(false);

    const BASE_URL = "http://192.168.43.201:5000/api";
    const SERVER_URL = "http://192.168.43.201:5000";

    // Fetch Cadets using Focus Effect (Auto Refresh)
    useFocusEffect(
        useCallback(() => {
            fetchCadets();
        }, [])
    );

    const fetchCadets = async () => {
        try {
            const res = await fetch(`${BASE_URL}/achievements/cadets`);
            const data = await res.json();
            if (res.ok) setCadets(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAchievements = async (email: string) => {
        try {
            setLoading(true);
            const res = await fetch(`${BASE_URL}/achievements/list/${email}`);
            const data = await res.json();
            if (res.ok) setAchievements(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCadet = (cadet: Cadet) => {
        setSelectedCadet(cadet);
        fetchAchievements(cadet.email);
    };



    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "*/*",
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];
            uploadFile(file);
        } catch (err) {
            Alert.alert("Error", "Failed to pick document");
        }
    };

    const uploadFile = async (file: DocumentPicker.DocumentPickerAsset) => {
        setUploading(true);
        try {
            const formData = new FormData();
            // @ts-ignore
            formData.append("file", {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || "application/octet-stream",
            });

            const res = await fetch(`${BASE_URL}/upload`, {
                method: "POST",
                body: formData,
                headers: {
                    // Let the browser/engine set Content-Type for multipart/form-data
                },
            });

            const data = await res.json();
            if (res.ok) {
                const fullUrl = `${SERVER_URL}${data.url}`;
                setNewProof(fullUrl);
                Alert.alert("Success", "File uploaded and link generated!");
            } else {
                Alert.alert("Error", data.message || "Upload failed");
            }
        } catch (err) {
            Alert.alert("Error", "Upload failed");
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!newTitle || !selectedCadet) {
            Alert.alert("Error", "Title and Cadet are required");
            return;
        }

        const payload = {
            cadet_email: selectedCadet.email,
            title: newTitle,
            category: newCategory,
            level: newLevel,
            date_of_achievement: newDate,
            description: newDesc,
            proof_url: newProof,
            status: "Approved", // Direct staff entry is auto-approved
        };

        try {
            const res = await fetch(`${BASE_URL}/achievements/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                Alert.alert("Success", "Achievement added!");
                setModalVisible(false);
                setNewTitle("");
                setNewDesc("");
                setNewProof("");
                fetchAchievements(selectedCadet.email);
            } else {
                const d = await res.json();
                Alert.alert("Error", d.message || "Failed to add");
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

    const renderAchievement = ({ item }: { item: Achievement }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>
            <View style={styles.row}>
                <View style={styles.tag}>
                    <Text style={styles.tagText}>{item.category}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: '#EEF2FF' }]}>
                    <Text style={[styles.tagText, { color: '#4F46E5' }]}>{item.level}</Text>
                </View>
            </View>
            <Text style={styles.dateText}>Date: {item.date_of_achievement}</Text>
            {item.description ? <Text style={styles.descText}>{item.description}</Text> : null}

            {item.proof_url ? (
                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => {
                        Linking.openURL(item.proof_url).catch(err =>
                            Alert.alert('Error', 'Could not open link')
                        );
                    }}
                >
                    <Ionicons name="link" size={16} color="#4F46E5" />
                    <Text style={styles.linkText}>View Proof</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Achievements</Text>
                {selectedCadet && (
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.content}>
                {/* Cadet List */}
                <View style={styles.listContainer}>
                    <Text style={styles.sectionTitle}>Select Cadet</Text>
                    <FlatList
                        data={cadets}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderCadet}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={<Text style={styles.emptyText}>No cadets found.</Text>}
                    />
                </View>

                {/* Achievement List */}
                <View style={styles.feedContainer}>
                    {selectedCadet ? (
                        <>
                            <Text style={styles.sectionTitle}>
                                Achievements for {selectedCadet.name}
                            </Text>
                            {loading ? (
                                <ActivityIndicator size="large" color="#4F46E5" />
                            ) : (
                                <FlatList
                                    data={achievements}
                                    keyExtractor={(item) => item.id.toString()}
                                    renderItem={renderAchievement}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                    ListEmptyComponent={<Text style={styles.emptyText}>No achievements yet.</Text>}
                                />
                            )}
                        </>
                    ) : (
                        <View style={styles.placeholder}>
                            <Ionicons name="trophy-outline" size={64} color="#D1D5DB" />
                            <Text style={styles.placeholderText}>Select a cadet to view records</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Add Modal */}
            <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add Achievement</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={28} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.formContent}>
                        <Text style={styles.label}>Achievement Title *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Best Cadet"
                            value={newTitle}
                            onChangeText={setNewTitle}
                        />

                        <Text style={styles.label}>Category</Text>
                        <View style={styles.chipRow}>
                            {CATEGORIES.map(c => (
                                <TouchableOpacity
                                    key={c}
                                    style={[styles.chip, newCategory === c && styles.chipActive]}
                                    onPress={() => setNewCategory(c)}
                                >
                                    <Text style={[styles.chipText, newCategory === c && styles.chipTextActive]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Level</Text>
                        <View style={styles.chipRow}>
                            {LEVELS.map(l => (
                                <TouchableOpacity
                                    key={l}
                                    style={[styles.chip, newLevel === l && styles.chipActive]}
                                    onPress={() => setNewLevel(l)}
                                >
                                    <Text style={[styles.chipText, newLevel === l && styles.chipTextActive]}>{l}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
                        <TextInput
                            style={styles.input}
                            value={newDate}
                            onChangeText={setNewDate}
                            placeholder="YYYY-MM-DD"
                        />

                        <Text style={styles.label}>Description (Optional)</Text>
                        <TextInput
                            style={[styles.input, { minHeight: 80 }]}
                            value={newDesc}
                            onChangeText={setNewDesc}
                            multiline
                        />

                        <Text style={styles.label}>Upload Document (Link or File)</Text>
                        <View style={styles.uploadRow}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginRight: 8 }]}
                                value={newProof}
                                onChangeText={setNewProof}
                                placeholder="Paste link or upload..."
                            />
                            <TouchableOpacity
                                style={styles.uploadButton}
                                onPress={handlePickDocument}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                                )}
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                            <Text style={styles.submitButtonText}>Submit Achievement</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
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
        justifyContent: "space-between",
        padding: 16,
        paddingTop: Platform.OS === 'android' ? 40 : 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1F2937",
    },
    backButton: {
        padding: 8,
        backgroundColor: "#F3F4F6",
        borderRadius: 8,
    },
    addButton: {
        backgroundColor: "#4F46E5",
        padding: 8,
        borderRadius: 8,
    },
    content: {
        flex: 1,
        flexDirection: "column",
    },
    listContainer: {
        height: 180,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        padding: 16,
    },
    feedContainer: {
        flex: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
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
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    avatarText: {
        color: "#4F46E5",
        fontWeight: "bold",
    },
    cadetName: {
        fontWeight: "600",
        color: "#1F2937",
    },
    cadetEmail: {
        fontSize: 12,
        color: "#6B7280",
    },
    emptyText: {
        textAlign: "center",
        color: "#9CA3AF",
        marginTop: 20,
    },
    placeholder: {
        marginTop: 60,
        alignItems: "center",
    },
    placeholderText: {
        marginTop: 16,
        color: "#9CA3AF",
    },

    // Card
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#111827",
    },
    statusBadge: {
        backgroundColor: "#D1FAE5",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    statusText: {
        color: "#065F46",
        fontSize: 12,
        fontWeight: "600",
    },
    row: {
        flexDirection: "row",
        marginBottom: 8,
    },
    tag: {
        backgroundColor: "#F3F4F6",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 8,
    },
    tagText: {
        fontSize: 12,
        color: "#374151",
    },
    dateText: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 8,
    },
    descText: {
        fontSize: 14,
        color: "#4B5563",
        marginBottom: 8,
    },
    linkButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    linkText: {
        color: "#4F46E5",
        marginLeft: 4,
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
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
    formContent: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    chipRow: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    chip: {
        backgroundColor: "#F3F4F6",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },
    chipActive: {
        backgroundColor: "#4F46E5",
    },
    chipText: {
        color: "#374151",
    },
    chipTextActive: {
        color: "#fff",
    },
    submitButton: {
        backgroundColor: "#4F46E5",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 24,
        marginBottom: 40,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    uploadRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    uploadButton: {
        backgroundColor: '#4F46E5',
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
