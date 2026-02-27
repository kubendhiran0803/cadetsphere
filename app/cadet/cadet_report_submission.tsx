import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
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

interface Staff {
    id: number;
    name: string;
    email: string;
}

const ACTIVITY_TYPES = ["Camp", "Parade", "Training", "Social Service", "Drill"];
const ORGANIZERS = ["School", "NCC", "Scouts"];

export default function CadetReportSubmission() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [userEmail, setUserEmail] = useState("");

    // Form Fields
    const [activityType, setActivityType] = useState(ACTIVITY_TYPES[0]);
    const [eventName, setEventName] = useState("");
    const [organizedBy, setOrganizedBy] = useState(ORGANIZERS[0]);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [durationDays, setDurationDays] = useState(1);
    const [location, setLocation] = useState("");
    const [evidence, setEvidence] = useState<any>(null); // For document/certificate
    const [photos, setPhotos] = useState<string[]>([]);

    // Staff Selection
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [staffModalVisible, setStaffModalVisible] = useState(false);

    // Pickers visibility
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const BASE_URL = "http://192.168.43.201:5000/api";

    useEffect(() => {
        const init = async () => {
            const email = await AsyncStorage.getItem("userEmail");
            if (email) setUserEmail(email);
            fetchStaff();
        };
        init();
    }, []);

    // Calculate duration whenever dates change
    useEffect(() => {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
        setDurationDays(diffDays > 0 ? diffDays : 1);
    }, [startDate, endDate]);

    const fetchStaff = async () => {
        try {
            const res = await fetch(`${BASE_URL}/messages/staff`);
            const data = await res.json();
            if (res.ok) setStaffList(data);
        } catch (err) {
            console.error("Error fetching staff:", err);
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "*/*",
                copyToCacheDirectory: true,
            });

            if (result.assets && result.assets.length > 0) {
                setEvidence(result.assets[0]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const pickImage = async () => {
        if (photos.length >= 3) {
            Alert.alert("Limit Reached", "You can upload a maximum of 3 photos.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
        });

        if (!result.canceled) {
            setPhotos([...photos, result.assets[0].uri]);
        }
    };

    const uploadFile = async (fileUri: string, fileName: string, fileType: string) => {
        const formData = new FormData();
        formData.append("file", {
            uri: fileUri,
            name: fileName,
            type: fileType || "image/jpeg",
        } as any);

        const res = await fetch(`${BASE_URL}/upload`, {
            method: "POST",
            body: formData,
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        const data = await res.json();
        return data.url;
    };

    const handleSubmit = async () => {
        if (!selectedStaff) {
            Alert.alert("Required", "Please select a Staff member to submit to.");
            return;
        }
        if (!eventName || !location) {
            Alert.alert("Required", "Please fill in all fields.");
            return;
        }

        setLoading(true);

        try {
            let evidenceUrl = "";
            let photoUrls: string[] = [];

            // Upload Evidence
            if (evidence) {
                evidenceUrl = await uploadFile(evidence.uri, evidence.name, evidence.mimeType);
            }

            // Upload Photos
            for (const photoUri of photos) {
                const name = photoUri.split("/").pop() || "photo.jpg";
                const url = await uploadFile(photoUri, name, "image/jpeg");
                photoUrls.push(url);
            }

            const payload = {
                cadet_email: userEmail,
                staff_email: selectedStaff.email,
                activity_type: activityType,
                event_name: eventName,
                organized_by: organizedBy,
                start_date: startDate.toISOString().split("T")[0],
                end_date: endDate.toISOString().split("T")[0],
                duration_days: durationDays,
                location: location,
                evidence_url: evidenceUrl,
                photos: photoUrls,
            };

            const res = await fetch(`${BASE_URL}/reports/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                Alert.alert("Success", "Report Submitted successfully!");
                router.back();
            } else {
                Alert.alert("Error", "Failed to submit report.");
            }
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Network request failed.");
        } finally {
            setLoading(false);
        }
    };

    const onStartDateChange = (event: any, selectedDate?: Date) => {
        setShowStartPicker(false);
        if (selectedDate) setStartDate(selectedDate);
    };

    const onEndDateChange = (event: any, selectedDate?: Date) => {
        setShowEndPicker(false);
        if (selectedDate) setEndDate(selectedDate);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Submit Report</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Staff Selection */}
                <Text style={styles.label}>Submit To (Staff) *</Text>
                <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setStaffModalVisible(true)}
                >
                    <Text style={styles.dropdownButtonText}>
                        {selectedStaff ? selectedStaff.name : "Select Staff Content"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>

                {/* Activity Type */}
                <Text style={styles.label}>Activity Type</Text>
                <View style={styles.pillsContainer}>
                    {ACTIVITY_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.pill,
                                activityType === type && styles.pillActive,
                            ]}
                            onPress={() => setActivityType(type)}
                        >
                            <Text
                                style={[
                                    styles.pillText,
                                    activityType === type && styles.pillTextActive,
                                ]}
                            >
                                {type}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Event Name */}
                <Text style={styles.label}>Event / Camp Name *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: Annual Training Camp"
                    value={eventName}
                    onChangeText={setEventName}
                />

                {/* Organized By */}
                <Text style={styles.label}>Organized By</Text>
                <View style={styles.pillsContainer}>
                    {ORGANIZERS.map((org) => (
                        <TouchableOpacity
                            key={org}
                            style={[
                                styles.pill,
                                organizedBy === org && styles.pillActive,
                            ]}
                            onPress={() => setOrganizedBy(org)}
                        >
                            <Text
                                style={[
                                    styles.pillText,
                                    organizedBy === org && styles.pillTextActive,
                                ]}
                            >
                                {org}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Dates */}
                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>Start Date</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowStartPicker(true)}
                        >
                            <Text>{startDate.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>End Date</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowEndPicker(true)}
                        >
                            <Text>{endDate.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {showStartPicker && (
                    <DateTimePicker value={startDate} mode="date" onChange={onStartDateChange} />
                )}
                {showEndPicker && (
                    <DateTimePicker value={endDate} mode="date" onChange={onEndDateChange} />
                )}

                <Text style={styles.helperText}>Duration: {durationDays} Days (Auto-calculated)</Text>

                {/* Location */}
                <Text style={styles.label}>Location *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="City, State"
                    value={location}
                    onChangeText={setLocation}
                />

                {/* Evidence Upload */}
                <Text style={styles.sectionHeader}>Evidence</Text>

                <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                    <Ionicons name="document-attach" size={24} color="#4F46E5" />
                    <Text style={styles.uploadButtonText}>
                        {evidence ? evidence.name : "Upload Certificate (PDF/Image)"}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.label}>Photos (Max 3)</Text>
                <View style={styles.photosContainer}>
                    {photos.map((uri, index) => (
                        <Image key={index} source={{ uri }} style={styles.thumbnail} />
                    ))}
                    {photos.length < 3 && (
                        <TouchableOpacity style={styles.addPhoto} onPress={pickImage}>
                            <Ionicons name="camera" size={24} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Report</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>

            {/* Staff Selection Modal */}
            <Modal visible={staffModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Staff</Text>
                        <FlatList
                            data={staffList}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setSelectedStaff(item);
                                        setStaffModalVisible(false);
                                    }}
                                >
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                                    </View>
                                    <Text style={styles.modalItemText}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setStaffModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
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
        padding: 20,
        paddingBottom: 40,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
    },
    dropdownButton: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dropdownButtonText: {
        color: "#111827",
        fontSize: 14,
    },
    pillsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#E5E7EB",
        marginBottom: 8,
    },
    pillActive: {
        backgroundColor: "#4F46E5",
    },
    pillText: {
        fontSize: 12,
        color: "#374151",
    },
    pillTextActive: {
        color: "#fff",
        fontWeight: "600",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 16,
    },
    halfInput: {
        flex: 1,
    },
    dateButton: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        padding: 12,
        alignItems: "center",
    },
    helperText: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 4,
        fontStyle: "italic",
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1F2937",
        marginTop: 24,
        marginBottom: 8,
    },
    uploadButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EEF2FF",
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#C7D2FE",
        borderStyle: "dashed",
    },
    uploadButtonText: {
        marginLeft: 8,
        color: "#4F46E5",
        fontWeight: "500",
    },
    photosContainer: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
        marginBottom: 24,
    },
    thumbnail: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    addPhoto: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: "#E5E7EB",
        alignItems: "center",
        justifyContent: "center",
    },
    submitButton: {
        backgroundColor: "#4F46E5",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 24,
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        maxHeight: "60%",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 16,
    },
    modalItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    modalItemText: {
        fontSize: 16,
        marginLeft: 12,
        color: "#374151",
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#C7D2FE",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        color: "#3730A3",
        fontWeight: "bold",
    },
    closeButton: {
        marginTop: 16,
        padding: 12,
        alignItems: "center",
    },
    closeButtonText: {
        color: "#EF4444",
        fontWeight: "600",
    },
});
