// app/admin/cadetfields.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Tab = "Cadet" | "Staff";

interface Cadet {
  id: string; // Database ID
  name: string;
  role: string;
  email: string;
  unique_id?: string; // The specific ID (CadetID/StaffID)
  mobile_number?: string;
  mobile_req?: number; // 0 or 1
  createdAt?: string;
}

export default function CadetFields() {
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<Tab>("Cadet");

  // Modal State
  const [selectedUser, setSelectedUser] = useState<Cadet | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editUniqueId, setEditUniqueId] = useState<string>("");

  const API_URL = "http://192.168.43.201:5000/api/auth/cadets";
  const UPDATE_URL = "http://192.168.43.201:5000/api/auth/update";
  const REQUEST_MOBILE_URL = "http://192.168.43.201:5000/api/contact/request";

  const loadCadets = useCallback(async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data: Cadet[] = await res.json();
        setCadets(data);
      } else {
        // Fallback or error handling
        console.log("Failed to fetch cadets from API");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load cadets: " + String(error));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCadets();
    }, [loadCadets])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCadets();
    setRefreshing(false);
  }, [loadCadets]);

  const handleSelectUser = (user: Cadet) => {
    setSelectedUser(user);
    setEditUniqueId(user.unique_id || "");
    setModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch(`${UPDATE_URL}/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unique_id: editUniqueId }),
      });

      if (res.ok) {
        Alert.alert("Success", "User ID updated successfully");
        setModalVisible(false);
        loadCadets(); // Refresh list to see filtering update potentially
      } else {
        Alert.alert("Error", "Failed to update user");
      }
    } catch (error) {
      Alert.alert("Error", "Server unreachable");
    }
  };

  const handleRequestMobile = async (target: "all" | "single", user?: Cadet) => {
    try {
      const body = target === "all" ? { target: "all" } : { target: "single", id: user?.id };
      const res = await fetch(REQUEST_MOBILE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        Alert.alert("Success", target === "all" ? "Requested mobile numbers from ALL cadets." : "Requested mobile number from " + user?.name);
        loadCadets();
      } else {
        const errorData = await res.json().catch(() => ({ message: "Failed to send request." }));
        Alert.alert("Error", errorData.message || "Failed to send request.");
      }
    } catch (error) {
      Alert.alert("Error", "Server unreachable");
    }
  };

  const filteredUsers = cadets.filter(c => c.role && c.role.toLowerCase() === activeTab.toLowerCase());

  const renderCadet = ({ item }: { item: Cadet }) => (
    <TouchableOpacity
      style={styles.cadetCard}
      onPress={() => handleSelectUser(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cadetHeader}>
        <View style={styles.cadetHeaderLeft}>
          <Ionicons
            name={item.role === 'Staff' ? "briefcase" : "person-circle"}
            size={44}
            color={item.role === 'Staff' ? "#4f46e5" : "#c7d2fe"}
          />
          <View style={styles.cadetInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.role}>{item.role}</Text>
              {item.unique_id ? (
                <Text style={styles.uniqueId}> • {item.unique_id}</Text>
              ) : (
                <Text style={styles.missingId}> • No ID</Text>
              )}
            </View>
          </View>
        </View>
        <Ionicons name="create-outline" size={20} color="#999" />
      </View>
      <View style={styles.details}>
        <Text style={styles.email}>{item.email}</Text>
        <View style={styles.mobileRow}>
          <Ionicons name="call-outline" size={14} color="#6b7280" />
          <Text style={styles.mobileText}>
            {item.mobile_number ? item.mobile_number : "No Mobile"}
          </Text>
          {item.mobile_req ? (
            <Text style={styles.pendingBadge}> • Request Pending</Text>
          ) : (
            !item.mobile_number && item.role === 'Cadet' && (
              <TouchableOpacity onPress={() => handleRequestMobile("single", item)}>
                <Text style={styles.requestLink}>Request Update</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Ionicons name="people-circle" size={28} color="#1f3fb8" />
        <Text style={styles.title}>User Management</Text>
      </View>

      {activeTab === 'Cadet' && (
        <TouchableOpacity style={styles.requestAllBtn} onPress={() => Alert.alert("Confirm", "Request mobile number from ALL cadets?", [{ text: "Cancel" }, { text: "Yes", onPress: () => handleRequestMobile("all") }])}>
          <Ionicons name="notifications-outline" size={18} color="#fff" />
          <Text style={styles.requestAllText}>Request Mobile (All)</Text>
        </TouchableOpacity>
      )}


      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(["Cadet", "Staff"] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}s
            </Text>
            {activeTab === tab && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.subtitle}>
        {filteredUsers.length} {activeTab}s found
      </Text>

      {filteredUsers.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={48} color="#ddd" />
          <Text style={styles.emptyText}>No {activeTab}s found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCadet}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 4 }}
        />
      )}

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit {selectedUser?.role}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{selectedUser?.name}</Text>
              <Text style={styles.userEmail}>{selectedUser?.email}</Text>
            </View>

            <Text style={styles.inputLabel}>
              {selectedUser?.role === "Cadet" ? "Cadet ID" : "Staff ID"}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={editUniqueId}
              onChangeText={setEditUniqueId}
              placeholder="Enter unique ID"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    paddingTop: 70,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f3fb8",
    marginLeft: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 16,
    marginLeft: 32,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: "#999",
  },
  cadetCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  cadetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cadetHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cadetInfo: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  role: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  uniqueId: {
    fontSize: 13,
    color: "#1f3fb8",
    fontWeight: "600",
  },
  missingId: {
    fontSize: 13,
    color: "#ef4444",
    fontStyle: "italic",
  },
  details: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 8,
  },
  email: {
    fontSize: 13,
    color: "#6b7280",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  userInfo: {
    marginBottom: 20,
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },
  userEmail: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#eef2ff",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#c7d2fe",
    marginBottom: 24,
  },
  saveBtn: {
    backgroundColor: "#1f3fb8",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  // Tab Styles
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    padding: 4,
    marginHorizontal: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: "#eef2ff",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  tabTextActive: {
    color: "#1f3fb8",
    fontWeight: "700",
  },
  activeIndicator: {
    height: 3,
    width: 20,
    backgroundColor: "#1f3fb8",
    borderRadius: 2,
    marginTop: 4,
  },
  requestAllBtn: {
    flexDirection: "row",
    backgroundColor: "#f59e0b",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    alignItems: "center",
    marginBottom: 10,
    marginLeft: 8,
  },
  requestAllText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 6,
  },
  mobileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  mobileText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
    marginLeft: 4,
  },
  pendingBadge: {
    fontSize: 12,
    color: "#f59e0b",
    fontWeight: "600",
    fontStyle: 'italic'
  },
  requestLink: {
    fontSize: 12,
    color: "#1f3fb8",
    fontWeight: "700",
    marginLeft: 8,
    textDecorationLine: 'underline'
  }
});

