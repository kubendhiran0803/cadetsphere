
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Linking,
    Modal,
    Platform,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface Task {
    id: number;
    date: string;
    task_description: string;
    status: string;
    cadet_name: string;
    created_at?: string;
    scheduled_at?: string;
    mobile_number?: string; // We might need to fetch this or join it.
}

interface GroupedTask {
    title: string;
    date: string;
    total: number;
    completed: number;
    tasks: Task[];
}

export default function StaffTasks() {
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [groupedTasks, setGroupedTasks] = useState<GroupedTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<GroupedTask | null>(null);

    // Time Picker State
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
    const [tempDate, setTempDate] = useState(new Date());

    // Form Stats
    const [taskDescription, setTaskDescription] = useState('');
    const [assignAll, setAssignAll] = useState(true);
    const [specificCadet, setSpecificCadet] = useState('');
    const [scheduledTime, setScheduledTime] = useState(''); // Simple string for now "YYYY-MM-DD HH:MM"

    const API_URL = "http://192.168.43.201:5000/api/tasks";

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            // We need a join to get mobile numbers for the "Call" feature
            // But for now let's just fetch tasks. To properly implement "Call", we really need the mobile number.
            // Let's assume the API returns it or we fetch it separately.
            // Actually, let's update the GET endpoint quickly in the next step to join with signup table.
            // For now, use existing endpoint.
            const res = await fetch(API_URL);
            const data = await res.json();

            if (res.ok) {
                const fetchedTasks: Task[] = data.tasks;
                setTasks(fetchedTasks);
                groupTasks(fetchedTasks);
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    const groupTasks = (allTasks: Task[]) => {
        // Group by description + date
        const groups: { [key: string]: GroupedTask } = {};

        allTasks.forEach(task => {
            const key = `${task.task_description}|${task.date.split('T')[0]}`;
            if (!groups[key]) {
                groups[key] = {
                    title: task.task_description,
                    date: task.date,
                    total: 0,
                    completed: 0,
                    tasks: []
                };
            }
            groups[key].tasks.push(task);
            groups[key].total += 1;
            if (task.status === 'Completed') {
                groups[key].completed += 1;
            }
        });

        setGroupedTasks(Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };

    const handleAssign = async () => {
        if (!taskDescription) {
            Alert.alert("Error", "Please enter a task description");
            return;
        }
        if (!assignAll && !specificCadet) {
            Alert.alert("Error", "Please specify a cadet or select 'Assign to All'");
            return;
        }

        const payload = {
            task_description: taskDescription,
            date: new Date().toISOString().split('T')[0], // Default today
            cadet_name: assignAll ? 'All' : specificCadet,
            scheduled_at: scheduledTime ? scheduledTime : null
        };

        try {
            const res = await fetch(`${API_URL}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok) {
                Alert.alert("Success", "Task assigned successfully");
                setModalVisible(false);
                setTaskDescription('');
                setSpecificCadet('');
                fetchTasks();
            } else {
                Alert.alert("Error", data.message || "Failed to assign task");
            }
        } catch (error) {
            Alert.alert("Error", "Network error");
        }
    };

    const openDetail = (group: GroupedTask) => {
        setSelectedGroup(group);
        setDetailModalVisible(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
        }

        if (selectedDate) {
            setTempDate(selectedDate);
            // If we just picked a date, now pick a time (conceptually, or just one picker if mode is datetime but android splits them)
            // For simplicity, let's just do time picking if that's what the user mainly wants, OR
            // let's do a flow: Date -> Time.

            if (pickerMode === 'date') {
                setPickerMode('time');
                // On Android we need to reopen for time
                if (Platform.OS === 'android') {
                    setTimeout(() => setShowPicker(true), 100);
                }
            } else {
                // Time picked, done.
                // Format: YYYY-MM-DD HH:MM:SS
                const iso = selectedDate.toISOString();
                // ISO is UTC. We might want local.
                // Manual format to local string:
                const YYYY = selectedDate.getFullYear();
                const MM = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const DD = String(selectedDate.getDate()).padStart(2, '0');
                const HH = String(selectedDate.getHours()).padStart(2, '0');
                const Min = String(selectedDate.getMinutes()).padStart(2, '0');
                const SS = String(selectedDate.getSeconds()).padStart(2, '0');

                setScheduledTime(`${YYYY}-${MM}-${DD} ${HH}:${Min}:${SS}`);
                setPickerMode('date'); // Reset for next time
            }
        } else {
            // Cancelled
            setPickerMode('date');
        }
    };

    const showTimePicker = () => {
        setPickerMode('date'); // Start with date, then time
        setTempDate(new Date());
        setShowPicker(true);
    };

    const renderGroupItem = ({ item, index }: { item: GroupedTask, index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 50).springify()}
            style={styles.card}
        >
            <TouchableOpacity onPress={() => openDetail(item)} activeOpacity={0.7}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
                    <View style={styles.progressBadge}>
                        <Text style={styles.progressText}>{item.completed}/{item.total} Completed</Text>
                    </View>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>

                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${(item.completed / item.total) * 100}%` }]} />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderDetailItem = ({ item }: { item: Task }) => (
        <View style={styles.detailRow}>
            <View style={styles.cadetInfo}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.cadet_name.substring(0, 1).toUpperCase()}</Text>
                </View>
                <View>
                    <Text style={styles.cadetName}>{item.cadet_name}</Text>
                    {item.status === 'Pending' && (
                        <TouchableOpacity onPress={async () => {
                            // Quick hack to get number if not in item:
                            // In real app, item should have mobile_number joined.
                            // For now we try to open directory or just prompt.
                            // But user insisted "Student will be called". 
                            // We really should join the table. I'll do that in backend next.
                            // Assuming item.mobile_number exists:
                            if (item.mobile_number) {
                                Linking.openURL(`tel:${item.mobile_number}`);
                            } else {
                                Alert.alert("No Number", "Fetch updated tasks to see number.");
                            }
                        }}>
                            <Text style={styles.callLink}>Call if overdue</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            <View style={[styles.statusTag, item.status === 'Completed' ? styles.statusCompleted : styles.statusPending]}>
                <Text style={[styles.statusTagText, item.status === 'Completed' ? styles.textCompleted : styles.textPending]}>
                    {item.status}
                </Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Task Management</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                    <IOIcon name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : groupedTasks.length === 0 ? (
                <View style={styles.center}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No tasks assigned yet</Text>
                </View>
            ) : (
                <FlatList
                    data={groupedTasks}
                    renderItem={renderGroupItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Create Task Modal */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Task</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <IOIcon name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Task Description</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter task details..."
                            value={taskDescription}
                            onChangeText={setTaskDescription}
                            multiline
                        />

                        <View style={styles.switchRow}>
                            <Text style={styles.label}>Assign to All Cadets</Text>
                            <Switch
                                value={assignAll}
                                onValueChange={setAssignAll}
                                trackColor={{ false: "#D1D5DB", true: "#818CF8" }}
                                thumbColor={assignAll ? "#4F46E5" : "#f4f3f4"}
                            />
                        </View>

                        {!assignAll && (
                            <View>
                                <Text style={styles.label}>Specific Cadet name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter cadet name"
                                    value={specificCadet}
                                    onChangeText={setSpecificCadet}
                                />
                            </View>
                        )}


                        <Text style={styles.label}>Schedule (Optional)</Text>
                        <View style={styles.scheduleRow}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                placeholder="YYYY-MM-DD HH:MM:SS"
                                value={scheduledTime}
                                onChangeText={setScheduledTime}
                            />
                            <TouchableOpacity style={styles.clockBtn} onPress={showTimePicker}>
                                <IOIcon name="time-outline" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {showPicker && (
                            <DateTimePicker
                                value={tempDate}
                                mode={pickerMode}
                                is24Hour={true}
                                display="default"
                                onChange={handleDateChange}
                            />
                        )}

                        <TouchableOpacity style={[styles.submitButton, { marginTop: 20 }]} onPress={handleAssign}>
                            <Text style={styles.submitText}>Assign Task</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Detail Modal */}
            <Modal
                visible={detailModalVisible}
                animationType="slide"
                onRequestClose={() => setDetailModalVisible(false)}
            >
                <View style={styles.detailContainer}>
                    <View style={styles.detailHeader}>
                        <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.closeDetailBtn}>
                            <IOIcon name="close" size={24} color="#111827" />
                        </TouchableOpacity>
                        <Text style={styles.detailTitle} numberOfLines={1}>
                            {selectedGroup?.title || "Task Details"}
                        </Text>
                    </View>

                    <FlatList
                        data={selectedGroup?.tasks || []}
                        renderItem={renderDetailItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.detailList}
                    />
                </View>
            </Modal>
        </View>
    );
}

// Helper for Icons to avoid clutter
const IOIcon = ({ name, size, color }: { name: any, size: number, color: string }) => (
    <Ionicons name={name} size={size} color={color} />
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
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
        borderRadius: 12, // slightly squarish
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        color: '#9CA3AF',
        fontSize: 16,
    },
    listContent: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    cardDate: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    progressBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    progressText: {
        fontSize: 11,
        color: '#4F46E5',
        fontWeight: '700',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 3,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        marginBottom: 20,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    submitButton: {
        backgroundColor: '#4F46E5',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    detailContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    closeDetailBtn: {
        padding: 8,
        marginRight: 12,
    },
    detailTitle: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
    },
    detailList: {
        padding: 20,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    cadetInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E0E7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#4F46E5',
        fontWeight: '700',
        fontSize: 14,
    },
    cadetName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    statusTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusCompleted: {
        backgroundColor: '#ECFDF5',
    },
    statusPending: {
        backgroundColor: '#FEF2F2',
    },
    statusTagText: {
        fontSize: 12,
        fontWeight: '600',
    },
    textCompleted: {
        color: '#059669',
    },
    textPending: {
        color: '#DC2626',
    },
    callLink: {
        fontSize: 11,
        color: '#DC2626',
        fontWeight: '700',
        marginTop: 2,
        textDecorationLine: 'underline'
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20
    },
    clockBtn: {
        backgroundColor: '#4F46E5',
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        // Align with input height approx
    }
});
