import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

const ProfileScreen = () => {
  const { colors, isDarkMode, toggleTheme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <Text style={[styles.headerTitle, { color: colors.text }]}>Rider Profile</Text>
      </View>
      <View style={styles.content}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}> 
          <Text style={styles.avatarText}>R</Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>Rider Name</Text>
        <Text style={[styles.phone, { color: colors.textSecondary }]}>+91 98765 43210</Text>

        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={styles.settingRow}>
            <Text style={[styles.settingText, { color: colors.text }]}> 
              {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </Text>
            <Switch
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleTheme}
              value={isDarkMode}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1, alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  phone: { fontSize: 16, marginBottom: 40 },
  settingsCard: { width: '100%', borderRadius: 16, padding: 20, borderWidth: 1 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingText: { fontSize: 16, fontWeight: '600' },
});

export default ProfileScreen;
