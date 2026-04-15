import { storageService } from '@/constants/SupabaseSim';
import { COLORS, SHADOWS, SPACING } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SalesHistory() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any | null>(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    const data = await storageService.getLocalSales();
    setSales([...data].reverse()); // Newest first
  };

  const handleSync = async () => {
    const unsyncedCount = sales.filter(s => !s.synced).length;
    if (unsyncedCount === 0) {
      Alert.alert('Sincronización', 'Todas las ventas ya están en el servidor.');
      return;
    }

    setSyncing(true);
    const result = await storageService.syncToSupabase();
    setSyncing(false);

    if (result.success) {
      Alert.alert('Sincronización Completada', `Se han exportado ${result.count} ventas correctamente.`);
      loadSales();
    } else {
      Alert.alert('Error de Conexión', 'No se pudo conectar con Supabase. Verifica tu conexión a internet.');
    }
  };
  const handleVoid = async (saleId: string) => {
    Alert.alert(
      'Anular Venta',
      '¿Está seguro de que desea anular esta venta? Esta acción no se puede deshacer.',
      [
        { text: 'CANCELAR', style: 'cancel' },
        {
          text: 'SÍ, ANULAR',
          style: 'destructive',
          onPress: async () => {
            const result = await storageService.voidSale(saleId);
            if (result?.success) {
              Alert.alert('Éxito', 'La venta ha sido anulada.');
              setSelectedSale(null);
              loadSales();
            }
          }
        }
      ]
    );
  };

  const renderSale = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.saleCard, SHADOWS.small, item.voided && { opacity: 0.6 }]}
      onPress={() => setSelectedSale(item)}
      activeOpacity={0.7}
    >
      <View style={styles.saleHeader}>
        <View style={styles.idBox}>
          <Ionicons name="receipt-outline" size={16} color={item.voided ? COLORS.danger : COLORS.primary} />
          <Text style={[styles.saleId, item.voided && { textDecorationLine: 'line-through' }]}>
            #{item.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {item.voided && (
            <View style={[styles.statusBadge, { backgroundColor: COLORS.danger }]}>
              <Text style={styles.statusText}>ANULADA</Text>
            </View>
          )}
          <View style={[styles.statusBadge, item.synced ? styles.syncedBadge : styles.pendingBadge]}>
            <Text style={styles.statusText}>{item.synced ? 'SINCRONIZADO' : 'PENDIENTE'}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.saleDate}>
        {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>

      <View style={styles.cardDivider} />

      <View style={styles.saleDetails}>
        <View style={styles.customerRow}>
          <Ionicons name="person-circle" size={14} color={COLORS.secondary} />
          <Text style={styles.customerSummaryText}>
            {item.customer.name} ({item.customer.cedula})
          </Text>
        </View>

        <View style={styles.amountsRow}>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Total USD</Text>
            <Text style={[styles.amountValueUsd, item.voided && { color: COLORS.textSecondary }]}>${item.total_usd.toFixed(2)}</Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Total Bs.</Text>
            <Text style={[styles.amountValueBs, item.voided && { color: COLORS.textSecondary }]}>{item.total_bs.toLocaleString()} Bs</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>HISTORIAL DE VENTAS</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={sales}
        keyExtractor={item => item.id}
        renderItem={renderSale}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={100} color={COLORS.border} />
            <Text style={styles.emptyText}>No hay ventas registradas todavía.</Text>
            <Text style={styles.emptySub}>Las ventas que realices aparecerán aquí.</Text>
          </View>
        }
      />

      {/* Sale Detail Modal (Ticket de Venta) */}
      <Modal visible={!!selectedSale} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.ticketModal, SHADOWS.large]}>
            {/* Ticket Header */}
            <View style={styles.ticketHeader}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={styles.ticketTitle}>TICKET DE VENTA</Text>
                  {selectedSale?.voided && (
                    <View style={{ backgroundColor: COLORS.danger, paddingHorizontal: 8, borderRadius: 4 }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>ANULADA</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.ticketSectionLabel}>Jornada: DISPROPAGO SALES</Text>
                <Text style={styles.ticketSectionLabel}>Ubicación: SEDE CENTRAL</Text>
                <Text style={styles.ticketSectionLabel}>Fecha: {selectedSale && new Date(selectedSale.timestamp).toLocaleString()}</Text>
                <Text style={styles.ticketSectionLabel}>Nombre del cliente: {selectedSale?.customer.name}</Text>
                <Text style={styles.ticketSectionLabel}>Nº Cédula del cliente: {selectedSale?.customer.cedula}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.ticketId}>{selectedSale?.id.slice(-10)}</Text>
                <TouchableOpacity onPress={() => setSelectedSale(null)}>
                  <Ionicons name="close-circle" size={36} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Ticket Table */}
            <View style={styles.ticketTable}>
              <View style={styles.ticketTableHeader}>
                <Text style={[styles.ticketCol, { flex: 2 }]}>ARTÍCULO</Text>
                <Text style={styles.ticketCol}>PRECIO</Text>
                <Text style={styles.ticketCol}>CANTIDAD</Text>
                <Text style={styles.ticketCol}>TOTAL</Text>
              </View>
              <ScrollView style={{ maxHeight: 250 }}>
                {selectedSale?.items.map((item: any, idx: number) => (
                  <View key={idx} style={styles.ticketTableRow}>
                    <Text style={[styles.ticketItemText, { flex: 2, textDecorationLine: selectedSale?.voided ? 'line-through' : 'none' }]}>{item.name.toUpperCase()}</Text>
                    <Text style={styles.ticketItemText}>{item.price.toFixed(2)}</Text>
                    <Text style={styles.ticketItemText}>{item.weight.toFixed(2)}</Text>
                    <Text style={[styles.ticketItemText, { fontWeight: 'bold' }]}>{item.total.toFixed(2)}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Ticket Footer */}
            <View style={styles.ticketFooter}>
              <View style={styles.montoPagadoBox}>
                <Text style={styles.montoLabel}>MONTO PAGADO</Text>
                <View style={styles.montoDetails}>
                  <Text style={styles.montoSubText}>USD$ {selectedSale?.payments.cash_usd.toFixed(2)}</Text>
                  <Text style={styles.montoSubText}>Bs. {selectedSale?.total_bs.toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.ticketActions}>
                {!selectedSale?.voided && (
                  <>
                    <TouchableOpacity style={[styles.ticketActionBtn, styles.printBtn]}>
                      <Text style={styles.ticketActionText}>RE-IMPRIMIR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.ticketActionBtn, styles.voidBtn]}
                      onPress={() => handleVoid(selectedSale.id)}
                    >
                      <Text style={styles.ticketActionText}>ANULAR</Text>
                    </TouchableOpacity>
                  </>
                )}
                {selectedSale?.voided && (
                  <Text style={{ color: COLORS.danger, fontWeight: '900', fontSize: 16 }}>ESTA VENTA FUE ANULADA</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    paddingBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    justifyContent: 'space-between',
    paddingTop: SPACING.xs,
  },
  backButton: {
    padding: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  syncButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  syncDisabled: {
    opacity: 0.5,
  },
  list: {
    padding: SPACING.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  saleCard: {
    flex: 0.49,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  idBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saleId: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
  },
  saleDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.white,
  },
  syncedBadge: {
    backgroundColor: COLORS.success,
  },
  pendingBadge: {
    backgroundColor: COLORS.warning,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: SPACING.sm,
  },
  saleDetails: {
    gap: 4,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 6,
    borderRadius: 8,
  },
  customerSummaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountItem: {
    gap: 2,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  amountValueUsd: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  amountValueBs: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  paymentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    marginTop: 120,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  // Modal Ticket Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  ticketModal: {
    width: '90%',
    maxWidth: 800,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  ticketHeader: {
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#333',
    marginBottom: 4,
  },
  ticketSectionLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  ticketId: {
    fontSize: 14,
    fontWeight: '900',
    color: '#333',
    marginBottom: 10,
  },
  ticketTable: {
    padding: SPACING.md,
  },
  ticketTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  ticketCol: {
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    color: '#333',
    textAlign: 'center',
  },
  ticketTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ticketItemText: {
    flex: 1,
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
  },
  ticketFooter: {
    padding: SPACING.md,
    flexDirection: 'row',
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  montoPagadoBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  montoLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#444',
    width: 60,
  },
  montoDetails: {
    gap: 2,
  },
  montoSubText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
  },
  ticketActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  ticketActionBtn: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 4,
    justifyContent: 'center',
  },
  printBtn: {
    backgroundColor: COLORS.primary,
  },
  voidBtn: {
    backgroundColor: COLORS.danger,
  },
  ticketActionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
