import { printerService } from '@/constants/PrinterService';
import { exchangeRateService, storageService } from '@/constants/SupabaseSim';
import { COLORS, SHADOWS, SPACING } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function PaymentScreen() {
  const router = useRouter();
  const [rate] = useState(exchangeRateService.currentRate);
  const { totalUsd, customerCedula, customerName, customerPhone, cartItems } = useLocalSearchParams<{
    totalUsd: string,
    customerCedula: string,
    customerName: string,
    customerPhone: string,
    cartItems: string
  }>();

  const cart = JSON.parse(cartItems || '[]');
  const totalAmountUsd = parseFloat(totalUsd || '0');
  const totalAmountBs = totalAmountUsd * rate;

  const [payments, setPayments] = useState({
    cashBs: '0',
    pos: '0',
    transfer: '0',
    cashUsd: '0',
  });

  const [activeInput, setActiveInput] = useState<keyof typeof payments>('cashBs');

  const paidUsd = parseFloat(payments.cashUsd) + (parseFloat(payments.cashBs) / rate) + (parseFloat(payments.pos) / rate) + (parseFloat(payments.transfer) / rate);
  const remainingUsd = totalAmountUsd - paidUsd;
  const remainingBs = Math.max(0, remainingUsd * rate);

  const selectPaymentMethod = (id: keyof typeof payments) => {
    setActiveInput(id);
    if (payments[id] === '0' && remainingUsd > 0.01) {
      setPayments(prev => ({
        ...prev,
        [id]: id === 'cashUsd' ? remainingUsd.toFixed(2) : (remainingUsd * rate).toFixed(2)
      }));
    }
  };

  const handleKeyPress = (key: string) => {
    setPayments(prev => {
      let current = prev[activeInput];
      if (key === 'C') return { ...prev, [activeInput]: '0' };
      if (key === 'del') {
        const next = current.slice(0, -1);
        return { ...prev, [activeInput]: next === '' ? '0' : next };
      }
      if (current === '0' && key !== '.') current = '';
      if (key === '.' && current.includes('.')) return prev;
      return { ...prev, [activeInput]: current + key };
    });
  };

  const finalizeSale = async () => {
    if (remainingUsd > 0.01) {
      Alert.alert('Saldo Pendiente', 'Aún falta dinero por cobrar.');
      return;
    }

    const saleData = {
      total_usd: totalAmountUsd,
      total_bs: totalAmountBs,
      customer: {
        cedula: customerCedula,
        name: customerName,
        phone: customerPhone
      },
      items: cart.map((item: any) => ({
        name: item.name,
        price: item.price_usd * rate,
        weight: item.weight,
        total: item.price_usd * rate * item.weight
      })),
      payments: {
        cash_bs: parseFloat(payments.cashBs),
        pos: parseFloat(payments.pos),
        transfer: parseFloat(payments.transfer),
        cash_usd: parseFloat(payments.cashUsd),
      },
      rate: rate,
      change_usd: paidUsd > totalAmountUsd ? paidUsd - totalAmountUsd : 0
    };

    const savedSale = await storageService.saveSale(saleData);

    Alert.alert(
      '¡Venta Registrada!',
      '¿Desea imprimir la factura física?',
      [
        {
          text: 'NO, FINALIZAR',
          style: 'cancel',
          onPress: () => finishFlow()
        },
        {
          text: 'SÍ, IMPRIMIR',
          onPress: async () => {
            const printSuccess = await printerService.printReceipt({
              id: savedSale.id,
              timestamp: savedSale.timestamp,
              customer: saleData.customer,
              items: saleData.items,
              total_usd: saleData.total_usd,
              total_bs: saleData.total_bs,
              payments: saleData.payments,
              rate: rate
            });

            if (printSuccess) {
              Alert.alert('¡Éxito!', 'Factura impresa correctamente.', [{ text: 'OK', onPress: () => finishFlow() }]);
            } else {
              Alert.alert(
                'Problema de Impresión',
                'No se pudo conectar con la impresora. Verifique que esté encendida y el Bluetooth activado.',
                [{ text: 'ENTENDIDO', onPress: () => finishFlow() }]
              );
            }
          }
        }
      ]
    );
  };

  const finishFlow = () => {
    Alert.alert('Transacción Completa', 'La venta ha sido guardada con éxito.', [
      { text: 'NUEVA VENTA', onPress: () => router.replace('/sale') },
      { text: 'IR AL INICIO', onPress: () => router.replace('/') }
    ]);
  };

  const KeypadButton = ({ label, value, isAction = false }: { label: string | React.ReactNode, value: string, isAction?: boolean }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.keyButton, isAction && styles.actionKey, SHADOWS.small]}
      onPress={() => handleKeyPress(value)}
    >
      <Text style={[styles.keyText, isAction && styles.actionKeyText]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="close" size={28} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>PROCESAR PAGO</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scroll}>
        <View style={styles.summarySection}>
          <View style={[styles.summaryCard, SHADOWS.medium]}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryLabel}>TOTAL COMPRA</Text>
                <Text style={styles.totalUsdValue}>${totalAmountUsd.toFixed(2)} USD</Text>
                <Text style={styles.totalBsValue}>{totalAmountBs.toLocaleString()} Bs.</Text>
              </View>
              <View style={styles.statusBadge}>
                <Ionicons name={remainingUsd <= 0.01 ? "checkmark-circle" : "time"} size={24} color={remainingUsd <= 0.01 ? COLORS.success : COLORS.warning} />
                <Text style={[styles.statusText, { color: remainingUsd <= 0.01 ? COLORS.success : COLORS.warning }]}>
                  {remainingUsd <= 0.01 ? "PAGADO" : "PENDIENTE"}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryBottom}>
              <Text style={styles.summaryLabel}>SALDO RESTANTE</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.remainingMain, remainingUsd <= 0.01 && styles.remainingSuccess]}>
                  {remainingUsd > 0.01 ? `$${remainingUsd.toFixed(2)} USD` : "TOTAL CUBIERTO"}
                </Text>
                {remainingUsd > 0.01 && (
                  <Text style={styles.remainingBsSub}>{remainingBs.toLocaleString()} Bs.</Text>
                )}
              </View>
            </View>
          </View>

          <View style={[styles.customerMiniCard, SHADOWS.small]}>
            <View style={styles.customerMiniInfo}>
              <View style={styles.customerMiniAvatar}><Text style={styles.avatarText}>{customerName?.charAt(0).toUpperCase()}</Text></View>
              <View>
                <Text style={styles.customerMiniName}>{customerName?.toUpperCase()}</Text>
                <Text style={styles.customerMiniSub}>{customerCedula} • {customerPhone}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.inputsColumn}>
            {[
              { id: 'cashBs', label: 'Efectivo Bs', icon: 'cash-outline' },
              { id: 'pos', label: 'Punto de Venta', icon: 'card-outline' },
              { id: 'transfer', label: 'Transferencia', icon: 'swap-horizontal-outline' },
              { id: 'cashUsd', label: 'Efectivo $', icon: 'logo-usd' },
            ].map((item) => (
              <TouchableOpacity key={item.id} style={[styles.methodCard, activeInput === item.id && styles.activeMethodCard, SHADOWS.small]} onPress={() => selectPaymentMethod(item.id as any)}>
                <View style={styles.methodIconBox}><Ionicons name={item.icon as any} size={24} color={activeInput === item.id ? COLORS.white : COLORS.primary} /></View>
                <View style={styles.methodInfo}>
                  <Text style={[styles.methodLabel, activeInput === item.id && { color: COLORS.white }]}>{item.label}</Text>
                  <Text style={[styles.methodValue, activeInput === item.id && { color: COLORS.white }]}>{payments[item.id as keyof typeof payments]}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keypadColumn}>
            <View style={styles.keypadGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'del'].map((k) => (
                <KeypadButton key={k} label={k === 'del' ? '⌫' : k} value={k.toString()} isAction={k === 'del'} />
              ))}
              <TouchableOpacity style={[styles.finishBtn, remainingUsd > 0.01 && styles.finishBtnDisabled]} onPress={finalizeSale} disabled={remainingUsd > 0.01}>
                <LinearGradient colors={remainingUsd <= 0.01 ? ['#00C853', '#009624'] : [COLORS.border, COLORS.border]} style={styles.finishGradient}>
                  <Text style={styles.finishText}>COMPLETAR</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerGradient: { paddingBottom: SPACING.md },
  headerContent: { paddingHorizontal: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: SPACING.xs },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: '900' },
  iconButton: { padding: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12 },
  scroll: { flex: 1 },
  summarySection: { padding: SPACING.lg },
  summaryCard: { backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: 18 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 10, fontWeight: '900', color: COLORS.textSecondary },
  totalUsdValue: { fontSize: 24, fontWeight: '900', color: COLORS.primary },
  totalBsValue: { fontSize: 14, fontWeight: 'bold', color: COLORS.secondary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.background, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '900' },
  divider: { height: 1, backgroundColor: '#EEEEEE', marginVertical: SPACING.sm },
  summaryBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  remainingMain: { fontSize: 22, fontWeight: '900', color: COLORS.danger },
  remainingBsSub: { fontSize: 14, color: COLORS.secondary, fontWeight: '700' },
  remainingSuccess: { color: COLORS.success },
  mainContent: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.xl },
  inputsColumn: { flex: 1, gap: SPACING.sm },
  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: 20 },
  activeMethodCard: { backgroundColor: COLORS.primary },
  methodIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  methodInfo: { flex: 1, paddingHorizontal: SPACING.sm },
  methodLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  methodValue: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  keypadColumn: { flex: 1.2 },
  keypadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keyButton: { width: '30%', aspectRatio: 1.5, backgroundColor: COLORS.white, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionKey: { backgroundColor: COLORS.background },
  keyText: { fontSize: 20, fontWeight: 'bold' },
  actionKeyText: { color: COLORS.danger },
  finishBtn: { borderRadius: 16, overflow: 'hidden', width: '100%', marginTop: 8 },
  finishBtnDisabled: { opacity: 0.5 },
  finishGradient: { padding: SPACING.md, alignItems: 'center' },
  finishText: { color: COLORS.white, fontSize: 16, fontWeight: '900' },
  customerMiniCard: { backgroundColor: 'rgba(57, 73, 171, 0.05)', marginTop: SPACING.md, borderRadius: 16, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  customerMiniInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  customerMiniAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: COLORS.white, fontWeight: 'bold' },
  customerMiniName: { fontSize: 14, fontWeight: '900' },
  customerMiniSub: { fontSize: 12, color: COLORS.textSecondary },
});
