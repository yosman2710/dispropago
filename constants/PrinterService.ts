import { PermissionsAndroid, Platform } from 'react-native';
import ThermalPrinter from 'react-native-thermal-printer';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Service to handle thermal printing using react-native-thermal-printer
 */
export const PrinterService = {
  isInitialized: false,
  connectedDevice: null as string | null,

  /**
   * Request Bluetooth permissions for Android and load saved printer
   */
  async init() {
    if (this.isInitialized) return true;

    try {
      if (Platform.OS === 'android') {
        const apiLevel = Platform.Version as number;
        const permissions = apiLevel >= 31
          ? [
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]
          : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        const allGranted = Object.values(granted).every(
          (status) => status === PermissionsAndroid.RESULTS.GRANTED
        );
        
        if (!allGranted) {
          console.warn('Permisos de Bluetooth no fueron concedidos por completo.');
        }
      }
      
      try {
        const savedMac = await AsyncStorage.getItem('printer_mac');
        if (savedMac) {
          this.connectedDevice = savedMac;
        }
      } catch (e) {
        console.error('Error loading mac address:', e);
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('BLE Init Error:', error);
      return false;
    }
  },

  /**
   * Save the printer address for subsequent print jobs
   */
  async connect(deviceId: string) {
    this.connectedDevice = deviceId;
    try {
      await AsyncStorage.setItem('printer_mac', deviceId);
    } catch (e) {
      console.error('Error saving mac address:', e);
    }
    return true;
  },

  /**
   * Print a sale receipt
   */
  async printReceipt(sale: any) {
    const hasPerms = await this.init();
    if (!hasPerms) console.warn('Possible permission issues');

    if (!this.connectedDevice) {
      throw new Error('No se ha configurado ninguna impresora. Ve a los ajustes para seleccionar una.');
    }

    try {
      // Build the ticket payload using tags supported by react-native-thermal-printer
      // Supported tags: [C] Center, [L] Left, [R] Right, <b> Bold, <font size='big'> Big Font
      let payload = '[C]<b>DISPROPAGO POS</b>\n';
      payload += '[C]RIF: J-12345678-9\n';
      payload += '[C]--------------------------------\n';
      payload += `[L]FECHA: ${new Date(sale.timestamp).toLocaleString()}\n`;
      payload += `[L]CLIENTE: ${sale.customer.name}\n`;
      payload += `[L]CEDULA: ${sale.customer.cedula}\n`;
      payload += '[C]--------------------------------\n';

      // Items table
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const name = (item.name || '').substring(0, 15).padEnd(16);
          const qty = (item.weight || 0).toFixed(2).toString().padStart(5);
          const tot = (item.total || 0).toFixed(2).toString().padStart(9);
          payload += `[L]${name}${qty}${tot}\n`;
        });
      }

      payload += '[C]--------------------------------\n';
      payload += '[R]TOTAL BS:\n';
      payload += `[R]<font size='big'>${(sale.total_bs || 0).toFixed(2)}</font>\n`;
      payload += `[R]TASA: ${sale.rate || 0} Bs/$\n`;
      payload += `[R]TOTAL USD: $${(sale.total_usd || 0).toFixed(2)}\n`;
      payload += '[L]\n';
      payload += '[C]<b>¡GRACIAS POR SU COMPRA!</b>\n';
      payload += '\n\n\n'; // Extra space for manual tearing

      await ThermalPrinter.printBluetooth({
        payload,
        macAddress: this.connectedDevice.toUpperCase(),
        printerWidthMM: 58,
      });

      return true;
    } catch (error: any) {
      console.error('Print Error:', error);
      throw error;
    }
  }
};

export const printerService = PrinterService;
