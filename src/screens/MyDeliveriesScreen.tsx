import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Inbox } from 'lucide-react-native';

const MyDeliveriesScreen = () => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Deliveries</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Inbox size={50} color={colors.textSecondary} />
        </View>
        <Text style={[styles.text, { color: colors.textSecondary }]}>No active deliveries yet.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconContainer: { marginBottom: 10 },
  text: { fontSize: 16 },
});

export default MyDeliveriesScreen;
