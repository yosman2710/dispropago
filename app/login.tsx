import { authService } from '@/constants/SupabaseSim';
import { COLORS, SHADOWS, SPACING } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

const CASHIERS = [
  { id: '1', name: 'Caja 1', icon: 'person', color: '#8E2DE2' },
  { id: '2', name: 'Caja 2', icon: 'person', color: '#4A00E0' },
  { id: '3', name: 'Caja 3', icon: 'person', color: '#00C9FF' },
  { id: '4', name: 'Caja 4', icon: 'person', color: '#92FE9D' },
  { id: '5', name: 'Caja 5', icon: 'person', color: '#f12711' },
  { id: '6', name: 'Caja 6', icon: 'person', color: '#f5af19' },
];

export default function LoginScreen() {
  const router = useRouter();
  const [selectedCashier, setSelectedCashier] = useState<{ id: string, name: string } | null>(null);
  const [pin, setPin] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleCashierSelect = (cashier: any) => {
    setSelectedCashier(cashier);
    setPin('');
    setShowModal(true);
  };

  const handleLogin = async () => {
    if (pin === '123456') {
      if (selectedCashier) {
        await authService.setActiveCashier(selectedCashier.name);
        setShowModal(false);
        router.replace('/');
      }
    } else {
      Alert.alert('Error', 'PIN incorrecto. Intente nuevamente.');
      setPin('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>DisproPago POS</Text>
        <Text style={styles.subtitle}>Seleccione su Caja para continuar</Text>
      </View>

      <View style={styles.grid}>
        {CASHIERS.map((cashier) => (
          <TouchableOpacity
            key={cashier.id}
            activeOpacity={0.8}
            style={[styles.card, SHADOWS.medium]}
            onPress={() => handleCashierSelect(cashier)}
          >
            <LinearGradient
              colors={[cashier.color, cashier.color + '80']}
              style={styles.cardGradient}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={cashier.icon as any} size={40} color={COLORS.white} />
              </View>
              <Text style={styles.cardText}>{cashier.name}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* PIN Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ingrese PIN</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Autorizando {selectedCashier?.name}</Text>

            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={setPin}
              placeholder="******"
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
              <Text style={styles.loginBtnText}>INGRESAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark elegant background
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.lg,
    maxWidth: 800,
    alignSelf: 'center',
  },
  card: {
    width: isTablet ? '30%' : '45%',
    height: isTablet ? 130 : 110,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.xl,
    width: '90%',
    maxWidth: 400,
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  pinInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: SPACING.lg,
    fontSize: 28,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xl,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: 16,
    alignItems: 'center',
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
