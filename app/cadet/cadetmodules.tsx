import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Dimensions, Image, ImageBackground, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const MODULES = [
    {
        id: 'management',
        title: 'My Profile',
        icon: 'card-account-details-outline',
        library: MaterialCommunityIcons,
        color: '#4F46E5', // Indigo
        route: '/cadet/management',
        description: 'View Service Record',
    },
    {
        id: 'attendance',
        title: 'Attendance',
        icon: 'calendar-check',
        library: MaterialCommunityIcons,
        color: '#10B981', // Emerald
        route: '/cadet/cadet_attendance',
        description: 'Check Presence',
    },
    {
        id: 'activities',
        title: 'Activities',
        icon: 'run',
        library: MaterialCommunityIcons,
        color: '#F59E0B', // Amber
        route: '/cadet/activities',
        description: 'Drills & Physical',
    },
    {
        id: 'tasks',
        title: 'Task Force',
        icon: 'clipboard-list-outline',
        library: MaterialCommunityIcons,
        color: '#0EA5E9', // Sky Blue
        route: '/cadet/cadet_tasks',
        description: 'My Assignments',
    },
    {
        id: 'badges',
        title: 'Achievements',
        icon: 'medal-outline',
        library: MaterialCommunityIcons,
        color: '#EC4899', // Pink
        route: '/cadet/cadet_badges',
        description: 'Badges & Ranks',
    },
    {
        id: 'events',
        title: 'Events',
        icon: 'tent',
        library: MaterialCommunityIcons,
        color: '#8B5CF6', // Violet
        route: '/cadet/events',
        description: 'Camps & Schedules',
    },
    {
        id: 'messages',
        title: 'Comm Center',
        icon: 'message-text-outline',
        library: MaterialCommunityIcons,
        color: '#F43F5E', // Rose
        route: '/cadet/cadet_messages',
        description: 'Staff Chat',
    },
    {
        id: 'reports',
        title: 'Submit Report',
        icon: 'file-chart-outline',
        library: MaterialCommunityIcons,
        color: '#6366F1', // Indigo
        route: '/cadet/cadet_report_submission',
        description: 'Daily Updates',
    },
    {
        id: 'location',
        title: 'Location',
        icon: 'map-marker-radius-outline',
        library: MaterialCommunityIcons,
        color: '#059669', // Emerald
        route: '/cadet/location_sharing',
        description: 'Live Tracking',
    },
    {
        id: 'ai_chat',
        title: 'AI Assistant',
        icon: 'robot-outline',
        library: MaterialCommunityIcons,
        color: '#2563EB', // Blue
        route: '/cadet/cadet_ai_chat',
        description: 'Virtual Support',
    },
];

export default function CadetModules() {
    const router = useRouter();
    const [userName, setUserName] = React.useState("Cadet");
    const [modalVisible, setModalVisible] = React.useState(false);
    const [profileImage, setProfileImage] = React.useState<string | null>(null);

    // Mobile Number Request State
    const [mobileModalVisible, setMobileModalVisible] = React.useState(false);
    const [mobileNum, setMobileNum] = React.useState("");
    const [statusLoading, setStatusLoading] = React.useState(false);

    React.useEffect(() => {
        const getName = async () => {
            const name = await AsyncStorage.getItem("userName");
            if (name) setUserName(name);
        };
        getName();
        checkMobileStatus();
    }, []);


    const checkMobileStatus = async () => {
        try {
            const email = await AsyncStorage.getItem("userEmail");
            if (!email) return;

            const res = await fetch(`http://192.168.43.201:5000/api/contact/status?email=${email}`);
            if (res.ok) {
                const data = await res.json();
                // If mobile number is requested AND (we don't have one OR we want to force update if requested even if we have one? Usually request implies need. Let's assume request = TRUE means we need it, regardless. But usually if we have it, we might not need to ask. But Admin "Request" button sets mobile_req=TRUE. So we obey flag.)
                // Actually if admin requests, mobile_req is 1.
                if (data.mobile_req) {
                    setMobileNum(data.mobile_number || "");
                    setMobileModalVisible(true);
                }
            }
        } catch (e) {
            console.log("Error checking mobile status", e);
        }
    };

    const submitMobile = async () => {
        if (!mobileNum || mobileNum.length < 10) {
            Alert.alert("Invalid Number", "Please enter a valid mobile number.");
            return;
        }

        try {
            setStatusLoading(true);
            const email = await AsyncStorage.getItem("userEmail");
            const res = await fetch("http://192.168.43.201:5000/api/contact/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, mobile_number: mobileNum })
            });
            setStatusLoading(false);
            if (res.ok) {
                Alert.alert("Success", "Mobile number updated.");
                setMobileModalVisible(false);
            } else {
                Alert.alert("Error", "Failed to update.");
            }
        } catch (e) {
            setStatusLoading(false);
            Alert.alert("Error", "Server error.");
        }
    };

    const handlePress = (route: string) => {
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

    // Calculate Greeting based on time
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
                                <Text style={styles.bannerTitle}>Cadet Operational{"\n"}Hub</Text>
                                <Text style={styles.bannerSubtitle}>Access your modules and track progress.</Text>
                            </View>
                            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/cadet/cadet_tasks')}>
                                <Text style={styles.actionButtonText}>My Tasks</Text>
                                <MaterialIcons name="arrow-forward" size={16} color="#4F46E5" />
                            </TouchableOpacity>
                        </View>
                    </ImageBackground>
                </Animated.View>

                {/* Section Title */}
                <View style={styles.sectionHeaderContainer}>
                    <Text style={styles.sectionHeader}>Quick Access</Text>
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
                            <Text style={styles.modalOptionText}>Change Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalOption} onPress={() => { setModalVisible(false); Alert.alert("Help", "Contact your commanding officer."); }}>
                            <Ionicons name="help-circle-outline" size={22} color="#4B5563" />
                            <Text style={styles.modalOptionText}>Support</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.modalOption} onPress={handleLogout}>
                            <MaterialIcons name="logout" size={22} color="#EF4444" />
                            <Text style={[styles.modalOptionText, { color: '#EF4444' }]}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Mobile Number Update Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={mobileModalVisible}
                onRequestClose={() => { /* Prevent closing if mandatory */ }}
            >
                <View style={styles.mobileModalOverlay}>
                    <View style={styles.mobileModalContent}>
                        <View style={styles.mobileIconCircle}>
                            <Ionicons name="call" size={32} color="#fff" />
                        </View>
                        <Text style={styles.mobileTitle}>Action Required</Text>
                        <Text style={styles.mobileDesc}>
                            Please update your contact number for emergency alerts.
                        </Text>

                        <TextInput
                            style={styles.mobileInput}
                            placeholder="+91 99999 99999"
                            placeholderTextColor="#9ca3af"
                            keyboardType="phone-pad"
                            value={mobileNum}
                            onChangeText={setMobileNum}
                        />

                        <TouchableOpacity style={styles.mobileSubmitBtn} onPress={submitMobile} disabled={statusLoading}>
                            <Text style={styles.mobileSubmitText}>{statusLoading ? "Saving..." : "Verify & Save"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View >
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
    cardHeader: {
        // Not used directly in new layout logic inside Touchable
    },
    textContainer: {
        // Not used directly in new layout logic inside Touchable
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
    mobileModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 24,
        // backdropFilter: 'blur(5px)', // Works on web/some basic properties
    },
    mobileModalContent: {
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 32,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    mobileIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: "#4F46E5",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    mobileTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    mobileDesc: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    mobileInput: {
        width: '100%',
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        padding: 18,
        fontSize: 18,
        color: '#111827',
        fontWeight: '600',
        marginBottom: 24,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    mobileSubmitBtn: {
        width: '100%',
        backgroundColor: '#4F46E5',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: "#4F46E5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    mobileSubmitText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    }
});
