import { storageService } from '@/constants/SupabaseSim';
import { COLORS, SHADOWS, SPACING } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SalesReport() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    const data = await storageService.getLocalSales();
    setSales(data);
  };

  const totals = useMemo(() => {
    return sales.reduce((acc, sale) => {
      acc.cashBs += parseFloat(sale.payments.cash_bs || 0);
      acc.transferBs += parseFloat(sale.payments.transfer || 0);
      acc.posBs += parseFloat(sale.payments.pos || 0);
      acc.cashUsd += parseFloat(sale.payments.cash_usd || 0);
      acc.totalBs += parseFloat(sale.total_bs || 0);

      // Aggregate items
      sale.items.forEach((item: any) => {
        const existing = acc.itemsDetail.find((i: any) => i.name === item.name);
        if (existing) {
          existing.weight += item.weight;
          existing.total += item.total;
        } else {
          acc.itemsDetail.push({
            name: item.name,
            price: item.price,
            weight: item.weight,
            total: item.total
          });
        }
      });

      acc.numSales += 1;
      return acc;
    }, {
      cashBs: 0,
      transferBs: 0,
      posBs: 0,
      cashUsd: 0,
      totalBs: 0,
      numSales: 0,
      itemsDetail: [] as any[]
    });
  }, [sales]);

  const numItemsAggregated = totals.itemsDetail.length;

  const handleExport = async () => {
    setExporting(true);
    const result = await storageService.syncToSupabase();
    setExporting(false);

    if (result.success) {
      Alert.alert('Exportación Exitosa', `Se han sincronizado ${result.count || 0} registros con el servidor.`);
      loadSales(); // Refresh to update synced status if needed
    } else {
      Alert.alert('Error', 'No se pudo sincronizar los datos. Verifique la conexión.');
    }
  };

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
            <Text style={styles.headerTitle}>RESUMEN DE VENTAS</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Top Info Bar */}
        <View style={styles.infoBar}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Ubicación:</Text>
            <Text style={styles.infoValue}>Sede Central</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Fecha:</Text>
            <Text style={styles.infoValue}>{new Date().toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Payments Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>FORMA DE PAGO</Text>
            <Text style={styles.sectionTitle}>MONTO (BS)</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Efectivo Bs.</Text>
            <Text style={styles.paymentValue}>{totals.cashBs.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Transferencia Bs.</Text>
            <Text style={styles.paymentValue}>{totals.transferBs.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Punto Bs.</Text>
            <Text style={styles.paymentValue}>{totals.posBs.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Dólares $ (equiv. Bs)</Text>
            <Text style={styles.paymentValue}>{(totals.cashUsd * (sales[0]?.rate || 45)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>

        {/* Summary Line */}
        <View style={[styles.summaryLine, SHADOWS.small]}>
          <Text style={styles.summaryBox}>ITEMS {numItemsAggregated}</Text>
          <Text style={styles.summaryBox}>VENTAS {totals.numSales}</Text>
          <Text style={styles.summaryTotal}>TOTAL BS. {totals.totalBs.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
        </View>

        {/* Items Detail Table */}
        <View style={styles.itemsSection}>
          <Text style={styles.itemsTitle}>DETALLES DE ITEMS VENDIDOS</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.columnLabel, { flex: 2 }]}>PRODUCTO</Text>
            <Text style={styles.columnLabel}>PRECIO</Text>
            <Text style={styles.columnLabel}>CANT.</Text>
            <Text style={styles.columnLabel}>TOTAL</Text>
          </View>
          {totals.itemsDetail.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.itemText, { flex: 2 }]} numberOfLines={1}>{item.name.toUpperCase()}</Text>
              <Text style={styles.itemText}>{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              <Text style={styles.itemText}>{item.weight.toFixed(2)}</Text>
              <Text style={[styles.itemText, { fontWeight: 'bold' }]}>{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
            </View>
          ))}
          {totals.itemsDetail.length === 0 && (
            <Text style={styles.noData}>No hay ventas para este periodo</Text>
          )}
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerBtn, styles.exportBtn, exporting && { opacity: 0.5 }]}
          onPress={handleExport}
          disabled={exporting}
        >
          <Text style={styles.footerBtnText}>{exporting ? 'EXPORTANDO...' : 'EXPORTAR'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.footerBtn, styles.closeBtn]} onPress={() => Alert.alert('Cierre', 'Cierre de turno realizado.')}>
          <Text style={styles.footerBtnText}>CIERRE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.footerBtn, styles.exitBtn]} onPress={() => router.back()}>
          <Text style={styles.footerBtnText}>SALIR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  content: {
    flex: 1,
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: '#004daa',
  },
  infoItem: {
    flexDirection: 'row',
    gap: 8,
  },
  infoLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  infoValue: {
    color: '#fff',
    fontSize: 12,
  },
  section: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#555',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  paymentLabel: {
    fontSize: 13,
    color: '#555',
    marginLeft: 20,
  },
  paymentValue: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  summaryLine: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryBox: {
    fontSize: 14,
    fontWeight: '900',
    color: '#444',
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
  itemsSection: {
    padding: SPACING.md,
  },
  itemsTitle: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '900',
    color: '#555',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#aaa',
    paddingBottom: 4,
    marginBottom: 8,
  },
  columnLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    color: '#333',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemText: {
    flex: 1,
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
  },
  noData: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
    backgroundColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerBtn: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  exportBtn: {
    backgroundColor: '#00264d',
  },
  closeBtn: {
    backgroundColor: '#004daa',
  },
  exitBtn: {
    backgroundColor: '#990000',
  },
  footerBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  },
});
