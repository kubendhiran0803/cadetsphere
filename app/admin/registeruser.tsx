// app/admin/registeruser.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface RegisterUserProps {
  defaultRole?: string;
}

export default function RegisterUser({ defaultRole = "Cadet" }: RegisterUserProps) {
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [role, setRole] = useState<string>(defaultRole);

  const API_URL = "http://192.168.43.201:5000/api/auth/admin";

  const submitUser = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", `${role} registered successfully`);
        router.replace("/login" as any);
      } else {
        Alert.alert("Error", data.message || "Registration failed");
      }
    } catch {
      Alert.alert("Error", "Server not reachable");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoBox}>
          <Ionicons name="triangle" size={42} color="#1f3fb8" />
          <Text style={styles.brand}>CadetSphere</Text>
        </View>

        <Text style={styles.title}>Register {role}</Text>
        <Text style={styles.subtitle}>Admin access panel</Text>

        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputBox}>
          <Ionicons name="person-outline" size={20} color="#666" />
          <TextInput style={styles.input} placeholder="Enter full name" value={name} onChangeText={setName} />
        </View>

        <Text style={styles.label}>Email Address</Text>
        <View style={styles.inputBox}>
          <Ionicons name="mail-outline" size={20} color="#666" />
          <TextInput style={styles.input} placeholder="Enter email" autoCapitalize="none" value={email} onChangeText={setEmail} />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" />
          <TextInput style={styles.input} placeholder="Enter password" secureTextEntry value={password} onChangeText={setPassword} />
        </View>

        <TouchableOpacity style={styles.button} onPress={submitUser}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eef2f7", justifyContent: "center", padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 22, elevation: 4 },
  logoBox: { alignItems: "center", marginBottom: 12 },
  brand: { marginTop: 6, fontSize: 16, fontWeight: "700", color: "#1f3fb8" },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center" },
  subtitle: { textAlign: "center", color: "#6b7280", marginBottom: 22 },
  label: { fontWeight: "600", marginBottom: 6, color: "#374151" },
  inputBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#eef2ff", borderRadius: 12, paddingHorizontal: 12, marginBottom: 16 },
  input: { flex: 1, padding: 12 },
  button: { backgroundColor: "#1f3fb8", padding: 16, borderRadius: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" }
});
