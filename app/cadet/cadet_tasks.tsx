import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface Task {
    id: number;
    date: string;
    task_description: string;
    status: string;
    cadet_name: string;
}

export default function CadetTasks() {
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);

    const API_URL = "http://192.168.43.201:5000/api/tasks/cadet";

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const name = await AsyncStorage.getItem("userName");
            if (name) {
                setUserName(name);
                const response = await fetch(`${API_URL}/${name}`);
                if (response.ok) {
                    const data = await response.json();
                    setTasks(data);
                } else {
                    console.error("Failed to fetch tasks");
                }
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const markCompleted = async (taskId: number) => {
        try {
            const response = await fetch(`http://192.168.43.201:5000/api/tasks/${taskId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Completed' })
            });

            if (response.ok) {
                // Optimistic update
                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Completed' } : t));
            } else {
                Alert.alert("Error", "Failed to update status");
            }
        } catch (error) {
            Alert.alert("Error", "Network error");
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchTasks();
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return '#10B981'; // Emerald
            case 'pending':
                return '#F59E0B'; // Amber
            case 'overdue':
                return '#EF4444'; // Red
            default:
                return '#6B7280'; // Gray
        }
    };

    const renderItem = ({ item, index }: { item: Task; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 100).springify()}
            style={styles.cardContainer}
        >
            <View style={styles.card}>
                <View style={[styles.statusStrip, { backgroundColor: getStatusColor(item.status) }]} />
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.dateBadge}>
                            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                {item.status.toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.taskDescription}>{item.task_description}</Text>

                    <View style={styles.footer}>
                        <View style={styles.assigneeContainer}>
                            <MaterialCommunityIcons name="account-circle-outline" size={16} color="#9CA3AF" />
                            <Text style={styles.assigneeText}>Assigned to you</Text>
                        </View>
                        {item.status !== 'Completed' && (
                            <TouchableOpacity style={styles.completeBtn} onPress={() => markCompleted(item.id)}>
                                <Text style={styles.completeBtnText}>Mark Done</Text>
                            </TouchableOpacity>
                        )}
                        {item.status === 'Completed' && (
                            <View style={styles.completedLabel}>
                                <Ionicons name="checkmark-done" size={16} color="#10B981" />
                                <Text style={styles.completedText}>Done</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>My Tasks</Text>
                    {userName && <Text style={styles.subHeaderTitle}>Cadet: {userName}</Text>}
                </View>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : tasks.length === 0 ? (
                <View style={styles.centerContainer}>
                    <MaterialCommunityIcons name="clipboard-check-outline" size={64} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No tasks assigned yet.</Text>
                    <Text style={styles.subEmptyText}>You're all caught up!</Text>
                </View>
            ) : (
                <FlatList
                    data={tasks}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
    },
    subHeaderTitle: {
        fontSize: 12,
        color: '#6B7280',
        alignSelf: 'center',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    listContent: {
        padding: 20,
    },
    cardContainer: {
        marginBottom: 16,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    statusStrip: {
        width: 6,
        height: '100%',
    },
    cardContent: {
        flex: 1,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    dateText: {
        fontSize: 12,
        color: '#4B5563',
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    taskDescription: {
        fontSize: 15,
        color: '#1F2937',
        lineHeight: 22,
        fontWeight: '500',
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    assigneeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    assigneeText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
    },
    subEmptyText: {
        marginTop: 8,
        fontSize: 14,
        color: '#9CA3AF',
    },
    completeBtn: {
        marginLeft: 'auto',
        backgroundColor: '#4F46E5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    completeBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    completedLabel: {
        marginLeft: 'auto',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        gap: 4,
    },
    completedText: {
        color: '#10B981',
        fontSize: 13,
        fontWeight: '700',
    },
});
