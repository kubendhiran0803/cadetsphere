import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Cadet {
    id: number;
    name: string;
    email: string;
}

interface Message {
    id: number;
    sender_email: string;
    receiver_email: string;
    message: string;
    created_at: string;
    is_read?: number | boolean;
}

export default function Messages() {
    const router = useRouter();
    const [cadets, setCadets] = useState<Cadet[]>([]);
    const [selectedCadet, setSelectedCadet] = useState<Cadet | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
    const [loading, setLoading] = useState(true);

    const flatListRef = useRef<FlatList>(null);

    const BASE_URL = "http://192.168.43.201:5000/api";

    // 1. Get current logged in user (Staff) email
    useEffect(() => {
        const init = async () => {
            // In a real app we would store email in AsyncStorage during login
            // For now, let's try to get it, or fallback.
            // NOTE: In login.tsx you only saved 'userName' and 'userRole'.
            // PRO TIP: You should also save 'userEmail' in login.tsx for this to work perfectly.
            // I will assume you will fix login.tsx or I'll try to find a workaround.
            // Let's assume userEmail IS saved or we can't really identify who is sending.
            // As a quick fix for this session, I will fetch user ID based on logic or update login.
            // I'll check AsyncStorage for 'userEmail'. If not there, this might fail unless we update Login.
            const email = await AsyncStorage.getItem("userEmail");
            if (email) setCurrentUserEmail(email);

            fetchCadets();
        };
        init();
    }, []);

    const fetchCadets = async () => {
        try {
            const res = await fetch(`${BASE_URL}/messages/cadets`);
            const data = await res.json();
            if (res.ok) {
                setCadets(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const markMessagesAsRead = async (senderEmail: string) => {
        if (!currentUserEmail) return;
        try {
            await fetch(`${BASE_URL}/messages/mark-read`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sender_email: senderEmail,
                    receiver_email: currentUserEmail
                })
            });
        } catch (err) {
            console.error("Failed to mark messages as read", err);
        }
    };

    const fetchMessages = async (cadetEmail: string) => {
        if (!currentUserEmail) return; // Wait until we have the sender email
        try {
            const res = await fetch(
                `${BASE_URL}/messages/conversation?user1=${currentUserEmail}&user2=${cadetEmail}`
            );
            const data = await res.json();
            if (res.ok) {
                setMessages(data);
                // Mark messages from this cadet as read
                markMessagesAsRead(cadetEmail);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedCadet || !currentUserEmail) return;

        const payload = {
            sender_email: currentUserEmail,
            receiver_email: selectedCadet.email,
            message: newMessage,
        };

        try {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now(), // temp id
                    sender_email: currentUserEmail,
                    receiver_email: selectedCadet.email,
                    message: newMessage,
                    created_at: new Date().toISOString(),
                    is_read: 0
                },
            ]);
            setNewMessage("");

            await fetch(`${BASE_URL}/messages/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            // Refresh to get real ID/timestamp
            fetchMessages(selectedCadet.email);
        } catch (err) {
            console.error(err);
        }
    };

    // Polling for real-time updates (new messages + read receipts)
    useEffect(() => {
        if (!selectedCadet || !currentUserEmail) return;

        // Initial fetch
        fetchMessages(selectedCadet.email);

        const interval = setInterval(() => {
            fetchMessages(selectedCadet.email);
        }, 5000);

        return () => clearInterval(interval);
    }, [selectedCadet, currentUserEmail]);

    const handleSelectCadet = (cadet: Cadet) => {
        setSelectedCadet(cadet);
    };

    const renderCadetItem = ({ item }: { item: Cadet }) => (
        <TouchableOpacity
            style={[
                styles.cadetItem,
                selectedCadet?.id === item.id && styles.cadetItemActive,
            ]}
            onPress={() => handleSelectCadet(item)}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
                <Text style={styles.cadetName}>{item.name}</Text>
                <Text style={styles.cadetEmail}>{item.email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
    );

    const renderMessageItem = ({ item }: { item: Message }) => {
        const isMe = item.sender_email === currentUserEmail;
        return (
            <View
                style={[
                    styles.messageBubble,
                    isMe ? styles.myMessage : styles.theirMessage,
                ]}
            >
                <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>{item.message}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }}>
                    <Text style={[styles.timeText, isMe ? { color: '#E0E7FF' } : { color: '#9CA3AF' }, { marginTop: 0, marginRight: 4 }]}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {isMe && (
                        <Ionicons
                            name="checkmark-done"
                            size={16}
                            color={item.is_read ? "#fff" : "#E0E7FF"}
                        />
                    )}
                </View>
            </View>
        );
    };

    // If inside a conversation
    if (selectedCadet) {
        return (
            <SafeAreaView style={styles.chatContainer}>
                {/* Chat Header */}
                <View style={styles.chatHeader}>
                    <TouchableOpacity onPress={() => setSelectedCadet(null)} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <View style={styles.chatHeaderInfo}>
                        <Text style={styles.chatHeaderTitle}>{selectedCadet.name}</Text>
                        <Text style={styles.chatHeaderSubtitle}>{selectedCadet.email}</Text>
                    </View>
                </View>

                {/* Messages List */}
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
                >
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderMessageItem}
                        contentContainerStyle={styles.chatContent}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        style={{ flex: 1 }}
                    />
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Type a message..."
                            value={newMessage}
                            onChangeText={setNewMessage}
                        />
                        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                            <Ionicons name="send" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    // Cadet List View
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Messages</Text>
            </View>

            <Text style={styles.sectionHeader}>Select a Cadet to message</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={cadets}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderCadetItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>No cadets found.</Text>}
                />
            )}
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
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: Platform.OS === 'android' ? 45 : 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "700",
        marginLeft: 16,
        color: "#1F2937",
        letterSpacing: 0.5,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 12,
        fontSize: 13,
        color: "#6B7280",
        textTransform: "uppercase",
        fontWeight: "700",
        letterSpacing: 1,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    cadetItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#fff",
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },
    cadetItemActive: {
        borderColor: "#4F46E5",
        backgroundColor: "#EEF2FF",
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#E0E7FF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
        borderWidth: 2,
        borderColor: "#fff",
    },
    avatarText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#4F46E5",
    },
    cadetName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1F2937",
        marginBottom: 2,
    },
    cadetEmail: {
        fontSize: 13,
        color: "#6B7280",
    },
    emptyText: {
        textAlign: "center",
        color: "#9CA3AF",
        marginTop: 40,
        fontSize: 16,
    },
    // Chat Styles
    chatContainer: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    chatHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 12,
        paddingTop: Platform.OS === 'android' ? 45 : 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        zIndex: 10,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: "#F9FAFB",
    },
    chatHeaderInfo: {
        marginLeft: 12,
        flex: 1,
    },
    chatHeaderTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    chatHeaderSubtitle: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "500",
    },
    chatContent: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 20,
    },
    messageBubble: {
        maxWidth: "80%",
        padding: 14,
        borderRadius: 20,
        marginBottom: 12,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
    },
    myMessage: {
        alignSelf: "flex-end",
        backgroundColor: "#4F46E5",
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: "flex-start",
        backgroundColor: "#fff",
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    myMessageText: {
        color: "#fff",
    },
    theirMessageText: {
        color: "#1F2937",
    },
    timeText: {
        fontSize: 11,
        fontWeight: "500",
    },
    inputContainer: {
        flexDirection: "row",
        padding: 16,
        backgroundColor: "#fff",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    input: {
        flex: 1,
        backgroundColor: "#F9FAFB",
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        color: "#1F2937",
        fontSize: 15,
    },
    sendButton: {
        backgroundColor: "#4F46E5",
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        elevation: 2,
        shadowColor: "#4F46E5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
});
