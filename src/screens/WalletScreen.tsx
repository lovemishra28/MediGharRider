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
  const { colors } = useTheme();
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
          <ActivityIndicator size="large" color={colors.primary} />
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={() => (
          <>
            {/* Balance Card */}
            <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
              <View style={styles.balanceRow}>
                <View>
                  <Text style={styles.balanceLabel}>Available Balance</Text>
                  <Text style={styles.balanceAmount}>₹{walletData?.balance || 0}</Text>
                </View>
                <Wallet size={36} color="rgba(255,255,255,0.6)" />
              </View>
              <TouchableOpacity
                style={styles.payoutBtn}
                onPress={handleRequestPayout}
                activeOpacity={0.8}
              >
                <CreditCard size={16} color={colors.primary} />
                <Text style={[styles.payoutBtnText, { color: colors.primary }]}>Request Payout</Text>
              </TouchableOpacity>
            </View>

            {/* Earnings Cards */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Earnings</Text>
            <View style={styles.earningsRow}>
              <View style={[styles.earningCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.earningLabel, { color: colors.textSecondary }]}>Today</Text>
                <Text style={[styles.earningValue, { color: colors.success }]}>
                  ₹{earnings?.today || 0}
                </Text>
              </View>
              <View style={[styles.earningCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.earningLabel, { color: colors.textSecondary }]}>This Week</Text>
                <Text style={[styles.earningValue, { color: colors.success }]}>
                  ₹{earnings?.thisWeek || 0}
                </Text>
              </View>
              <View style={[styles.earningCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.earningLabel, { color: colors.textSecondary }]}>This Month</Text>
                <Text style={[styles.earningValue, { color: colors.success }]}>
                  ₹{earnings?.thisMonth || 0}
                </Text>
              </View>
            </View>

            {/* Total Earnings */}
            <View style={[styles.totalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.totalRow}>
                <TrendingUp size={20} color={colors.success} />
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>  Total Earnings</Text>
              </View>
              <Text style={[styles.totalValue, { color: colors.text }]}>
                ₹{earnings?.totalEarnings || walletData?.totalEarnings || 0}
              </Text>
            </View>

            {/* Transactions Header */}
            {transactions.length > 0 && (
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
            )}
          </>
        )}
        renderItem={({ item }) => {
          const isCredit = item.type === 'credit';
          const isPayout = item.type === 'payout';

          return (
            <View style={[styles.txCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.txRow}>
                <View style={[styles.txIcon, { backgroundColor: (isCredit ? colors.success : '#EA4335') + '15' }]}>
                  {isCredit ? (
                    <ArrowDownCircle size={20} color={colors.success} />
                  ) : (
                    <ArrowUpCircle size={20} color="#EA4335" />
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.txDesc, { color: colors.text }]} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <Text style={[styles.txDate, { color: colors.textSecondary }]}>
                    {new Date(item.timestamp).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.txAmount,
                    { color: isCredit ? colors.success : '#EA4335' },
                  ]}
                >
                  {isCredit ? '+' : '-'}₹{item.amount}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyCentered}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No transactions yet.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 40 },

  // Balance
  balanceCard: {
    borderRadius: 18, padding: 22, marginBottom: 20,
  },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 4 },
  balanceAmount: { color: '#FFF', fontSize: 36, fontWeight: 'bold' },
  payoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 10, alignSelf: 'flex-start', marginTop: 16,
  },
  payoutBtnText: { fontSize: 14, fontWeight: 'bold' },

  // Earnings
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  earningsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  earningCard: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: 14, borderWidth: 1,
  },
  earningLabel: { fontSize: 12, marginBottom: 4 },
  earningValue: { fontSize: 18, fontWeight: 'bold' },

  // Total
  totalCard: {
    borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  totalRow: { flexDirection: 'row', alignItems: 'center' },
  totalLabel: { fontSize: 14 },
  totalValue: { fontSize: 20, fontWeight: 'bold' },

  // Transactions
  txCard: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 8 },
  txRow: { flexDirection: 'row', alignItems: 'center' },
  txIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  txDesc: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  txDate: { fontSize: 12 },
  txAmount: { fontSize: 16, fontWeight: 'bold' },

  emptyCentered: { alignItems: 'center', paddingTop: 30 },
  emptyText: { fontSize: 15 },
});

export default WalletScreen;
