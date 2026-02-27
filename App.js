import { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function App() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {isLogin ? "LOGIN" : "REGISTER"}
        </Text>

        {!isLogin && (
          <TextInput
            placeholder="Name"
            style={styles.input}
          />
        )}

        {!isLogin && (
          <TextInput
            placeholder="Mobile Number"
            keyboardType="phone-pad"
            style={styles.input}
          />
        )}

        {!isLogin && (
          <TextInput
            placeholder="Email"
            keyboardType="email-address"
            style={styles.input}
          />
        )}

        {isLogin && (
          <TextInput
            placeholder="Username"
            style={styles.input}
          />
        )}

        <TextInput
          placeholder="Password"
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>
            {isLogin ? "LOGIN" : "SIGN UP"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.switchText}>
          {isLogin
            ? "Don't have an account? "
            : "Already have an account? "}
          <Text
            style={styles.switchLink}
            onPress={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Register" : "Login"}
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ff9800",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "85%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 25,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 15,
    paddingVertical: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#ff9800",
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
  },
  switchText: {
    textAlign: "center",
    marginTop: 15,
    color: "#555",
  },
  switchLink: {
    color: "#ff9800",
    fontWeight: "bold",
  },
});
