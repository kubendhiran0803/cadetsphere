import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

// Simple helper to get days in month
const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarEventAssign() {
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [eventTitle, setEventTitle] = useState("");
    const [eventDescription, setEventDescription] = useState("");

    // Current Date State for Calendar View
    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState(now.getMonth());
    const [currentYear, setCurrentYear] = useState(now.getFullYear());

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const handleDayPress = (day: number) => {
        // Format: YYYY-MM-DD
        const dateStr = `${currentYear}-${(currentMonth + 1)
            .toString()
            .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
        setSelectedDate(dateStr);
    };

    const changeMonth = (direction: number) => {
        let newMonth = currentMonth + direction;
        let newYear = currentYear;
        if (newMonth < 0) {
            newMonth = 11;
            newYear -= 1;
        } else if (newMonth > 11) {
            newMonth = 0;
            newYear += 1;
        }
        setCurrentMonth(newMonth);
        setCurrentYear(newYear);
    };

    const API_URL = "http://192.168.43.201:5000/api/events";

    const handleSubmit = async () => {
        if (!selectedDate || !eventTitle || !eventDescription) {
            Alert.alert("Error", "Please select a date, and fill in all fields.");
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    date: selectedDate,
                    title: eventTitle,
                    description: eventDescription,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert("Success", "Event/Camp assigned to all Cadets!");
                setEventTitle("");
                setEventDescription("");
                setSelectedDate("");
            } else {
                Alert.alert("Error", data.message || "Failed to create event.");
            }
        } catch (error) {
            Alert.alert("Error", "Network error. Could not connect to server.");
        }
    };

    // Render Calendar Grid
    const renderCalendar = () => {
        const days = [];
        // Empty slots for previous month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }
        // Days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${currentYear}-${(currentMonth + 1)
                .toString()
                .padStart(2, "0")}-${i.toString().padStart(2, "0")}`;
            const isSelected = selectedDate === dateStr;

            days.push(
                <TouchableOpacity
                    key={i}
                    style={[styles.dayCell, isSelected && styles.selectedDayCell]}
                    onPress={() => handleDayPress(i)}
                >
                    <Text
                        style={[styles.dayText, isSelected && styles.selectedDayText]}
                    >
                        {i}
                    </Text>
                </TouchableOpacity>
            );
        }
        return days;
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >

                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Events & Camps</Text>
                    </View>

                    {/* Calendar Widget */}
                    <View style={styles.calendarContainer}>
                        <View style={styles.calendarHeader}>
                            <TouchableOpacity onPress={() => changeMonth(-1)}>
                                <Ionicons name="chevron-back" size={24} color="#333" />
                            </TouchableOpacity>
                            <Text style={styles.monthTitle}>
                                {monthNames[currentMonth]} {currentYear}
                            </Text>
                            <TouchableOpacity onPress={() => changeMonth(1)}>
                                <Ionicons name="chevron-forward" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.weekRow}>
                            {WEEKDAYS.map((d) => (
                                <Text key={d} style={styles.weekDayText}>
                                    {d}
                                </Text>
                            ))}
                        </View>

                        <View style={styles.daysGrid}>{renderCalendar()}</View>
                    </View>

                    {/* Event Form */}
                    <View style={styles.formContainer}>
                        <Text style={styles.sectionTitle}>New Event / Camp Details</Text>

                        <Text style={styles.label}>Selected Date</Text>
                        <View style={styles.readOnlyInput}>
                            <Ionicons name="calendar-outline" size={20} color="#666" style={{ marginRight: 8 }} />
                            <Text style={styles.readOnlyText}>
                                {selectedDate || "Tap a date above"}
                            </Text>
                        </View>

                        <Text style={styles.label}>Event Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Summer Training Camp"
                            value={eventTitle}
                            onChangeText={setEventTitle}
                        />

                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Enter event details, location, and requirements..."
                            multiline
                            value={eventDescription}
                            onChangeText={setEventDescription}
                            textAlignVertical="top"
                        />

                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                            <Text style={styles.submitButtonText}>Broadcast Event</Text>
                        </TouchableOpacity>

                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
    },
    scrollContent: {
        padding: 20,
        paddingTop: Platform.OS === "android" ? 40 : 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#E5E7EB",
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#1F2937",
    },
    calendarContainer: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginBottom: 24,
    },
    calendarHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    weekRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 8,
    },
    weekDayText: {
        width: 32,
        textAlign: "center",
        color: "#9CA3AF",
        fontWeight: "600",
        fontSize: 12,
    },
    daysGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    dayCell: {
        width: (width - 40 - 32) / 7, // Screen width - page padding - card padding / 7
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 2,
    },
    selectedDayCell: {
        backgroundColor: "#4F46E5",
        borderRadius: 20,
    },
    dayText: {
        fontSize: 14,
        color: "#374151",
    },
    selectedDayText: {
        color: "#fff",
        fontWeight: "bold",
    },
    formContainer: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
        marginBottom: 8,
        marginTop: 8,
    },
    input: {
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: "#1F2937",
    },
    readOnlyInput: {
        backgroundColor: "#F3F4F6",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
    },
    readOnlyText: {
        color: "#4B5563",
        fontSize: 16,
    },
    textArea: {
        minHeight: 80,
    },
    submitButton: {
        backgroundColor: "#4F46E5",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 24,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
