// FILE: styles.ts
import { StyleSheet, TextStyle, ViewStyle } from "react-native";

interface Styles {
  container: ViewStyle;
  card: ViewStyle;
  title: TextStyle;
  input: TextStyle;
  button: ViewStyle;
  buttonText: TextStyle;
  link: TextStyle;
}

export const styles = StyleSheet.create<Styles>({
  /* Page container */
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 24,
    paddingTop: 40,
  },

  /* White form area */
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 24,
    width: "100%",
  },

  /* Sign Up title */
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
    color: "#000000",
  },

  /* Input fields */
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 18,
    backgroundColor: "#ffffff",
  },

  /* Create Account button */
  button: {
    backgroundColor: "#0d6efd",
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },

  /* Login link */
  link: {
    marginTop: 20,
    textAlign: "center",
    color: "#0d6efd",
    fontSize: 14,
  },
});
