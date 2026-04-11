import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Moon, Sun, LogOut, Star, Truck, Bike, Shield } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { disconnectSocket } from '../services/socket';
import api from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

const ProfileScreen = () => {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const { rider, logout, updateRider } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch fresh profile on focus
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/rider/profile');
      updateRider(data.data.rider);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          disconnectSocket();
          await logout();
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const initial = rider?.name?.charAt(0)?.toUpperCase() || 'R';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Rider Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Avatar & Name */}
        <View style={styles.profileSection}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{rider?.name || 'Rider'}</Text>
          <Text style={[styles.phone, { color: colors.textSecondary }]}>{rider?.phone || ''}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Star size={20} color="#FFB800" />
            <Text style={[styles.statValue, { color: colors.text }]}>{rider?.rating?.toFixed(1) || '5.0'}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rating</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Truck size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{rider?.totalDeliveries || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Deliveries</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Bike size={20} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.text }]}>{rider?.vehicleType || '—'}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Vehicle</Text>
          </View>
        </View>

        {/* Vehicle Number */}
        {rider?.vehicleNumber && (
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Vehicle Number</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{rider.vehicleNumber}</Text>
          </View>
        )}

        {/* Verification Status */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <Shield size={18} color={rider?.isDocumentsApproved ? colors.success : '#FFB800'} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary, marginLeft: 8 }]}>
              Documents
            </Text>
          </View>
          <Text
            style={[
              styles.infoValue,
              { color: rider?.isDocumentsApproved ? colors.success : '#FFB800' },
            ]}
          >
            {rider?.isDocumentsApproved ? 'Approved ✓' : 'Pending Review'}
          </Text>
        </View>

        {/* Settings */}
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              {isDarkMode ? <Moon size={20} color={colors.text} /> : <Sun size={20} color={colors.text} />}
              <Text style={[styles.settingText, { color: colors.text, marginLeft: 10 }]}>
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleTheme}
              value={isDarkMode}
            />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: '#EA4335' }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={18} color="#EA4335" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },

  profileSection: { alignItems: 'center', marginBottom: 24 },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  phone: { fontSize: 16 },

  // Stats
  statsRow: {
    flexDirection: 'row', gap: 10, marginBottom: 16,
  },
  statCard: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: 14, borderWidth: 1, gap: 4,
  },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 11 },

  // Info cards
  infoCard: {
    borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 15, fontWeight: '600' },

  // Settings
  settingsCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingTextContainer: { flexDirection: 'row', alignItems: 'center' },
  settingText: { fontSize: 16, fontWeight: '600' },

  // Logout
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
    marginTop: 8,
  },
  logoutText: { color: '#EA4335', fontSize: 16, fontWeight: '600' },
});

export default ProfileScreen;
