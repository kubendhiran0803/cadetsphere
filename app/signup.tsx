// FILE: app/signup.js
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Signup() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Cadet");

  const API_URL = "http://192.168.43.201:5000/api/auth/signup";

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Account created successfully");
        router.replace("/login" as any);
      } else {
        Alert.alert("Error", data.message || "Signup failed");
      }
    } catch (error) {
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

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>

        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputBox}>
          <Ionicons name="person-outline" size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Enter full name"
            value={name}
            onChangeText={setName}
          />
        </View>

        <Text style={styles.label}>Email Address</Text>
        <View style={styles.inputBox}>
          <Ionicons name="mail-outline" size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Enter email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <Text style={styles.label}>Signup As</Text>
        <View style={styles.roleBox}>
          {["Admin", "Cadet", "Staff"].map((r) => (
            <TouchableOpacity
              key={r}
              style={role === r ? styles.roleActive : styles.role}
              onPress={() => setRole(r)}
            >
              <Text style={role === r ? styles.roleTextActive : styles.roleText}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>

        <Text style={styles.link} onPress={() => router.replace("/login" as any)}>
          Already have an account? Login
        </Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef2f7",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    elevation: 4,
  },
  logoBox: {
    alignItems: "center",
    marginBottom: 12,
  },
  brand: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "700",
    color: "#1f3fb8",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 22,
  },
  label: {
    fontWeight: "600",
    marginBottom: 6,
    color: "#374151",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    padding: 12,
  },
  roleBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  role: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#c7d2fe",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  roleActive: {
    flex: 1,
    backgroundColor: "#1f3fb8",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  roleText: {
    fontWeight: "600",
    color: "#374151",
  },
  roleTextActive: {
    fontWeight: "600",
    color: "#fff",
  },
  button: {
    backgroundColor: "#1f3fb8",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  link: {
    textAlign: "center",
    color: "#1f3fb8",
    marginTop: 14,
    fontWeight: "500",
  },
});
