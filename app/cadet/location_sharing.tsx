import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const API_URL = "http://192.168.43.201:5000/api";

interface Request {
    id: number;
    staff_name: string;
    created_at: string;
}

export default function CadetLocationSharing() {
    const router = useRouter();
    const [requests, setRequests] = useState<Request[]>([]);
    const [activeTracking, setActiveTracking] = useState<number | null>(null); // Request ID
    const [loading, setLoading] = useState(true);
    const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        checkPermissionsAndFetch();
        return () => stopSharing();
    }, []);

    const checkPermissionsAndFetch = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission to access location was denied');
            setLoading(false);
            return;
        }

        fetchData();
        // Poll for new requests
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    };

    const fetchData = async () => {
        try {
            const name = await AsyncStorage.getItem("userName");
            const resProfile = await fetch(`${API_URL}/auth/profile/${name}`);
            const profile = await resProfile.json();

            if (profile && profile.id) {
                // Fetch Pending
                const resPending = await fetch(`${API_URL}/location/pending/${profile.id}`);
                const pendingData = await resPending.json();
                setRequests(pendingData);

                // Check Active
                const resActive = await fetch(`${API_URL}/location/active/${profile.id}`);
                const activeData = await resActive.json();

                if (activeData.length > 0) {
                    const activeId = activeData[0].id;
                    setActiveTracking(activeId);
                    if (!isSharing) startSharing(activeId);
                } else {
                    setActiveTracking(null);
                    if (isSharing) stopSharing();
                }
            }
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    const startSharing = async (requestId: number) => {
        setIsSharing(true);
        console.log("Starting location sharing...");
        try {
            const sub = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 5000,
                    distanceInterval: 10,
                },
                (location) => {
                    updateLocation(requestId, location.coords.latitude, location.coords.longitude);
                }
            );
            setLocationSubscription(sub);
        } catch (err) {
            console.error(err);
            setIsSharing(false);
        }
    };

    const stopSharing = () => {
        if (locationSubscription) {
            locationSubscription.remove();
            setLocationSubscription(null);
        }
        setIsSharing(false);
        console.log("Stopped location sharing.");
    };

    const updateLocation = async (requestId: number, lat: number, long: number) => {
        try {
            await fetch(`${API_URL}/location/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    request_id: requestId,
                    latitude: lat,
                    longitude: long
                })
            });
        } catch (error) {
            console.log("Failed to update location");
        }
    };

    const handleRespond = async (id: number, status: 'active' | 'rejected') => {
        let imageUrl = null;

        if (status === 'active') {
            const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
            if (cameraStatus !== 'granted') {
                Alert.alert("Permission Denied", "Camera permission is required to share location.");
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.5,
            });

            if (!result.canceled) {
                const localUri = result.assets[0].uri;
                const formData = new FormData();
                formData.append('file', {
                    uri: localUri,
                    name: 'location_capture.jpg',
                    type: 'image/jpeg'
                } as any);

                try {
                    const uploadRes = await fetch(`${API_URL}/upload`, {
                        method: 'POST',
                        body: formData,
                    });
                    const uploadData = await uploadRes.json();
                    if (uploadRes.ok) {
                        imageUrl = uploadData.url;
                    } else {
                        Alert.alert("Error", "Failed to upload image");
                        return;
                    }
                } catch (e) {
                    console.log("Upload failed", e);
                    Alert.alert("Error", "Failed to upload image");
                    return;
                }
            } else {
                // User cancelled photo
                // We stop here because user requirement implies capturing image is part of the flow
                return;
            }
        }

        try {
            await fetch(`${API_URL}/location/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ request_id: id, status, image_url: imageUrl })
            });
            fetchData();
            if (status === 'active') {
                startSharing(id);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to respond");
        }
    };

    const renderItem = ({ item, index }: { item: Request, index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100)} style={styles.card}>
            <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="map-marker-radius" size={24} color="#4F46E5" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.staffName}>{item.staff_name}</Text>
                    <Text style={styles.subText}>Requesting location access</Text>
                    <Text style={styles.timeText}>{new Date(item.created_at).toLocaleString()}</Text>
                </View>
            </View>
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.btn, styles.rejectBtn]}
                    onPress={() => handleRespond(item.id, 'rejected')}
                >
                    <Text style={[styles.btnText, { color: '#EF4444' }]}>Deny</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.btn, styles.acceptBtn]}
                    onPress={() => handleRespond(item.id, 'active')}
                >
                    <Text style={[styles.btnText, { color: '#fff' }]}>Allow</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Location Requests</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.statusContainer}>
                <View style={[styles.statusIndicator, { backgroundColor: isSharing ? '#10B981' : '#E5E7EB' }]}>
                    <MaterialCommunityIcons
                        name={isSharing ? "map-marker-radius" : "map-marker-off"}
                        size={32}
                        color={isSharing ? "#fff" : "#9CA3AF"}
                    />
                </View>
                <Text style={styles.statusText}>
                    {isSharing ? "Sharing Location Active" : "Not Sharing Location"}
                </Text>
                {isSharing && <Text style={styles.statusSubText}>Staff can see your realtime position</Text>}
            </View>

            <Text style={styles.sectionTitle}>Pending Requests</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No new requests</Text>
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
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    statusContainer: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#fff',
        marginBottom: 24,
    },
    statusIndicator: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    statusText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    statusSubText: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#6B7280',
        marginLeft: 20,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    listContent: {
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    staffName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    subText: {
        fontSize: 14,
        color: '#4B5563',
    },
    timeText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    btn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
    },
    rejectBtn: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    acceptBtn: {
        borderColor: '#4F46E5',
        backgroundColor: '#4F46E5',
    },
    btnText: {
        fontWeight: '600',
        fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        marginTop: 20,
    }
});
