import { PermissionsAndroid, Platform } from 'react-native';
import ThermalPrinter from 'react-native-thermal-printer';

/**
 * Service to handle thermal printing using react-native-thermal-printer
 */
export const PrinterService = {
  isInitialized: false,
  connectedDevice: null as string | null,

  /**
   * Request Bluetooth permissions for Android
   */
  async init() {
    if (this.isInitialized) return true;

    try {
      if (Platform.OS === 'android' && Platform.Version >= 23) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        const allGranted = Object.values(granted).every(
          (status) => status === PermissionsAndroid.RESULTS.GRANTED
        );
        
        if (!allGranted) {
          console.warn('Permissions not fully granted');
        }
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
    // For this library, we just store the address.
    this.connectedDevice = deviceId;
    return true;
  },

  /**
   * Print a sale receipt
   */
  async printReceipt(sale: any) {
    if (!this.connectedDevice) {
      // For demo purposes, if no device is connected, we might want to fail 
      // or use a default one, but here we enforce connection.
      await this.init();
    }

    if (!this.connectedDevice) {
      throw new Error('No se ha configurado ninguna impresora');
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
      sale.items.forEach((item: any) => {
        const name = item.name.substring(0, 15).padEnd(16);
        const qty = (item.weight || 0).toFixed(2).toString().padStart(5);
        const tot = (item.total || 0).toFixed(2).toString().padStart(9);
        payload += `[L]${name}${qty}${tot}\n`;
      });

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
        macAddress: this.connectedDevice,
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
