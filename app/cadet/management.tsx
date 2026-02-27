import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface UserProfile {
    id: number;
    name: string;
    email: string;
    role: string;
    unique_id?: string;
    joined_at?: string;
}

export default function CadetManagement() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const API_URL = "http://192.168.43.201:5000/api/auth";

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    const fetchProfile = async () => {
        try {
            const name = await AsyncStorage.getItem("userName");
            if (!name) {
                setLoading(false);
                return;
            }
            const response = await fetch(`${API_URL}/profile/${name}`);
            if (response.ok) {
                const data = await response.json();
                setProfile(data);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            const confirm = window.confirm("Are you sure you want to log out?");
            if (confirm) {
                AsyncStorage.clear().then(() => {
                    router.replace('/');
                });
            }
        } else {
            Alert.alert(
                "Logout",
                "Are you sure you want to log out?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Logout",
                        style: "destructive",
                        onPress: async () => {
                            await AsyncStorage.clear();
                            router.replace('/');
                        }
                    }
                ]
            );
        }
    };

    const formatCadetId = (id: number) => {
        const year = new Date().getFullYear();
        return `CDT-${year}-${id.toString().padStart(4, '0')}`;
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "Pending Update";
        return new Date(dateStr).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Profile</Text>
                <TouchableOpacity onPress={handleLogout} style={[styles.iconButton, styles.logoutBtn]}>
                    <MaterialCommunityIcons name="logout" size={22} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Main Profile Card */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'C'}
                            </Text>
                        </View>
                        <View style={styles.activeBadge} />
                    </View>
                    <Text style={styles.userName}>{profile?.name}</Text>
                    <View style={styles.roleTag}>
                        <Text style={styles.roleText}>{profile?.role || 'Cadet'}</Text>
                    </View>
                </Animated.View>

                {/* Info Section - Fixed Alignment */}
                <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.infoSection}>
                    {/* Email Row - Vertical Stack for Long Text */}
                    <View style={styles.infoRow}>
                        <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                            <Ionicons name="mail" size={20} color="#4F46E5" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Email Address</Text>
                            <Text style={styles.infoValue}>{profile?.email}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Cadet ID Row */}
                    <View style={styles.infoRow}>
                        <View style={[styles.iconBox, { backgroundColor: '#F0F9FF' }]}>
                            <Ionicons name="card" size={20} color="#0EA5E9" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Cadet ID</Text>
                            <Text style={styles.infoValue}>
                                {profile?.unique_id || '---'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Joined Date Row */}
                    <View style={styles.infoRow}>
                        <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                            <Ionicons name="calendar" size={20} color="#16A34A" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Joined On</Text>
                            <Text style={styles.infoValue}>
                                {formatDate(profile?.joined_at)}
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Unique Personal Records Section */}
                <Text style={styles.sectionHeader}>Service Records</Text>

                <View style={styles.recordsGrid}>
                    {/* Medical Card */}
                    <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.recordCard}>
                        <View style={[styles.recordIcon, { backgroundColor: '#FEF2F2' }]}>
                            <MaterialCommunityIcons name="medical-bag" size={24} color="#EF4444" />
                        </View>
                        <Text style={styles.recordTitle}>Medical Info</Text>
                        <Text style={styles.recordSubtitle}>Blood Group: O+</Text>
                        <Text style={styles.recordSubtitle}>Allergies: None</Text>
                    </Animated.View>

                    {/* Uniform Card */}
                    <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.recordCard}>
                        <View style={[styles.recordIcon, { backgroundColor: '#FFF7ED' }]}>
                            <MaterialCommunityIcons name="tshirt-crew" size={24} color="#F97316" />
                        </View>
                        <Text style={styles.recordTitle}>Uniform Kit</Text>
                        <Text style={styles.recordSubtitle}>Shirt Size: M</Text>
                        <Text style={styles.recordSubtitle}>Boot Size: 9</Text>
                    </Animated.View>
                </View>

                {/* Guardian / Emergency Card - Full Width */}
                <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.fullWidthCard}>
                    <View style={styles.rowCentered}>
                        <View style={[styles.recordIcon, { backgroundColor: '#F5F3FF' }]}>
                            <MaterialCommunityIcons name="shield-account" size={24} color="#7C3AED" />
                        </View>
                        <View style={{ marginLeft: 12 }}>
                            <Text style={styles.recordTitle}>Emergency Contact</Text>
                            <Text style={styles.recordSubtitle}>Guardian: Father • +91 9876543210</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.editBtn}>
                        <MaterialCommunityIcons name="pencil" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                </Animated.View>

            </ScrollView>
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
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
    },
    iconButton: {
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    logoutBtn: {
        backgroundColor: '#FEF2F2',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 10,
    },
    // Main Profile Card
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 6,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#E0E7FF',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
    },
    activeBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#10B981',
        borderWidth: 3,
        borderColor: '#fff',
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 8,
    },
    roleTag: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    roleText: {
        color: '#4F46E5',
        fontWeight: '700',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    // Info Section
    infoSection: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center', // Aligns icon with the top of text if multi-line
        paddingVertical: 12,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        lineHeight: 22,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginLeft: 60, // Align with text start
    },
    // Service Records
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
        marginLeft: 4,
    },
    recordsGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    recordCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    recordIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    recordTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    recordSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
        fontWeight: '500',
    },
    fullWidthCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 30,
    },
    rowCentered: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editBtn: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
    },
});
