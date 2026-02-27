import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface AttendanceRecord {
    id: number;
    date: string;
    status: string;
    cadet_name: string;
}

export default function CadetAttendance() {
    const router = useRouter();
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("Cadet");
    const [userId, setUserId] = useState<string | null>(null);

    const API_URL = "http://192.168.43.201:5000/api/attendance/cadet";

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const storedId = await AsyncStorage.getItem("userId");
            const name = await AsyncStorage.getItem("userName");
            if (name) setUserName(name);
            if (storedId) setUserId(storedId);

            if (!storedId) {
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/${storedId}`);
            if (response.ok) {
                const data = await response.json();
                setAttendance(data);
            }
        } catch (error) {
            console.error("Error fetching attendance:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status.toLowerCase()) {
            case 'present':
                return { color: '#10B981', bg: '#DCFCE7', icon: 'check-circle-outline' };
            case 'absent':
                return { color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle-outline' };
            case 'late':
                return { color: '#F59E0B', bg: '#FEF3C7', icon: 'clock-alert-outline' };
            case 'excused':
                return { color: '#3B82F6', bg: '#DBEAFE', icon: 'information-outline' };
            default:
                return { color: '#6B7280', bg: '#F3F4F6', icon: 'help-circle-outline' };
        }
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const stats = React.useMemo(() => {
        const total = attendance.length;
        const present = attendance.filter(r => r.status.toLowerCase() === 'present').length;
        const absent = attendance.filter(r => r.status.toLowerCase() === 'absent').length;
        const late = attendance.filter(r => r.status.toLowerCase() === 'late').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        return { total, present, absent, late, percentage };
    }, [attendance]);

    const renderItem = ({ item, index }: { item: AttendanceRecord; index: number }) => {
        const { color, bg, icon } = getStatusInfo(item.status);
        return (
            <Animated.View
                entering={FadeInDown.delay(index * 50).springify()}
                style={styles.cardWrapper}
            >
                <View style={styles.card}>
                    <View style={styles.cardLeft}>
                        <View style={[styles.iconBox, { backgroundColor: bg }]}>
                            <MaterialCommunityIcons name={icon as any} size={24} color={color} />
                        </View>
                        <View style={styles.dateInfo}>
                            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                            <Text style={styles.dayText}>{new Date(item.date).toLocaleDateString(undefined, { weekday: 'long' })}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
                        <Text style={[styles.statusText, { color: color }]}>{item.status}</Text>
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Attendance History</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <Animated.View entering={FadeInDown.delay(100)} style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{stats.percentage}%</Text>
                            <Text style={styles.statLabel}>Attendance</Text>
                        </View>
                        <View style={styles.verticalDivider} />
                        <View style={styles.statCard}>
                            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.present}</Text>
                            <Text style={styles.statLabel}>Present</Text>
                        </View>
                        <View style={styles.verticalDivider} />
                        <View style={styles.statCard}>
                            <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.absent}</Text>
                            <Text style={styles.statLabel}>Absent</Text>
                        </View>
                    </Animated.View>

                    <View style={styles.listContainer}>
                        <Text style={styles.sectionTitle}>Records</Text>
                        <FlatList
                            data={attendance}
                            renderItem={renderItem}
                            keyExtractor={(item, index) => index.toString()}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <MaterialCommunityIcons name="calendar-blank-outline" size={48} color="#9CA3AF" />
                                    <Text style={styles.emptyText}>No records yet.</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            )}
        </View>
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
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 24,
        padding: 20,
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    statCard: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        fontWeight: '500',
    },
    verticalDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#F3F4F6',
    },
    listContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
    },
    listContent: {
        paddingBottom: 40,
    },
    cardWrapper: {
        marginBottom: 12,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    dateInfo: {
        justifyContent: 'center',
    },
    dateText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    dayText: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        marginTop: 12,
        color: '#9CA3AF',
        fontSize: 15,
    },
});
