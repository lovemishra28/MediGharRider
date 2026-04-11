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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Smartphone, Lock, Settings } from 'lucide-react-native';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { getCustomServerIp, setCustomServerIp } from '../../services/storage';

const LoginScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [serverIp, setServerIp] = useState('');
  const loginFn = useAuthStore((state) => state.login);

  // Load custom IP on mount
  React.useEffect(() => {
    getCustomServerIp().then((ip) => {
      if (ip) setServerIp(ip);
    });
  }, []);

  const handleSaveIp = async () => {
    if (serverIp) {
      await setCustomServerIp(serverIp);
      Alert.alert('Success', 'Server IP saved successfully. App will now connect to this proxy/server.');
    } else {
      await setCustomServerIp('');
      Alert.alert('Success', 'Reset to default server IP.');
    }
    setShowSettings(false);
  };

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
          <TouchableOpacity 
            style={[styles.settingsButton, { backgroundColor: colors.card }]}
            onPress={() => setShowSettings(true)}
          >
            <Settings size={24} color={colors.primary} />
          </TouchableOpacity>
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

        {/* Server IP Modal */}
        <Modal
          visible={showSettings}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSettings(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Configure Server IP</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Enter the local IP address printed in the backend terminal (e.g. 192.168.1.5)
              </Text>
              
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="192.168.x.x"
                placeholderTextColor={colors.textSecondary}
                value={serverIp}
                onChangeText={setServerIp}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.border }]}
                  onPress={() => setShowSettings(false)}
                >
                  <Text style={{ color: colors.text, fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSaveIp}
                >
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  headerSection: { alignItems: 'center', marginBottom: 40, position: 'relative' },
  settingsButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 10,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  modalBtn: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 8,
  },
});

export default LoginScreen;
