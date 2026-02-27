// app/admin/adduser.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

interface User {
  id: string; // Database ID
  name: string;
  email: string;
  role: string;
  unique_id?: string;
}

export default function AddUser() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isNarrow = width < 700;

  const [users, setUsers] = useState<User[]>([]);
  const [role, setRole] = useState<string>("Cadet");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [uniqueId, setUniqueId] = useState<string>("");

  // Modal for selecting user
  const [isModalVisible, setModalVisible] = useState(false);

  const API_URL_GET = "http://192.168.43.201:5000/api/auth/cadets";
  const API_URL_UPDATE = "http://192.168.43.201:5000/api/auth/update";

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users when role changes or list updates
  useEffect(() => {
    // Reset selection if the role changes to prevent mismatched assignment
    if (selectedUser && selectedUser.role !== role) {
      setSelectedUser(null);
      setUniqueId("");
    }
  }, [role]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(API_URL_GET);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.log("Error fetching users");
    }
  };

  const generateId = () => {
    const prefix = role === "Cadet" ? "CAD" : "STF";
    const random = Math.floor(1000 + Math.random() * 9000);
    setUniqueId(`${prefix}${random}`);
  };

  const handleUpdate = async () => {
    if (!selectedUser) {
      Alert.alert("Error", "Please select a user first");
      return;
    }
    if (!uniqueId) {
      Alert.alert("Error", "Please generate or enter an ID");
      return;
    }

    try {
      const res = await fetch(`${API_URL_UPDATE}/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unique_id: uniqueId }),
      });

      if (res.ok) {
        Alert.alert("Success", `ID ${uniqueId} assigned to ${selectedUser.name}`);
        setUniqueId("");
        setSelectedUser(null);
        fetchUsers(); // Refresh list to update local data
      } else {
        Alert.alert("Error", "Update failed");
      }
    } catch (err) {
      Alert.alert("Error", "Server not reachable");
    }
  };

  // Filter users based on selected role
  const filteredUsers = users.filter((u) => u.role === role);

  const selectUser = (user: User) => {
    setSelectedUser(user);
    setUniqueId(user.unique_id || "");
    setModalVisible(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.card, isNarrow && styles.cardNarrow]}>
        <View style={styles.titleRow}>
          <Ionicons name="id-card" size={26} color="#1f3fb8" />
          <Text style={styles.title}>Assign User ID</Text>
        </View>

        <Text style={styles.sectionLabel}>1. Select Role</Text>
        <View style={styles.roleBox}>
          {["Cadet", "Staff"].map((r) => (
            <TouchableOpacity
              key={r}
              style={role === r ? styles.roleActive : styles.role}
              onPress={() => setRole(r)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={r === "Cadet" ? "person" : "briefcase"}
                size={18}
                color={role === r ? "#fff" : "#6b7280"}
                style={{ marginBottom: 4 }}
              />
              <Text style={role === r ? styles.roleTextActive : styles.roleText}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>2. Select {role}</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={selectedUser ? styles.selectorTextSelected : styles.selectorText}>
            {selectedUser ? selectedUser.name : `Select a ${role}...`}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        {selectedUser && (
          <Text style={styles.emailText}>{selectedUser.email}</Text>
        )}

        <Text style={styles.sectionLabel}>3. Assign ID</Text>
        <View style={styles.idDisplay}>
          <Text style={styles.idLabel}>Unique ID</Text>
          <View style={styles.idRow}>
            <TextInput
              style={styles.uniqueIdInput}
              value={uniqueId}
              onChangeText={setUniqueId}
              placeholder="Ex. CAD1234"
              placeholderTextColor="#A5B4FC"
            />
            <TouchableOpacity onPress={generateId} style={styles.refreshBtn}>
              <Text style={styles.refreshText}>Generate</Text>
              <Ionicons name="refresh" size={16} color="#1f3fb8" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, !selectedUser && styles.buttonDisabled]}
          onPress={handleUpdate}
          activeOpacity={0.9}
          disabled={!selectedUser}
        >
          <Text style={styles.buttonText}>Update {role} ID</Text>
        </TouchableOpacity>
      </View>

      {/* User Selection Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {role}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No {role}s found.</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.userItem} onPress={() => selectUser(item)}>
                  <View>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                  </View>
                  {item.unique_id ? (
                    <Text style={styles.hasId}>ID: {item.unique_id}</Text>
                  ) : (
                    <Text style={styles.noId}>No ID</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: "#F3F4F6",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 30,
    elevation: 8,
    width: "100%",
    maxWidth: 480,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  cardNarrow: {
    padding: 20,
    maxWidth: "100%",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1f3fb8",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
    justifyContent: 'center'
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563",
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  roleBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 12,
  },
  role: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  roleActive: {
    flex: 1,
    backgroundColor: "#1f3fb8",
    borderWidth: 1,
    borderColor: "#1f3fb8",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1f3fb8",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4
  },
  roleText: {
    fontWeight: "600",
    color: "#6B7280",
    fontSize: 14,
  },
  roleTextActive: {
    fontWeight: "700",
    color: "#fff",
    fontSize: 14,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    borderRadius: 12,
  },
  selectorText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  selectorTextSelected: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600'
  },
  emailText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
    marginLeft: 4,
  },
  idDisplay: {
    backgroundColor: "#EEF2FF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  idLabel: {
    fontSize: 12,
    color: "#6366F1",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase"
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  uniqueIdInput: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E1B4B",
    letterSpacing: 1,
    flex: 1,
    padding: 0, // removed padding to align better
  },
  refreshBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '600',
    color: "#1f3fb8"
  },
  button: {
    backgroundColor: "#1f3fb8",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#1f3fb8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: "#A5B4FC",
    shadowOpacity: 0,
    elevation: 0
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
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
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827'
  },
  userItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937'
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2
  },
  hasId: {
    fontSize: 12,
    color: '#1f3fb8',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600'
  },
  noId: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#666'
  }
});
