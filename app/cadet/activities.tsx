import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Data Types
interface Activity {
    id: number;
    cadet_name: string;
    activity_name: string;
    category: string;
    date: string;
    duration: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    created_at?: string;
}

const CATEGORIES = [
    'Drill',
    'Physical Training',
    'Camp Activity',
    'Community Service',
    'Adventure Training'
];

const DURATIONS = [
    '30 min',
    '1 hr',
    'Full Day'
];

export default function CadetActivities() {
    const router = useRouter();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [newActivityName, setNewActivityName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[1]);
    const [selectedDuration, setSelectedDuration] = useState(DURATIONS[1]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const API_URL = "http://192.168.43.201:5000/api/activities";

    useEffect(() => {
        const init = async () => {
            const name = await AsyncStorage.getItem("userName");
            if (name) {
                setUserName(name);
                fetchActivities(name);
            }
        };
        init();
    }, []);

    const fetchActivities = async (name: string) => {
        try {
            const response = await fetch(`${API_URL}/cadet/${name}`);
            if (response.ok) {
                const data = await response.json();
                setActivities(data);
            } else {
                console.error("Failed to fetch activities");
            }
        } catch (error) {
            console.error("Error fetching activities:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAddActivity = async () => {
        if (!newActivityName.trim()) {
            Alert.alert("Missing Info", "Please enter an activity name.");
            return;
        }
        if (!userName) return;

        const payload = {
            cadet_name: userName,
            activity_name: newActivityName,
            category: selectedCategory,
            date: selectedDate.toISOString().split('T')[0],
            duration: selectedDuration
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                Alert.alert("Success", "Activity submitted for approval!");
                setModalVisible(false);
                setNewActivityName('');
                fetchActivities(userName);
            } else {
                Alert.alert("Error", "Failed to submit activity.");
            }
        } catch (error) {
            Alert.alert("Error", "Network error.");
        }
    };

    const onRefresh = () => {
        if (userName) {
            setRefreshing(true);
            fetchActivities(userName);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || new Date();
        setShowDatePicker(Platform.OS === 'ios');
        setSelectedDate(currentDate);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return '#10B981';
            case 'Rejected': return '#EF4444';
            default: return '#F59E0B';
        }
    };

    const renderItem = ({ item, index }: { item: Activity; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 100).springify()}
            style={styles.cardContainer}
        >
            <View style={styles.card}>
                <View style={[styles.statusStrip, { backgroundColor: getStatusColor(item.status) }]} />
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                        </View>
                    </View>

                    <Text style={styles.activityTitle}>{item.activity_name}</Text>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                            <Text style={styles.metaText}>{new Date(item.date).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={14} color="#6B7280" />
                            <Text style={styles.metaText}>{item.duration}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Activities</Text>
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : activities.length === 0 ? (
                <View style={styles.centerContainer}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No activities recorded.</Text>
                    <TouchableOpacity style={styles.emptyBtn} onPress={() => setModalVisible(true)}>
                        <Text style={styles.emptyBtnText}>Log New Activity</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={activities}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
                />
            )}

            {/* Add Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Log Activity</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Activity Name */}
                            <Text style={styles.label}>Activity Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Morning Parade Practice"
                                value={newActivityName}
                                onChangeText={setNewActivityName}
                            />

                            {/* Category */}
                            <Text style={styles.label}>Category</Text>
                            <View style={styles.chipContainer}>
                                {CATEGORIES.map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.chip, selectedCategory === cat && styles.chipSelected]}
                                        onPress={() => setSelectedCategory(cat)}
                                    >
                                        <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextSelected]}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Date */}
                            <Text style={styles.label}>Date</Text>
                            <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
                                <Ionicons name="calendar" size={20} color="#4F46E5" />
                                <Text style={styles.dateSelectorText}>{selectedDate.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={selectedDate}
                                    mode="date"
                                    display="default"
                                    onChange={onDateChange}
                                />
                            )}

                            {/* Duration */}
                            <Text style={styles.label}>Duration</Text>
                            <View style={styles.chipContainer}>
                                {DURATIONS.map(dur => (
                                    <TouchableOpacity
                                        key={dur}
                                        style={[styles.chip, selectedDuration === dur && styles.chipSelected]}
                                        onPress={() => setSelectedDuration(dur)}
                                    >
                                        <Text style={[styles.chipText, selectedDuration === dur && styles.chipTextSelected]}>
                                            {dur}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity style={styles.submitButton} onPress={handleAddActivity}>
                                <Text style={styles.submitButtonText}>Submit Activity</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    },
    addButton: {
        backgroundColor: '#4F46E5',
        padding: 8,
        borderRadius: 12,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
        color: '#6B7280',
        fontWeight: '500',
    },
    emptyBtn: {
        marginTop: 20,
        backgroundColor: '#4F46E5',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    emptyBtnText: {
        color: '#fff',
        fontWeight: '600',
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
        marginBottom: 8,
    },
    categoryBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#4B5563',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#6B7280',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipSelected: {
        backgroundColor: '#EEF2FF',
        borderColor: '#4F46E5',
    },
    chipText: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '500',
    },
    chipTextSelected: {
        color: '#4F46E5',
        fontWeight: '600',
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        gap: 12,
    },
    dateSelectorText: {
        fontSize: 16,
        color: '#111827',
    },
    submitButton: {
        backgroundColor: '#4F46E5',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 20, // Extra padding at bottom for modal
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
