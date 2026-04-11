import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { UserCheck, Bike, Car } from 'lucide-react-native';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const VEHICLE_TYPES = [
  { key: 'bike', label: 'Bike', icon: Bike },
  { key: 'scooter', label: 'Scooter', icon: Bike },
  { key: 'car', label: 'Car', icon: Car },
];

const RegisterScreen = () => {
  const { colors } = useTheme();
  const updateRider = useAuthStore((s) => s.updateRider);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleType, setVehicleType] = useState<string>('bike');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    if (!vehicleNumber.trim()) {
      Alert.alert('Required', 'Please enter your vehicle number.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim() || undefined,
        vehicleType,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
      });

      await updateRider(data.data.rider);
      // App.tsx will auto-navigate to MainTabs since isAuthenticated + rider.name exists
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed. Try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
            <UserCheck size={40} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Complete Profile</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Fill in your details to start delivering
          </Text>
        </View>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="Your full name"
            placeholderTextColor={colors.textSecondary + '80'}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Email (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="your@email.com"
            placeholderTextColor={colors.textSecondary + '80'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Vehicle Type */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Vehicle Type *</Text>
          <View style={styles.vehicleRow}>
            {VEHICLE_TYPES.map(({ key, label, icon: Icon }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.vehicleOption,
                  {
                    backgroundColor: vehicleType === key ? colors.primary + '15' : colors.card,
                    borderColor: vehicleType === key ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setVehicleType(key)}
                activeOpacity={0.7}
              >
                <Icon
                  size={24}
                  color={vehicleType === key ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.vehicleLabel,
                    { color: vehicleType === key ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Vehicle Number */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Vehicle Number *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="MP07AB1234"
            placeholderTextColor={colors.textSecondary + '80'}
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            autoCapitalize="characters"
          />
        </View>

        {/* Register Button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Start Riding</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingVertical: 20 },
  headerSection: { alignItems: 'center', marginBottom: 32, marginTop: 20 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  input: {
    height: 52, borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 16, fontSize: 16,
  },
  vehicleRow: { flexDirection: 'row', gap: 12 },
  vehicleOption: {
    flex: 1, alignItems: 'center', paddingVertical: 16,
    borderRadius: 14, borderWidth: 1.5, gap: 6,
  },
  vehicleLabel: { fontSize: 13, fontWeight: '600' },
  button: {
    height: 56, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 12, marginBottom: 20,
  },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});

export default RegisterScreen;
