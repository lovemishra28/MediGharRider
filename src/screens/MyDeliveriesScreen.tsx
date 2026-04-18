import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Inbox, CheckCircle, MapPin, Truck, Flag, Package, X } from 'lucide-react-native';
import api from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

const STATUS_STEPS = [
  { key: 'accepted', label: 'Accepted', icon: CheckCircle },
  { key: 'at-pickup', label: 'At Pickup', icon: MapPin },
  { key: 'in-transit', label: 'In Transit', icon: Truck },
  { key: 'arrived', label: 'Arrived', icon: Flag },
  { key: 'delivered', label: 'Delivered', icon: Package },
];

const NEXT_STATUS: Record<string, string> = {
  'accepted': 'at-pickup',
  'at-pickup': 'in-transit',
  'in-transit': 'arrived',
  'arrived': 'delivered',
};

const MyDeliveriesScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [deliveryOtp, setDeliveryOtp] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [activeRes, historyRes] = await Promise.all([
        api.get('/orders/active'),
        api.get('/orders/history?limit=10'),
      ]);
      setActiveOrder(activeRes.data.data.order);
      setHistory(historyRes.data.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleUpdateStatus = async () => {
    if (!activeOrder) return;

    const nextStatus = NEXT_STATUS[activeOrder.status];
    if (!nextStatus) return;

    // If moving to delivered, show OTP modal instead
    if (nextStatus === 'delivered') {
      setShowOtpModal(true);
      return;
    }

    setUpdating(true);
    try {
      const { data } = await api.patch(`/orders/${activeOrder.id}/status`, {
        status: nextStatus,
      });
      setActiveOrder(data.data.order);
    } catch (error: any) {
      setTimeout(() => Alert.alert('Error', error.response?.data?.message || 'Failed to update status.'), 100);
    } finally {
      setUpdating(false);
    }
  };

  const handleVerifyDelivery = async () => {
    if (deliveryOtp.length !== 4) {
      setTimeout(() => Alert.alert('Invalid', 'Please enter the 4-digit delivery OTP.'), 100);
      return;
    }

    setUpdating(true);
    try {
      await api.post(`/orders/${activeOrder.id}/verify-delivery`, {
        otp: deliveryOtp,
      });
      setTimeout(() => Alert.alert('🎉 Delivery Complete!', 'Earnings have been credited to your wallet.'), 100);
      setShowOtpModal(false);
      setDeliveryOtp('');
      fetchData(); // Refresh to move order to history
    } catch (error: any) {
      setTimeout(() => Alert.alert('Error', error.response?.data?.message || 'Invalid OTP. Try again.'), 100);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = () => {
    setTimeout(() => {
      Alert.alert(
        'Cancel Delivery?',
        'Are you sure you want to cancel this delivery?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: async () => {
              try {
                await api.patch(`/orders/${activeOrder.id}/status`, {
                  status: 'cancelled',
                  cancellationReason: 'Cancelled by rider',
                });
                fetchData();
              } catch (error: any) {
                setTimeout(() => Alert.alert('Error', error.response?.data?.message || 'Cancel failed.'), 100);
              }
            },
          },
        ]
      );
    }, 100);
  };

  const getCurrentStepIndex = () => {
    return STATUS_STEPS.findIndex((s) => s.key === activeOrder?.status);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Deliveries</Text>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        }
        ListHeaderComponent={() => (
          <>
            {/* Active Order */}
            {activeOrder ? (
              <View style={[styles.activeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.activeHeader}>
                  <Text style={[styles.activeLabel, { color: colors.text }]}>ACTIVE DELIVERY</Text>
                  <Text style={[styles.orderNumber, { color: colors.textSecondary }]}>
                    #{activeOrder.orderNumber}
                  </Text>
                </View>

                <Text style={[styles.pharmacyName, { color: colors.text }]}>
                  {activeOrder.pharmacyName}
                </Text>
                <Text style={[styles.dropoffText, { color: colors.textSecondary }]}>
                  → {activeOrder.dropoffAddress}
                </Text>

                {/* Status Stepper */}
                <View style={styles.stepper}>
                  {STATUS_STEPS.map((step, idx) => {
                    const currentIdx = getCurrentStepIndex();
                    const isCompleted = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    const Icon = step.icon;

                    return (
                      <View key={step.key} style={styles.stepItem}>
                        <View
                          style={[
                            styles.stepDot,
                            {
                              backgroundColor: isCompleted ? (isDarkMode ? '#FFF' : '#111') : 'transparent',
                              borderColor: isCurrent ? (isDarkMode ? '#FFF' : '#111') : colors.border,
                              borderWidth: isCurrent || !isCompleted ? 2 : 0,
                            },
                          ]}
                        >
                          <Icon size={14} color={isCompleted ? (isDarkMode ? '#111' : '#FFF') : colors.textSecondary} />
                        </View>
                        <Text
                          style={[
                            styles.stepLabel,
                            { color: isCompleted ? colors.text : colors.textSecondary },
                          ]}
                        >
                          {step.label}
                        </Text>
                        {idx < STATUS_STEPS.length - 1 && (
                          <View
                            style={[
                              styles.stepLine,
                              { backgroundColor: idx < currentIdx ? (isDarkMode ? '#FFF' : '#111') : colors.border },
                            ]}
                          />
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Payout */}
                <View style={[styles.payoutRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.payoutLabel, { color: colors.textSecondary }]}>Payout</Text>
                  <Text style={[styles.payoutValue, { color: isDarkMode ? '#FFF' : '#111' }]}>
                    ₹{activeOrder.totalPayout}
                  </Text>
                </View>

                {/* Action Buttons */}
                {NEXT_STATUS[activeOrder.status] && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.cancelBtn, { borderColor: colors.border }]}
                      onPress={handleCancelOrder}
                    >
                      <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.nextBtn, { backgroundColor: isDarkMode ? '#FFF' : '#111' }]}
                      onPress={handleUpdateStatus}
                      disabled={updating}
                    >
                      {updating ? (
                        <ActivityIndicator color={isDarkMode ? '#111' : '#FFF'} size="small" />
                      ) : (
                        <Text style={[styles.nextBtnText, { color: isDarkMode ? '#111' : '#FFF' }]}>
                          {NEXT_STATUS[activeOrder.status] === 'delivered'
                            ? 'Verify & Deliver'
                            : `Mark: ${STATUS_STEPS.find((s) => s.key === NEXT_STATUS[activeOrder.status])?.label}`}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noActiveContainer}>
                <Inbox size={40} color={colors.textSecondary} />
                <Text style={[styles.noActiveText, { color: colors.textSecondary }]}>
                  No active delivery
                </Text>
              </View>
            )}

            {/* History Header */}
            {history.length > 0 && (
              <Text style={[styles.historyTitle, { color: colors.text }]}>Recent History</Text>
            )}
          </>
        )}
        renderItem={({ item }) => (
          <View style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.historyRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.historyPharmacy, { color: colors.text }]} numberOfLines={1}>
                  {item.pharmacyName}
                </Text>
                <Text style={[styles.historyDropoff, { color: colors.textSecondary }]} numberOfLines={1}>
                  → {item.dropoffAddress}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.historyPayout, { color: isDarkMode ? '#FFF' : '#111' }]}>₹{item.totalPayout}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: item.status === 'delivered' ? (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: item.status === 'delivered' ? colors.text : colors.textSecondary },
                    ]}
                  >
                    {item.status === 'delivered' ? 'Delivered' : 'Cancelled'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !activeOrder ? (
            <View style={styles.centered}>
              <Text style={[styles.noActiveText, { color: colors.textSecondary }]}>
                No delivery history yet.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      {/* OTP Verification Modal */}
      <Modal visible={showOtpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={{ alignItems: "center", marginBottom: 10 }}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Verify Delivery</Text>
              <TouchableOpacity onPress={() => setShowOtpModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Enter the 4-digit OTP provided by the customer
            </Text>
            <TextInput
              style={[styles.otpInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter OTP"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={4}
              value={deliveryOtp}
              onChangeText={setDeliveryOtp}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.verifyBtn, { backgroundColor: isDarkMode ? '#FFF' : '#111' }]}
              onPress={handleVerifyDelivery}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color={isDarkMode ? '#111' : '#FFF'} size="small" />
              ) : (
                <Text style={[styles.verifyBtnText, { color: isDarkMode ? '#111' : '#FFF' }]}>Complete Delivery</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  activeCard: {
    margin: 20,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  activeLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  orderNumber: { fontSize: 14, fontWeight: 'bold' },
  pharmacyName: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  dropoffText: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  stepper: { marginVertical: 10 },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 1,
  },
  stepLabel: { marginLeft: 16, fontSize: 16, fontWeight: 'bold' },
  stepLine: {
    position: 'absolute',    
    left: 13,
    top: 28,
    bottom: -24,
    width: 2,
    zIndex: 1,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 10,
    borderTopWidth: 1,
  },
  payoutLabel: { fontSize: 16, fontWeight: 'bold' },
  payoutValue: { fontSize: 24, fontWeight: '900' },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 10,
  },
  cancelText: { fontWeight: 'bold', fontSize: 16 },
  nextBtn: {
    flex: 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  historyCard: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyPharmacy: { fontSize: 17, fontWeight: 'bold', marginBottom: 4 },
  historyDropoff: { fontSize: 14 },
  historyPayout: { fontSize: 18, fontWeight: '900', textAlign: 'right', marginBottom: 4 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  noActiveContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noActiveText: { marginTop: 16, fontSize: 16, fontWeight: '500' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },
  modalDesc: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  otpInput: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  verifyBtn: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  verifyBtnText: { fontWeight: 'bold', fontSize: 16 },
});

export default MyDeliveriesScreen;


