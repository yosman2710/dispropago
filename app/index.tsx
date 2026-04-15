import { exchangeRateService } from '@/constants/SupabaseSim';
import { COLORS, SHADOWS, SPACING } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
const { width } = Dimensions.get('window');
const isTablet = width > 768;

export default function Dashboard() {
  const router = useRouter();
  const [rate, setRate] = React.useState(exchangeRateService.currentRate);

  useEffect(() => {
    const fetchRate = async () => {
      await exchangeRateService.updateRate();
      setRate(exchangeRateService.currentRate);
    };
    fetchRate();
  }, []);

  const menuItems = [
    { id: '1', title: 'NUEVA COMPRA', sub: 'Iniciar venta rápida', icon: 'cart', color: COLORS.primary, route: '/sale' },
    { id: '2', title: 'COMPRAS REALIZADAS', sub: 'Ver ventas realizadas', icon: 'receipt', color: '#6A1B9A', route: '/buys' },
    { id: '3', title: 'VENTAS REALIZADAS', sub: 'Ver ventas realizadas', icon: 'receipt', color: COLORS.primary, route: '/sales' },
    { id: '4', title: 'PRODUCTOS', sub: 'Consultar precios', icon: 'cube', color: '#2E7D32', route: '/orders' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.hero}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeText}>DisproPago POS</Text>
              <Text style={styles.userRole}>Cajero de Turno</Text>
            </View>
            <View style={styles.tasaChip}>
              <Text style={styles.tasaLabel}>TASA BCV</Text>
              <Text style={styles.tasaValue}>{rate.toFixed(2)} Bs</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              style={[styles.menuCard, SHADOWS.medium]}
              onPress={() => router.push(item.route as any)}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFF']}
                style={styles.cardGradient}
              >
                <View style={[styles.iconBox, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon as any} size={32} color={COLORS.white} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSub}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.border} />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats or Footer */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Resumen Diario</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statItem, SHADOWS.small]}>
              <Text style={styles.statLabel}>Ventas Hoy</Text>
              <Text style={styles.statValue}>12</Text>
            </View>
            <View style={[styles.statItem, SHADOWS.small]}>
              <Text style={styles.statLabel}>Total USD</Text>
              <Text style={styles.statValue}>$450.20</Text>
            </View>
            <View style={[styles.statItem, SHADOWS.small]}>
              <Text style={styles.statLabel}>Total Bs.</Text>
              <Text style={styles.statValue}>21,540</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  hero: {
    paddingBottom: SPACING.xxl,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
  },
  userRole: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  tasaChip: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 15,
    alignItems: 'center',
  },
  tasaLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '900',
    letterSpacing: 1,
  },
  tasaValue: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: -30,
  },
  menuCard: {
    width: isTablet ? '48%' : '100%',
    height: 120,
    marginBottom: SPACING.lg,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  cardText: {
    flex: 1,
    marginLeft: SPACING.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  cardSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  infoSection: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  statItem: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 20,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 4,
  },
});
