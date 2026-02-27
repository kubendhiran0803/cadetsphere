// app/admin/report.tsx
import { StyleSheet, Text, View } from "react-native";

export default function Report() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Reports Dashboard</Text>
      <Text style={styles.subtitle}>
        Overview of CadetSphere activities and registrations
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.item}>Total Cadets: 120</Text>
        <Text style={styles.item}>Total Staff: 45</Text>
        <Text style={styles.item}>Total Admins: 5</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Text style={styles.item}>Cadet Registration - Today</Text>
        <Text style={styles.item}>Staff Registration - Yesterday</Text>
        <Text style={styles.item}>Report Generated - Last Week</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Health</Text>
        <Text style={styles.item}>Database Connected ✅</Text>
        <Text style={styles.item}>API Status: Running ✅</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    color: "#1f3fb8",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#374151",
  },
  item: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
});
