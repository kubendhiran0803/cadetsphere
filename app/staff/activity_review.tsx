import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

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

export default function ActivityReview() {
    const router = useRouter();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');

    const API_URL = "http://192.168.43.201:5000/api/activities";

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const response = await fetch(API_URL);
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

    const updateStatus = async (id: number, status: 'Approved' | 'Rejected') => {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                // Optimistic update
                setActivities(prev => prev.map(a => a.id === id ? { ...a, status } : a));
                Alert.alert("Success", `Activity marked as ${status}`);
            } else {
                Alert.alert("Error", "Failed to update status");
            }
        } catch (error) {
            Alert.alert("Error", "Network error");
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchActivities();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return '#10B981';
            case 'Rejected': return '#EF4444';
            default: return '#F59E0B';
        }
    };

    const filteredActivities = activities.filter(a => {
        if (filter === 'All') return true;
        return a.status === filter;
    });

    const renderItem = ({ item, index }: { item: Activity; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 50).springify()}
            style={styles.cardContainer}
        >
            <View style={styles.card}>
                <View style={[styles.statusStrip, { backgroundColor: getStatusColor(item.status) }]} />
                <View style={styles.cardContent}>
                    <View style={styles.headerRow}>
                        <View style={styles.cadetBadge}>
                            <MaterialCommunityIcons name="account" size={12} color="#4F46E5" />
                            <Text style={styles.cadetName}>{item.cadet_name}</Text>
                        </View>
                        <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
                    </View>

                    <Text style={styles.activityTitle}>{item.activity_name}</Text>

                    <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                            <MaterialCommunityIcons name="shape-outline" size={14} color="#6B7280" />
                            <Text style={styles.detailText}>{item.category}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color="#6B7280" />
                            <Text style={styles.detailText}>{item.duration}</Text>
                        </View>
                    </View>

                    {item.status === 'Pending' ? (
                        <View style={styles.actionContainer}>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.rejectBtn]}
                                onPress={() => updateStatus(item.id, 'Rejected')}
                            >
                                <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                                <Text style={styles.rejectText}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.approveBtn]}
                                onPress={() => updateStatus(item.id, 'Approved')}
                            >
                                <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                                <Text style={styles.approveText}>Approve</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                {item.status.toUpperCase()}
                            </Text>
                        </View>
                    )}
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
                <Text style={styles.headerTitle}>Activity Review</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                {(['Pending', 'All', 'Approved', 'Rejected'] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterTab, filter === f && styles.activeFilterTab]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>
                            {f}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : filteredActivities.length === 0 ? (
                <View style={styles.centerContainer}>
                    <MaterialCommunityIcons name="check-all" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No {filter.toLowerCase()} activities found.</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredActivities}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
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
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    activeFilterTab: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    filterText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },
    activeFilterText: {
        color: '#fff',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#9CA3AF',
        fontWeight: '500',
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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cadetBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    cadetName: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4F46E5',
    },
    dateText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    detailsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: 12,
        color: '#6B7280',
    },
    actionContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        gap: 6,
    },
    rejectBtn: {
        borderColor: '#FECACA',
        backgroundColor: '#FEF2F2',
    },
    approveBtn: {
        borderColor: '#A7F3D0',
        backgroundColor: '#ECFDF5',
    },
    rejectText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#EF4444',
    },
    approveText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#10B981',
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
});
