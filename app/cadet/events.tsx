import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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

interface Event {
    id: number;
    title: string;
    date: string;
    description: string;
}

export default function CadetEvents() {
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const API_URL = "http://192.168.43.201:5000/api/events";

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                const data = await response.json();
                setEvents(data);
            } else {
                console.error("Failed to fetch events");
            }
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchEvents();
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const renderItem = ({ item, index }: { item: Event; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 100).springify()}
            style={styles.cardContainer}
        >
            <View style={styles.card}>
                <View style={styles.dateBox}>
                    <Text style={styles.dateDay}>{new Date(item.date).getDate()}</Text>
                    <Text style={styles.dateMonth}>{new Date(item.date).toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</Text>
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
                    <Text style={styles.cardDescription}>{item.description}</Text>
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
                <Text style={styles.headerTitle}>Upcoming Events</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#8B5CF6" />
                </View>
            ) : events.length === 0 ? (
                <View style={styles.centerContainer}>
                    <MaterialCommunityIcons name="tent" size={64} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No upcoming events found.</Text>
                </View>
            ) : (
                <FlatList
                    data={events}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
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
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
    },
    dateBox: {
        width: 80,
        backgroundColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    dateDay: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    dateMonth: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    cardContent: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 6,
    },
    cardDate: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 10,
        fontWeight: '500',
    },
    cardDescription: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
});
