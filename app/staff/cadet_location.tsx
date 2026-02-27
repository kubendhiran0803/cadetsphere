import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StaffMap from '../../components/StaffMap';

const { width, height } = Dimensions.get('window');
const API_URL = "http://192.168.43.201:5000/api";

interface TrackingRecord {
    id: number;
    cadet_id: number;
    cadet_name: string;
    status: 'pending' | 'active' | 'rejected' | 'ended';
    latitude: string | null;
    longitude: string | null;
    last_updated: string;
    image_url?: string;
}

interface Cadet {
    id: number;
    name: string;
    email: string;
}

export default function StaffLocationTracking() {
    const router = useRouter();
    const [trackings, setTrackings] = useState<TrackingRecord[]>([]);
    const [cadets, setCadets] = useState<Cadet[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCadet, setSelectedCadet] = useState<Cadet | null>(null);
    const [viewingLocation, setViewingLocation] = useState<TrackingRecord | null>(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const mapRef = useRef<any>(null); // any to support ref forwarding

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchTrackings, 10000); // 10s poll
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchTrackings(), fetchCadets()]);
        setLoading(false);
    };

    const fetchTrackings = async () => {
        try {
            const staffName = await AsyncStorage.getItem("userName");
            const res = await fetch(`${API_URL}/auth/profile/${staffName}`);
            const profile = await res.json();

            if (profile && profile.id) {
                const trackRes = await fetch(`${API_URL}/location/tracking/${profile.id}`);
                if (trackRes.ok) {
                    const data = await trackRes.json();
                    setTrackings(data);

                    // If currently viewing a location, update it
                    if (viewingLocation) {
                        const updated = data.find((t: TrackingRecord) => t.id === viewingLocation.id);
                        if (updated) setViewingLocation(updated);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching trackings", error);
        }
    };

    const fetchCadets = async () => {
        try {
            const res = await fetch(`${API_URL}/auth/cadets`);
            if (res.ok) {
                const data = await res.json();
                // Filter only Cadet role
                setCadets(data.filter((c: any) => c.role === 'Cadet'));
            }
        } catch (error) {
            console.error("Error fetching cadets", error);
        }
    };

    const sendRequest = async () => {
        if (!selectedCadet) return;
        try {
            const staffName = await AsyncStorage.getItem("userName");
            const resProfile = await fetch(`${API_URL}/auth/profile/${staffName}`);
            const profile = await resProfile.json();

            const res = await fetch(`${API_URL}/location/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staff_id: profile.id,
                    cadet_id: selectedCadet.id
                })
            });

            const data = await res.json();
            if (res.ok) {
                Alert.alert("Success", "Location request sent!");
                setModalVisible(false);
                fetchTrackings();
            } else {
                Alert.alert("Error", data.message);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to send request");
        }
    };

    const endTracking = async (id: number) => {
        try {
            await fetch(`${API_URL}/location/end`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ request_id: id })
            });
            setViewingLocation(null);
            fetchTrackings();
        } catch (error) {
            console.error("Error ending tracking", error);
        }
    };

    const openMap = (record: TrackingRecord) => {
        if (record.status !== 'active') {
            Alert.alert("Wait", "Cadet has not accepted the request yet.");
            return;
        }
        if (!record.latitude) {
            Alert.alert("Wait", "Waiting for location data...");
            return;
        }
        setViewingLocation(record);
    };

    const renderItem = ({ item }: { item: TrackingRecord }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => openMap(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.cadet_name.charAt(0)}</Text>
                    </View>
                    <View>
                        <Text style={styles.cadetName}>{item.cadet_name}</Text>
                        <Text style={styles.statusText}>
                            Status: <Text style={{ color: item.status === 'active' ? '#10B981' : '#F59E0B' }}>{item.status.toUpperCase()}</Text>
                        </Text>
                    </View>
                </View>
                <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color="#9CA3AF"
                />
            </View>
            <View style={styles.cardFooter}>
                <Text style={styles.timeText}>
                    {item.last_updated ? `Updated: ${new Date(item.last_updated).toLocaleTimeString()}` : 'No updates yet'}
                </Text>
                {item.status === 'active' && (
                    <TouchableOpacity
                        style={styles.endBtn}
                        onPress={() => endTracking(item.id)}
                    >
                        <Text style={styles.endBtnText}>End Tracking</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );

    if (viewingLocation && viewingLocation.latitude && viewingLocation.longitude) {
        return (
            <View style={styles.container}>
                <View style={styles.mapHeader}>
                    <TouchableOpacity onPress={() => setViewingLocation(null)} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.mapTitle}>Tracking: {viewingLocation.cadet_name}</Text>
                    </View>
                    {viewingLocation.image_url && (
                        <TouchableOpacity onPress={() => setShowImageModal(true)} style={{ marginLeft: 8 }}>
                            <Ionicons name="image" size={24} color="#4F46E5" />
                        </TouchableOpacity>
                    )}
                </View>
                <StaffMap
                    ref={mapRef}
                    latitude={parseFloat(viewingLocation.latitude)}
                    longitude={parseFloat(viewingLocation.longitude)}
                    title={viewingLocation.cadet_name}
                    description={`Last Updated: ${new Date(viewingLocation.last_updated).toLocaleTimeString()}`}
                />
                <Modal visible={showImageModal} transparent={true} animationType="fade">
                    <View style={styles.imageModalContainer}>
                        <TouchableOpacity style={styles.closeImageBtn} onPress={() => setShowImageModal(false)}>
                            <Ionicons name="close-circle" size={36} color="#fff" />
                        </TouchableOpacity>
                        {viewingLocation.image_url && (
                            <Image
                                source={`${API_URL.replace('/api', '')}${viewingLocation.image_url}`}
                                style={styles.fullImage}
                                contentFit="contain"
                            />
                        )}
                    </View>
                </Modal>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cadet Tracking</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : (
                <FlatList
                    data={trackings}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="map-marker-off" size={48} color="#9CA3AF" />
                            <Text style={styles.emptyText}>No active trackings</Text>
                        </View>
                    }
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Cadet to Track</Text>
                        <FlatList
                            data={cadets}
                            keyExtractor={(item) => item.id.toString()}
                            style={{ maxHeight: 300 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.cadetItem}
                                    onPress={() => setSelectedCadet(item)}
                                >
                                    <View style={[styles.radio, selectedCadet?.id === item.id && styles.radioSelected]} />
                                    <Text style={styles.cadetItemText}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.btnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, !selectedCadet && { opacity: 0.5 }]}
                                onPress={sendRequest}
                                disabled={!selectedCadet}
                            >
                                <Text style={[styles.btnText, { color: '#fff' }]}>Request</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

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
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    backButton: {
        padding: 8,
    },
    addBtn: {
        backgroundColor: '#4F46E5',
        padding: 8,
        borderRadius: 20,
    },
    listContent: {
        padding: 20,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        marginTop: 10,
        color: '#6B7280',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E0E7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#4F46E5',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cadetName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    statusText: {
        fontSize: 12,
        color: '#6B7280',
    },
    cardFooter: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    timeText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    endBtn: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    endBtnText: {
        fontSize: 12,
        color: '#EF4444',
        fontWeight: '600',
    },
    mapHeader: {
        position: 'absolute',
        top: 40,
        left: 20,
        right: 20,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 12,
        borderRadius: 12,
        shadowColor: '#000',
        elevation: 5,
    },
    backBtn: {
        marginRight: 12,
    },
    mapTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: 400,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    cadetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    cadetItemText: {
        fontSize: 16,
        marginLeft: 12,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#9CA3AF',
    },
    radioSelected: {
        borderColor: '#4F46E5',
        backgroundColor: '#4F46E5',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
    },
    cancelBtn: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        flex: 1,
        alignItems: 'center',
        marginRight: 8,
    },
    confirmBtn: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#4F46E5',
        flex: 1,
        alignItems: 'center',
        marginLeft: 8,
    },
    btnText: {
        fontWeight: '600',
    },
    imageModalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeImageBtn: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 10,
    },
    fullImage: {
        width: '100%',
        height: '80%',
    },
});
