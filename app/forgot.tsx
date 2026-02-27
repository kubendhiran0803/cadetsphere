// FILE: app/forgot.tsx
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

export default function Forgot() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");

  const API_URL = "http://192.168.43.201:5000/api/auth/forgot";

  const resetPassword = async () => {
    if (!email || !newPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("Success", "Password reset successfully");
        router.replace("/login" as any);
      } else {
        Alert.alert("Error", data.message || "Reset failed");
      }
    } catch (err) {
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

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email and new password</Text>

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

        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={resetPassword}>
          <Text style={styles.buttonText}>Reset Password</Text>
        </TouchableOpacity>

        <Text style={styles.link} onPress={() => router.back()}>
          Back to Login
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
