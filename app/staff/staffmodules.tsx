import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Dimensions, Image, ImageBackground, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Define the modules with their respective configurations
const MODULES = [
    {
        id: 'attendance',
        title: 'Attendance',
        icon: 'calendar-check',
        library: MaterialCommunityIcons,
        color: '#4F46E5', // Indigo
        route: '/staff/attendance',
        description: 'Track & Manage',
    },
    {
        id: 'calendar',
        title: 'Calendar',
        icon: 'calendar-month',
        library: MaterialIcons,
        color: '#0EA5E9', // Sky Blue
        route: '/staff/calendar',
        description: 'Events & Schedules',
    },
    {
        id: 'tasks',
        title: 'Tasks',
        icon: 'clipboard-list-outline',
        library: MaterialCommunityIcons,
        color: '#10B981', // Emerald
        route: '/staff/tasks',
        description: 'My Duties',
    },
    {
        id: 'messages',
        title: 'Messages',
        icon: 'chat-bubble-outline',
        library: MaterialIcons,
        color: '#F59E0B', // Amber
        route: '/staff/messages',
        description: 'Team Chat',
    },
    {
        id: 'badges',
        title: 'Badges',
        icon: 'badge-account-outline',
        library: MaterialCommunityIcons,
        color: '#EC4899', // Pink
        route: '/staff/badges',
        description: 'ID & Access',
    },
    {
        id: 'achievements',
        title: 'Achievements',
        icon: 'trophy-outline',
        library: MaterialCommunityIcons,
        color: '#8B5CF6', // Violet
        route: '/staff/achievements',
        description: 'Awards & Goals',
    },
    {
        id: 'reports',
        title: 'Reports Review',
        icon: 'file-document-check-outline',
        library: MaterialCommunityIcons,
        color: '#F43F5E', // Rose
        route: '/staff/staff_reports',
        description: 'Cadet Submissions',
    },
    {
        id: 'activity_review',
        title: 'Activity Review',
        icon: 'clipboard-check-outline',
        library: MaterialCommunityIcons,
        color: '#EA580C', // Orange
        route: '/staff/activity_review',
        description: 'Approve Logs',
    },
    {
        id: 'location',
        title: 'Cadet Location',
        icon: 'map-marker-radius-outline',
        library: MaterialCommunityIcons,
        color: '#059669', // Emerald
        route: '/staff/cadet_location',
        description: 'Track Locations',
    },
    {
        id: 'directory',
        title: 'Cadet Directory',
        icon: 'card-account-phone-outline',
        library: MaterialCommunityIcons,
        color: '#6366F1', // Indigo
        route: '/staff/cadet_directory',
        description: 'Contact & Calls',
    },
];

export default function StaffModules() {
    const router = useRouter();
    const [userName, setUserName] = React.useState("Staff");
    const [userRole, setUserRole] = React.useState("Staff"); // Role from DB
    const [uniqueId, setUniqueId] = React.useState<string>(""); // Added uniqueId
    const [modalVisible, setModalVisible] = React.useState(false);
    const [profileImage, setProfileImage] = React.useState<string | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            const getProfile = async () => {
                const name = await AsyncStorage.getItem("userName");
                if (name) {
                    setUserName(name);
                    // Fetch full profile from API to get ID and Role
                    try {
                        const res = await fetch(`http://192.168.43.201:5000/api/auth/profile/${name}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.unique_id) setUniqueId(data.unique_id);
                            if (data.role) setUserRole(data.role);
                        }
                    } catch (e) {
                        console.log("Error fetching profile", e);
                    }
                }
            };
            getProfile();
        }, [])
    );

    const handlePress = (route: string) => {
        // Navigate if route exists, else show a placeholder action
        // In a real app we might check if route matches a file, but here we just try to push
        router.push(route as any);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
        }
        setModalVisible(false);
    };

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            const confirm = window.confirm("Are you sure you want to logout?");
            if (confirm) {
                AsyncStorage.clear().then(() => {
                    router.replace('/');
                });
            }
        } else {
            Alert.alert(
                "Logout",
                "Are you sure you want to logout?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Logout",
                        onPress: async () => {
                            await AsyncStorage.clear();
                            router.replace('/');
                        },
                        style: 'destructive'
                    }
                ]
            );
        }
        setModalVisible(false);
    };

    const handleHelp = () => {
        setModalVisible(false);
        Alert.alert("Help", "For assistance, please contact the admin or support.");
    };

    const getGreeting = () => {
        const hours = new Date().getHours();
        if (hours < 12) return "Good Morning,";
        if (hours < 18) return "Good Afternoon,";
        return "Good Evening,";
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <View>
                    <Text style={styles.greetingText}>{getGreeting()}</Text>
                    <Text style={styles.headerTitle}>{userName}</Text>
                    {!!uniqueId && (
                        <View style={styles.idBadge}>
                            <Text style={styles.idText}>{uniqueId}</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity style={styles.profileButton} onPress={() => setModalVisible(true)}>
                    {profileImage ? (
                        <Image source={{ uri: profileImage }} style={styles.profileImage} />
                    ) : (
                        <View style={styles.profilePlaceholder}>
                            <Ionicons name="person" size={20} color="#fff" />
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Modern Banner */}
                <Animated.View
                    entering={FadeInDown.delay(200).duration(800)}
                    style={styles.bannerContainer}
                >
                    <ImageBackground
                        source={require('../../assets/images/cadet_dashboard_banner_v2.png')}
                        style={styles.bannerImage}
                        imageStyle={{ borderRadius: 24 }}
                    >
                        <View style={styles.bannerOverlay}>
                            <View style={styles.bannerTextContainer}>
                                <View style={styles.statusChip}>
                                    <View style={styles.statusDot} />
                                    <Text style={styles.statusText}>System Active</Text>
                                </View>
                                <Text style={styles.bannerTitle}>Cadet Sphere Prime</Text>
                                <Text style={styles.bannerSubtitle}>Manage your day efficiently.</Text>
                            </View>
                            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/staff/tasks')}>
                                <Text style={styles.actionButtonText}>Check Schedule</Text>
                                <MaterialIcons name="arrow-forward" size={16} color="#4F46E5" />
                            </TouchableOpacity>
                        </View>
                    </ImageBackground>
                </Animated.View>

                {/* Section Title */}
                <View style={styles.sectionHeaderContainer}>
                    <Text style={styles.sectionHeader}>Quick Actions</Text>
                </View>

                {/* Grid Modules */}
                <View style={styles.gridContainer}>
                    {MODULES.map((module, index) => {
                        const IconLib = module.library;
                        return (
                            <Animated.View
                                key={module.id}
                                entering={FadeInDown.delay(300 + index * 50).springify()}
                                style={styles.cardWrapper}
                            >
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    style={styles.card}
                                    onPress={() => handlePress(module.route)}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: `${module.color}15` }]}>
                                        <IconLib name={module.icon as any} size={28} color={module.color} />
                                    </View>

                                    <View style={styles.cardContent}>
                                        <Text style={styles.cardTitle}>{module.title}</Text>
                                        <Text style={styles.cardDescription} numberOfLines={1}>{module.description}</Text>
                                    </View>

                                    <View style={styles.cardArrow}>
                                        <MaterialIcons name="chevron-right" size={20} color="#D1D5DB" />
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.modalOption} onPress={pickImage}>
                            <Ionicons name="camera-outline" size={22} color="#4B5563" />
                            <Text style={styles.modalOptionText}>Upload Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalOption} onPress={handleHelp}>
                            <Ionicons name="help-circle-outline" size={22} color="#4B5563" />
                            <Text style={styles.modalOptionText}>Help</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.modalOption} onPress={handleLogout}>
                            <MaterialIcons name="logout" size={22} color="#EF4444" />
                            <Text style={[styles.modalOptionText, { color: '#EF4444' }]}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // Slightly cooler grey
    },
    headerContainer: {
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingHorizontal: 24,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    greetingText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
    },
    idBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    idText: {
        color: '#4F46E5',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    profileButton: {
        // padding: 4,
    },
    profilePlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 28,
    },
    bannerContainer: {
        height: 220, // Increased height for better spacing
        width: '100%',
        marginBottom: 32,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    bannerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.4)', // Darker overlay for text readability
        padding: 24,
        justifyContent: 'space-between', // Ensures text at top, button at bottom
    },
    bannerTextContainer: {
        // Removed flex: 1 to allow natural spacing
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#34D399',
        marginRight: 6,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    bannerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 6,
        lineHeight: 32,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    bannerSubtitle: {
        fontSize: 14,
        color: '#E2E8F0',
        fontWeight: '500',
        maxWidth: '80%',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 'auto',
    },
    actionButtonText: {
        color: '#4F46E5',
        fontWeight: '700',
        fontSize: 14,
        marginRight: 6,
    },
    sectionHeaderContainer: {
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    sectionDivider: {
        // Unused now
        display: 'none',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    cardWrapper: {
        width: (width - 48 - 14) / 2, // 48 padding, 14 gap
        marginBottom: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        height: 145,
        justifyContent: 'space-between',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#F9FAFB',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        marginTop: 12,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    cardArrow: {
        position: 'absolute',
        top: 16,
        right: 16,
        opacity: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: Platform.OS === 'ios' ? 110 : 90,
        paddingRight: 24,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        paddingVertical: 8,
        width: 200,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    modalOptionText: {
        marginLeft: 12,
        fontSize: 15,
        fontWeight: '500',
        color: '#374151',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 4,
    },
});
