// app/admin/admin.tsx
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import AddUser from "./adduser";
import CadetFields from "./cadetfields";
import Manage from "./manage";
import Sidebar from "./sidebar";

type PageType = "adduser" | "cadetfields" | "manage";

export default function Admin() {
  const [activePage, setActivePage] = useState<PageType>("adduser");
  const [menuInside, setMenuInside] = useState<boolean>(false);
  const { width, height } = useWindowDimensions();
  // Treat as large (side-by-side) only when width is wide AND not portrait phone
  const isLarge = width >= 900 && width > height;
  // Mobile / small breakpoint for phones
  const isSmall = width < 700 || (width < 900 && height > width);

  const renderContent = () => {
    switch (activePage) {
      case "adduser":
        return <AddUser />;
      case "cadetfields":
        return <CadetFields />;
      case "manage":
        return <Manage />;
      default:
        return <AddUser />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {isLarge ? (
        <View style={styles.row}>
          <Sidebar onSelect={setActivePage} active={activePage} />
          <View style={styles.content}>{renderContent()}</View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.mobileHeader}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setMenuInside((s) => !s)}
              accessible
              accessibilityLabel={menuInside ? "Close menu" : "Open menu"}
            >
              <Ionicons name={menuInside ? "close" : "menu"} size={28} color="#1f3fb8" />
            </TouchableOpacity>
            <Text style={styles.mobileTitle}>Admin Panel</Text>
          </View>

          <View style={[styles.content, styles.contentMobile]}>
            {renderContent()}

            {menuInside && (
              <View style={styles.overlayWrap} pointerEvents="box-none">
                <TouchableOpacity style={styles.backdrop} onPress={() => setMenuInside(false)} />
                <View style={styles.overlayMenu}>
                  <Sidebar
                    onSelect={(k) => {
                      setActivePage(k as PageType);
                      setMenuInside(false);
                    }}
                    active={activePage}
                    vertical={true}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  row: { flexDirection: "row", flex: 1 },
  content: { flex: 1, padding: 20 },
  contentMobile: {
    padding: 16,
    paddingTop: 10, // Reduced top padding since header handles spacing
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingTop: 40, // For status bar if SafeAreaView doesn't catch it fully or for visual breathing room
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }
  },
  menuButton: {
    padding: 8,
    marginRight: 16,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
  },
  mobileTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  overlayWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    zIndex: 50,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.4)", // Darker, more premium backdrop
  },
  overlayMenu: {
    width: 260,
    height: '100%',
    backgroundColor: "#fff",
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 4, height: 0 },
  },
});
