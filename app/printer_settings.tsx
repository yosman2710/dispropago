import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BleManager from 'react-native-ble-manager';
import { printerService } from '@/constants/PrinterService';
import { COLORS, SHADOWS, SPACING } from '@/constants/theme';

export default function PrinterSettings() {
  const router = useRouter();
  const [devices, setDevices] = useState<any[]>([]);
  const [scanning, setScanning] = useState(true);
  const [connectedMac, setConnectedMac] = useState<string | null>(printerService.connectedDevice);

  useEffect(() => {
    initializeBluetooth();
  }, []);

  const initializeBluetooth = async () => {
    try {
      await printerService.init(); // Ensure permissions are granted
      await BleManager.start({ showAlert: false });
      loadPairedDevices();
    } catch (e) {
      console.error(e);
      setScanning(false);
    }
  };

  const loadPairedDevices = async () => {
    try {
      setScanning(true);
      // Solo nos importan los dispositivos vinculados (emparejados desde los ajustes de Android)
      const bonded = await BleManager.getBondedPeripherals();
      setDevices(bonded);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar los dispositivos vinculados. Verifique que el Bluetooth esté encendido.');
    } finally {
      setScanning(false);
    }
  };

  const selectDevice = async (device: any) => {
    try {
      await printerService.connect(device.id);
      setConnectedMac(device.id);
      Alert.alert(
        '¡Impresora Seleccionada!',
        `Se ha configurado la impresora ${device.name || 'Desconocida'}.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="close" size={28} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>AJUSTES DE IMPRESORA</Text>
            <TouchableOpacity onPress={loadPairedDevices} style={styles.iconButton}>
              <Ionicons name="refresh" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Selecciona tu miniprinter de la lista. Asegúrate de haberla emparejado/vinculado primero desde los Ajustes de Bluetooth de tu dispositivo Android.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Dispositivos Vinculados</Text>

        {scanning ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Buscando dispositivos vinculados...</Text>
          </View>
        ) : (
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="bluetooth-outline" size={60} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No hay dispositivos Bluetooth vinculados en este momento.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = connectedMac === item.id;
              return (
                <TouchableOpacity
                  style={[styles.deviceCard, isSelected && styles.deviceCardActive, SHADOWS.small]}
                  onPress={() => selectDevice(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.deviceIcon, isSelected && { backgroundColor: COLORS.white }]}>
                    <Ionicons name="print" size={24} color={isSelected ? COLORS.primary : COLORS.white} />
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={[styles.deviceName, isSelected && { color: COLORS.white }]}>
                      {item.name || 'Dispositivo Desconocido'}
                    </Text>
                    <Text style={[styles.deviceMac, isSelected && { color: 'rgba(255,255,255,0.8)' }]}>
                      {item.id}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={28} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
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
  headerContent: {
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xs,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '900',
  },
  iconButton: {
    padding: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: SPACING.md,
    borderRadius: 16,
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  listContent: {
    gap: SPACING.sm,
  },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    lineHeight: 20,
  },
  deviceCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 16,
    alignItems: 'center',
  },
  deviceCardActive: {
    backgroundColor: COLORS.primary,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  deviceMac: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
