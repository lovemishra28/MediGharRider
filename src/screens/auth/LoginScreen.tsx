import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Smartphone, Lock } from 'lucide-react-native';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const LoginScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const loginFn = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number.');
      return;
    }
    if (!password) {
      Alert.alert('Password Required', 'Please enter your password.');
      return;
    }

    const fullPhone = `+91${cleaned}`;
    setLoading(true);

    try {
      const response = await api.post('/auth/send-otp', { phone: fullPhone, password });
      const { accessToken, refreshToken, rider } = response.data.data;
      await loginFn(accessToken, refreshToken, rider);
      // Navigation will be handled automatically by the root navigator based on auth state
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to login. Try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
            <Smartphone size={40} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Welcome, Rider!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your phone number and password to login
          </Text>
        </View>

        {/* Phone Input */}
        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.countryCode, { borderRightColor: colors.border }]}>
              <Text style={[styles.countryText, { color: colors.text }]}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={[styles.phoneInput, { color: colors.text }]}
              placeholder="12345 67890"
              placeholderTextColor={colors.textSecondary + '80'}
              keyboardType="phone-pad"
              maxLength={12}
              value={phone}
              onChangeText={setPhone}
              autoFocus
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.passwordIconWrap, { borderRightColor: colors.border }]}>
              <Lock size={20} color={colors.textSecondary} />
            </View>
            <TextInput
              style={[styles.phoneInput, { color: colors.text }]}
              placeholder="Enter password"
              placeholderTextColor={colors.textSecondary + '80'}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: phone.replace(/\s/g, '').length === 10 && password.length > 0 ? colors.primary : colors.border },
          ]}
          onPress={handleLogin}
          disabled={loading || phone.replace(/\s/g, '').length !== 10 || password.length === 0}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <Text style={[styles.footer, { color: colors.textSecondary }]}>
          By continuing, you agree to our Terms of Service
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  headerSection: { alignItems: 'center', marginBottom: 40 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
  inputSection: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
    height: 56,
  },
  countryCode: {
    paddingHorizontal: 14,
    borderRightWidth: 1,
    height: '100%',
    justifyContent: 'center',
  },
  passwordIconWrap: {
    paddingHorizontal: 14,
    borderRightWidth: 1,
    height: '100%',
    justifyContent: 'center',
  },
  countryText: { fontSize: 16, fontWeight: '600' },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 1,
  },
  button: {
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 8 },
});

export default LoginScreen;
