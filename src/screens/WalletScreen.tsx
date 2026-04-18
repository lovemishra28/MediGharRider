import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle, CreditCard } from 'lucide-react-native';
import api from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

const WalletScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const [walletData, setWalletData] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWalletData = useCallback(async () => {
    try {
      const [walletRes, earningsRes] = await Promise.all([
        api.get('/wallet'),
        api.get('/wallet/earnings'),
      ]);
      setWalletData(walletRes.data.data);
      setEarnings(earningsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWalletData();
    }, [fetchWalletData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
  };

  const handleRequestPayout = () => {
    const balance = walletData?.balance || 0;
    if (balance < 100) {
      Alert.alert('Insufficient Balance', 'Minimum payout amount is ₹100.');
      return;
    }

    Alert.alert(
      'Request Payout',
      `Transfer ₹${balance} to your bank account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const { data } = await api.post('/wallet/payout', { amount: balance });
              Alert.alert('Success', data.message);
              fetchWalletData();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Payout failed.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  const transactions = walletData?.transactions || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Wallet</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(_, idx) => idx.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        }
        ListHeaderComponent={() => (
          <>
            {/* Minimal Balance Card */}
            <View style={[styles.balanceCard, { borderColor: colors.border, backgroundColor: 'transparent' }]}>
              <View style={styles.balanceRow}>
                <View>
                  <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>AVAILABLE BALANCE</Text>
                  <Text style={[styles.balanceAmount, { color: colors.text }]}>₹{walletData?.balance || 0}</Text>
                </View>
                <Wallet size={36} color={colors.textSecondary} />
              </View>
              <TouchableOpacity
                style={[styles.payoutBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}
                onPress={handleRequestPayout}
                activeOpacity={0.8}
              >
                <CreditCard size={18} color={colors.text} style={{ marginRight: 8 }} />
                <Text style={[styles.payoutBtnText, { color: colors.text }]}>Request Payout</Text>
              </TouchableOpacity>
            </View>

            {/* Earnings Section Minimal */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>EARNINGS</Text>
            <View style={styles.earningsRow}>
              <View style={[styles.earningCard, { borderColor: colors.border }]}>
                <Text style={[styles.earningLabel, { color: colors.textSecondary }]}>Today</Text>
                <Text style={[styles.earningValue, { color: colors.text }]}>
                  ₹{earnings?.today || 0}
                </Text>
              </View>
              <View style={[styles.earningCard, { borderColor: colors.border }]}>
                <Text style={[styles.earningLabel, { color: colors.textSecondary }]}>This Week</Text>
                <Text style={[styles.earningValue, { color: colors.text }]}>
                  ₹{earnings?.week || 0}
                </Text>
              </View>
            </View>

            {/* Transactions Header */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 30 }]}>RECENT TRANSACTIONS</Text>
          </>
        )}
        renderItem={({ item }) => (
          <View style={[styles.txCard, { borderBottomColor: colors.border }]}>
            <View style={styles.txIconContainer}>
              {item.type === 'payout' ? (
                <ArrowUpCircle size={24} color={colors.textSecondary} />
              ) : (
                <TrendingUp size={24} color={colors.textSecondary} />
              )}
            </View>
            <View style={styles.txDetails}>
              <Text style={[styles.txRef, { color: colors.text }]}>
                {item.type === 'payout' ? 'Bank Payout' : 'Order Payout'}
              </Text>
              <Text style={[styles.txOrder, { color: colors.textSecondary }]}>
                {item.orderNumber ? `Order #${item.orderNumber}` : item.referenceId}
              </Text>
            </View>
            <View style={styles.txRight}>
              <Text
                style={[
                  styles.txAmount,
                  { color: colors.text },
                ]}
              >
                {item.type === 'payout' ? '-' : '+'}₹{item.amount}
              </Text>
              <Text style={[styles.txDate, { color: colors.textSecondary }]}>
                {new Date(item.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Text style={{ color: colors.textSecondary, marginTop: 20 }}>No transactions yet.</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  balanceCard: {
    padding: 24,
    borderRadius: 28,
    marginBottom: 24,
    borderWidth: 1,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  balanceAmount: { fontSize: 40, fontWeight: '900' },
  payoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutBtnText: { fontWeight: 'bold', fontSize: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  earningCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  earningLabel: { fontSize: 14, marginBottom: 8, fontWeight: '600' },
  earningValue: { fontSize: 24, fontWeight: '900' },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  txIconContainer: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'transparent',
    marginRight: 16,
  },
  txDetails: { flex: 1 },
  txRef: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  txOrder: { fontSize: 13 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
  txDate: { fontSize: 12, fontWeight: '500' },
});

export default WalletScreen;


