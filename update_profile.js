const fs = require('fs');
const content = `import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ActivityIndicator, Alert, ScrollView, RefreshControl, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Moon, Sun, LogOut, User, Mail, Hash, Edit3, X, Check, Bike } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { disconnectSocket } from '../services/socket';
import api from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

const ProfileScreen = () => {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const { rider, updateRider, logout } = useAuthStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState(rider?.name || '');
  const [email, setEmail] = useState(rider?.email || '');
  const [vehicleType, setVehicleType] = useState(rider?.vehicleType || '');
  const [vehicleNumber, setVehicleNumber] = useState(rider?.vehicleNumber || '');

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/rider/profile');
      updateRider(data.data.rider);
      setName(data.data.rider.name || '');
      setEmail(data.data.rider.email || '');
      setVehicleType(data.data.rider.vehicleType || '');
      setVehicleNumber(data.data.rider.vehicleNumber || '');
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = { name, email, vehicleType, vehicleNumber };
      const { data } = await api.patch('/rider/profile', payload);
      updateRider(data.data.rider);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { disconnectSocket(); await logout(); } }
    ]);
  };

  const GlassCard = ({ children, style }: any) => (
    <View style={[styles.glassCard, {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.4)',
    }, style]}>
      {children}
    </View>
  );

  const initial = rider?.name?.charAt(0)?.toUpperCase() || 'R';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.headerGlass}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Profile</Text>
          {!isEditing ? (
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtn}>
              <Edit3 size={20} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.editBtn}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Avatar Glassmorphism */} 
          <GlassCard style={styles.profileSection}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '30', borderColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{initial}</Text>
            </View>
            <Text style={[styles.name, { color: colors.text }]}>{rider?.name || 'Rider'}</Text>
            <Text style={[styles.phone, { color: colors.textSecondary }]}>{rider?.phone || ''}</Text>
          </GlassCard>

          {/* Edit Form or Display */}
          <GlassCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Details</Text>

            <View style={styles.inputGroup}>
              <User size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Name</Text>
                {isEditing ? (
                  <TextInput style={[styles.input, { color: colors.text, borderBottomColor: colors.primary }]} value={name} onChangeText={setName} placeholder="John Doe" placeholderTextColor={colors.textSecondary} />
                ) : (
                  <Text style={[styles.valueText, { color: colors.text }]}>{name || 'Not Provided'}</Text>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address</Text>
                {isEditing ? (
                  <TextInput style={[styles.input, { color: colors.text, borderBottomColor: colors.primary }]} value={email} onChangeText={setEmail} placeholder="john@example.com" placeholderTextColor={colors.textSecondary} keyboardType="email-address" autoCapitalize="none" />
                ) : (
                  <Text style={[styles.valueText, { color: colors.text }]}>{email || 'Not Provided'}</Text>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Bike size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Vehicle Type</Text>
                {isEditing ? (
                  <TextInput style={[styles.input, { color: colors.text, borderBottomColor: colors.primary }]} value={vehicleType} onChangeText={setVehicleType} placeholder="Bike / Scooter" placeholderTextColor={colors.textSecondary} />
                ) : (
                  <Text style={[styles.valueText, { color: colors.text }]}>{vehicleType || 'Not Provided'}</Text>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Hash size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Vehicle Number</Text>
                {isEditing ? (
                  <TextInput style={[styles.input, { color: colors.text, borderBottomColor: colors.primary }]} value={vehicleNumber} onChangeText={setVehicleNumber} placeholder="MH01AB1234" placeholderTextColor={colors.textSecondary} autoCapitalize="characters" />
                ) : (
                  <Text style={[styles.valueText, { color: colors.text }]}>{vehicleNumber || 'Not Provided'}</Text>
                )}
              </View>
            </View>

            {isEditing && (
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <Check size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </GlassCard>

          {/* Settings section */}
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>Preferences</Text>
          <GlassCard style={styles.section2}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                {isDarkMode ? <Moon size={24} color={colors.primary} /> : <Sun size={24} color={colors.primary} />}
                <Text style={[styles.settingText, { color: colors.text }]}>Dark Theme</Text>
              </View>
              <Switch trackColor={{ false: '#767577', true: colors.primary }} thumbColor={isDarkMode ? '#FFF' : '#f4f3f4'} onValueChange={toggleTheme} value={isDarkMode} />
            </View>
            
            <View style={[styles.divider, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

            <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
              <View style={styles.settingLeft}>
                <LogOut size={24} color="#EA4335" />
                <Text style={[styles.settingText, { color: '#EA4335' }]}>Logout</Text>
              </View>
            </TouchableOpacity>
          </GlassCard>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  editBtn: { padding: 8 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  glassCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  profileSection: { alignItems: 'center' },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, borderWidth: 2,
  },
  avatarText: { fontSize: 36, fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  phone: { fontSize: 16 },
  sectionHeading: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12, marginLeft: 8, letterSpacing: 1 },
  section: { paddingTop: 24 },
  section2: { paddingTop: 14 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  inputIcon: { marginRight: 16, marginTop: 10 },
  inputWrapper: { flex: 1 },
  inputLabel: { fontSize: 12, marginBottom: 4 },
  valueText: { fontSize: 16, fontWeight: '500', paddingVertical: 4 },
  input: { fontSize: 16, paddingVertical: 4, borderBottomWidth: 1, fontWeight: '500' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, marginTop: 10 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  settingText: { fontSize: 16, fontWeight: '600', marginLeft: 16 },
  divider: { height: 1, marginVertical: 12 },
});

export default ProfileScreen;
`;
fs.writeFileSync('src/screens/ProfileScreen.tsx', content);
