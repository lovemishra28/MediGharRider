import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { ShieldCheck } from 'lucide-react-native';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { connectSocket } from '../../services/socket';

const OTP_LENGTH = 4;

const VerifyOtpScreen = ({ route, navigation }: any) => {
  const { colors } = useTheme();
  const { phone } = route.params;
  const login = useAuthStore((s) => s.login);

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-move to next input
    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (text && index === OTP_LENGTH - 1) {
      const code = newOtp.join('');
      if (code.length === OTP_LENGTH) {
        handleVerify(code);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      Alert.alert('Invalid OTP', 'Please enter the complete 4-digit code.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { phone, code: otpCode });
      const { accessToken, refreshToken, rider, isNewRider } = data.data;

      // Store auth state
      await login(accessToken, refreshToken, rider);

      // Connect socket
      connectSocket(accessToken);

      if (isNewRider || !rider.name) {
        navigation.replace('Register');
      }
      // If not new, App.tsx will automatically show MainTabs
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Verification failed. Try again.';
      Alert.alert('Error', msg);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/send-otp', { phone });
      setResendTimer(30);
      Alert.alert('OTP Sent', 'A new code has been sent to your phone.');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to resend OTP. Try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={[styles.iconCircle, { backgroundColor: colors.success + '20' }]}>
            <ShieldCheck size={40} color={colors.success} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Verify Phone</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter the 4-digit code sent to{'\n'}
            <Text style={{ color: colors.primary, fontWeight: '600' }}>{phone}</Text>
          </Text>
        </View>

        {/* OTP Boxes */}
        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.otpBox,
                {
                  backgroundColor: colors.card,
                  borderColor: digit ? colors.primary : colors.border,
                  color: colors.text,
                },
              ]}
              value={digit}
              onChangeText={(text) => handleChange(text.replace(/[^0-9]/g, ''), index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => handleVerify()}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>

        {/* Resend */}
        <View style={styles.resendRow}>
          <Text style={[styles.resendText, { color: colors.textSecondary }]}>
            Didn't receive the code?{' '}
          </Text>
          {resendTimer > 0 ? (
            <Text style={[styles.timerText, { color: colors.primary }]}>
              Resend in {resendTimer}s
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={[styles.resendLink, { color: colors.primary }]}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  headerSection: { alignItems: 'center', marginBottom: 40 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 32,
  },
  otpBox: {
    width: 60, height: 64,
    borderRadius: 14,
    borderWidth: 2,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
  },
  button: {
    height: 56, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendText: { fontSize: 14 },
  timerText: { fontSize: 14, fontWeight: '600' },
  resendLink: { fontSize: 14, fontWeight: 'bold' },
});

export default VerifyOtpScreen;
