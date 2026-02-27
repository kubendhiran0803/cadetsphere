import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
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
    View
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

const API_URL = "http://192.168.43.201:5000/api";

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

export default function CadetAIChat() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hello Cadet! I am the Admin AI. Ask me about your modules, attendance, tasks, or unit details.",
            sender: 'ai',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userText = input.trim();
        const userMsg: Message = {
            id: Date.now().toString(),
            text: userText,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const email = await AsyncStorage.getItem("userEmail");
            if (!email) throw new Error("User email not found");

            const response = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    message: userText
                })
            });

            const data = await response.json();

            let aiResponseText = "";
            if (response.ok && data.response) {
                aiResponseText = data.response;
            } else {
                console.error("AI Error Response:", data);
                // Use the specific error message from backend if available
                const backendError = data.message || "Unknown Error";
                aiResponseText = `⚠️ Error: ${backendError}`;
            }

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: aiResponseText,
                sender: 'ai',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error: any) {
            console.error("Chat Request Error:", error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: `⚠️ Network Error: Unable to reach Command Center.\n(${error.message || 'Check Connection'})`,
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: Message }) => (
        <Animated.View
            entering={FadeInUp.springify()}
            style={[
                styles.messageBubble,
                item.sender === 'user' ? styles.userBubble : styles.aiBubble
            ]}
        >
            <Text style={[styles.messageText, item.sender === 'user' ? styles.userText : styles.aiText]}>
                {item.text}
            </Text>
            <Text style={[styles.timeText, item.sender === 'user' ? { color: '#C7D2FE' } : { color: '#9CA3AF' }]}>
                {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="shield-account" size={24} color="#4F46E5" style={{ marginRight: 8 }} />
                    <Text style={styles.headerTitle}>Admin Support (AI)</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    style={{ flex: 1 }}
                />

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#4F46E5" />
                        <Text style={styles.loadingText}>Admin is typing...</Text>
                    </View>
                )}

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Inquire about Cadetsphere..."
                        value={input}
                        onChangeText={setInput}
                        onSubmitEditing={handleSend}
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        style={[styles.sendButton, { opacity: loading ? 0.7 : 1 }]}
                        disabled={loading}
                    >
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 40,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        elevation: 2,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    listContent: {
        padding: 20,
        paddingBottom: 20,
    },
    messageBubble: {
        maxWidth: '85%',
        padding: 14,
        borderRadius: 20,
        marginBottom: 12,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#4F46E5',
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 1,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userText: {
        color: '#fff',
    },
    aiText: {
        color: '#1F2937',
    },
    timeText: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        marginLeft: 20,
        marginBottom: 5,
    },
    loadingText: {
        color: '#6B7280',
        fontStyle: 'italic',
        marginLeft: 8,
        fontSize: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    input: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginRight: 12,
        fontSize: 15,
        color: '#1F2937',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
});
