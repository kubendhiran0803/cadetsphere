import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  unique_id: string;
  status: 'active' | 'removed' | 'banned';
  last_login?: string;
}

export default function ManageUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Action Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);

  const USERS_URL = "http://192.168.43.201:5000/api/auth/manage/users";
  const STATUS_URL = "http://192.168.43.201:5000/api/auth/manage/status";

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(USERS_URL);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.log("Error fetching users", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [fetchUsers])
  );

  const updateUserStatus = async (status: string) => {
    if (!selectedUser) return;

    try {
      const res = await fetch(`${STATUS_URL}/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        Alert.alert("Success", `User marked as ${status}`);
        setActionModalVisible(false);
        fetchUsers(); // Refresh list
      } else {
        Alert.alert("Error", "Failed to update status");
      }
    } catch (e) {
      Alert.alert("Error", "Server unreachable");
    }
  };

  const handleUserPress = (user: User) => {
    setSelectedUser(user);
    setActionModalVisible(true);
  };

  const formatTime = (time?: string) => {
    if (!time) return "Never";
    return new Date(time).toLocaleString();
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <View style={[styles.badge, { backgroundColor: '#DEF7EC' }]}><Text style={[styles.badgeText, { color: '#03543F' }]}>Active</Text></View>;
      case 'removed':
        return <View style={[styles.badge, { backgroundColor: '#F3F4F6' }]}><Text style={[styles.badgeText, { color: '#374151' }]}>Removed</Text></View>;
      case 'banned':
        return <View style={[styles.badge, { backgroundColor: '#FDE8E8' }]}><Text style={[styles.badgeText, { color: '#9B1C1C' }]}>Banned</Text></View>;
      default:
        return <View style={[styles.badge, { backgroundColor: '#DEF7EC' }]}><Text style={[styles.badgeText, { color: '#03543F' }]}>Active</Text></View>;
    }
  };

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleUserPress(item)} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.userIcon}>
          <Ionicons
            name={item.role === 'Staff' ? "briefcase" : "person"}
            size={20}
            color="#fff"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.role}>{item.role}</Text>
        </View>
        {renderStatusBadge(item.status || 'active')}
      </View>

      <View style={styles.cardDetails}>
        <Text style={styles.detailText}>📧 {item.email}</Text>
        {item.unique_id && <Text style={styles.detailText}>🆔  {item.unique_id}</Text>}
        <Text style={styles.detailText}>🕒 Last Login: {formatTime(item.last_login)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={fetchUsers}
      />

      {/* Action Modal */}
      <Modal visible={actionModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage {selectedUser?.name}</Text>
              <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.actionContainer}>
              {/* Remove Option (Temporary) */}
              {(selectedUser?.status === 'active') && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.btnWarning]}
                  onPress={() => updateUserStatus('removed')}
                >
                  <Ionicons name="pause-circle-outline" size={24} color="#D97706" />
                  <View>
                    <Text style={styles.actionTitle}>Remove (Disable)</Text>
                    <Text style={styles.actionDesc}>Temporarily disable access.</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Permanent Remove (Ban) */}
              {(selectedUser?.status !== 'banned') && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.btnDanger]}
                  onPress={() => {
                    Alert.alert("Confirm", "Are you sure? This user will be permanently banned.", [
                      { text: "Cancel", style: "cancel" },
                      { text: "Ban User", style: 'destructive', onPress: () => updateUserStatus('banned') }
                    ])
                  }}
                >
                  <Ionicons name="ban-outline" size={24} color="#DC2626" />
                  <View>
                    <Text style={styles.actionTitle}>Permanent Remove</Text>
                    <Text style={styles.actionDesc}>Block login with this email forever.</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Replace / Restore */}
              {(selectedUser?.status === 'removed' || selectedUser?.status === 'banned') && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.btnSuccess]}
                  onPress={() => updateUserStatus('active')}
                >
                  <Ionicons name="refresh-circle-outline" size={24} color="#059669" />
                  <View>
                    <Text style={styles.actionTitle}>Replace (Restore)</Text>
                    <Text style={styles.actionDesc}>Restore user access and status.</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    padding: 8,
    marginRight: 8
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
  },
  listContent: {
    padding: 16
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937'
  },
  role: {
    fontSize: 12,
    color: '#6B7280'
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  cardDetails: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12
  },
  detailText: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 4
  },
  // Modal
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827'
  },
  actionContainer: {
    gap: 12
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2
  },
  actionDesc: {
    fontSize: 12,
    color: '#666'
  },
  btnWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D'
  },
  btnDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA'
  },
  btnSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0'
  }
});
