import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';
import ThermalPrinter from 'react-native-thermal-printer';

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
      const sanitize = (text: string) => {
        return text ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
      };

      // Build the ticket payload using tags supported by react-native-thermal-printer
      // Supported tags: [C] Center, [L] Left, [R] Right, <b> Bold, <font size='big'> Big Font
      let payload = '[C]<font size=\'big\'><b>DISPROPAGO POS</b></font>\n';
      payload += '[C]RIF: J-30931874-8\n';
      if (sale.receipt_number) {
        payload += `[C]RECIBO: ${sale.receipt_number}\n`;
      }
      payload += '[C]-------------------------------\n';
      payload += `[L]FECHA: ${new Date(sale.timestamp).toLocaleString().replace(',', '')}\n`;
      if (sale.cashier_name) {
        payload += `[L]CAJERO: ${sanitize(sale.cashier_name)}\n`;
      }
      payload += `[L]CLIENTE: ${sanitize(sale.customer.name)}\n`;
      payload += `[L]CEDULA: ${sale.customer.cedula}\n`;
      payload += '[C]-------------------------------\n';
      payload += '[C]<b>CANT   PRECIO U.   TOTAL (Bs)</b>\n';
      payload += '[C]-------------------------------\n';

      // Items table (Max 31 chars per line)
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const rawName = sanitize(item.name || '').substring(0, 31);
          payload += `[L]${rawName}\n`;
          const qty = (item.weight || 0).toFixed(2).toString().padStart(6);
          const pU = (item.price || 0).toFixed(2).toString().padStart(10);
          const tot = (item.total || 0).toFixed(2).toString().padStart(10);
          payload += `[L]${qty} x ${pU} [R]${tot}\n`;
        });
      }

      payload += '[C]-------------------------------\n';
      payload += '[L]<b>TOTAL BS:</b>\n';
      payload += `[R]<font size='big'>${(sale.total_bs || 0).toFixed(2)}</font>\n`;
      payload += `[L]TASA: ${sale.rate || 0} Bs/$\n`;
      payload += `[R]TOTAL USD: $${(sale.total_usd || 0).toFixed(2)}\n`;

      payload += '[C]-------------------------------\n';
      payload += '[C]<b>FORMAS DE PAGO</b>\n';
      if (sale.payments?.cash_bs) payload += `[L]Efectivo Bs: [R]${sale.payments.cash_bs.toFixed(2)}\n`;
      if (sale.payments?.pos) payload += `[L]Punto de Venta: [R]${sale.payments.pos.toFixed(2)}\n`;
      if (sale.payments?.transfer) payload += `[L]Transferencia: [R]${sale.payments.transfer.toFixed(2)}\n`;
      if (sale.payments?.cash_usd) payload += `[L]Efectivo $: [R]$${sale.payments.cash_usd.toFixed(2)}\n`;
      payload += '[C]-------------------------------\n';

      payload += '[L]\n';
      payload += '[C]<b>GRACIAS POR SU COMPRA!</b>\n';
      payload += '\n\n\n'; // Extra space for manual tearing

      // Populate the internal btDevicesList cache of the thermal printer module
      // If we don't do this, printBluetooth will fail with "Bluetooth Device Not Found"
      try {
        await ThermalPrinter.getBluetoothDeviceList();
      } catch (err) {
        console.warn('Alerta al cargar lista interna de dispositivos bluetooth:', err);
      }

      await ThermalPrinter.printBluetooth({
        payload,
        macAddress: this.connectedDevice.toUpperCase(),
        printerWidthMM: 58,
        printerNbrCharactersPerLine: 32, // Critical for 58mm POS printers to avoid crazy alignment
      });

      return true;
    } catch (error: any) {
      console.error('Print Error:', error);
      throw error;
    }
  },

  /**
   * Print a daily Z close receipt
   */
  async printZReceipt(totals: any) {
    const hasPerms = await this.init();
    if (!hasPerms) console.warn('Possible permission issues');

    if (!this.connectedDevice) {
      throw new Error('No se ha configurado ninguna impresora. Ve a los ajustes para seleccionar una.');
    }

    try {
      const formatCurrency = (val: number) => {
        let parts = Number(val || 0).toFixed(2).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return parts.join(",");
      };

      const now = new Date();
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString([], { hour12: false });
      
      let payload = '[C]<font size=\'big\'><b>RESUMEN DE CAJA</b></font>\n';
      payload += '[L]Jornada: TURNO ACTUAL\n';
      if (totals.cashier_name) {
        payload += `[L]Cajero: ${totals.cashier_name}\n`;
      } else {
        payload += '[L]Cajero: CAJA PRINCIPAL\n';
      }
      payload += `[C]${dateStr} - ${timeStr}\n`;
      payload += '[C]-------------------------------\n';
      
      payload += '[L]FORMA PAGO [R]MONTO\n';
      payload += '[C]-------------------------------\n';
      
      payload += `[L]Efectivo Bs.[R]${formatCurrency(totals.cashBs)}\n`;
      payload += `[L]Transferencia Bs[R]${formatCurrency(totals.transferBs)}\n`;
      payload += `[L]Punto Bs.[R]${formatCurrency(totals.posBs)}\n`;
      
      const cashUsd = totals.cashUsd || 0;
      payload += `[L]Dolares $[R]${formatCurrency(cashUsd)}\n`;
      
      payload += '[C]-------------------------------\n';
      payload += `[L]ITEMS ${totals.itemsDetail.length} [R]TOTAL BS. ${formatCurrency(totals.totalBs)}\n`;
      payload += '[C]-------------------------------\n';
      payload += `[L]VENTAS ${totals.numSales}\n`;
      payload += '[C]-------------------------------\n';
      
      payload += '[C]<b>DETALLES DE ITEMS VENDIDOS</b>\n';
      payload += '[C]-------------------------------\n';
      payload += '[L]ARTICULO...\n';
      payload += '[L]PRECIO      CANT.       TOTAL\n';
      payload += '[C]-------------------------------\n';
      
      if (totals.itemsDetail && Array.isArray(totals.itemsDetail)) {
        totals.itemsDetail.forEach((item: any) => {
          const rawName = (item.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 31);
          payload += `[L]${rawName.padEnd(31, '.')}\n`;
          
          const price = formatCurrency(item.price);
          const qty = formatCurrency(item.weight);
          const tot = formatCurrency(item.total);
          
          payload += `[L]${price.padEnd(10)}  ${qty.padEnd(7)} [R]${tot}\n`;
        });
      }
      
      payload += '[C]-------------------------------\n';
      payload += '\n\n\n';

      try {
        await ThermalPrinter.getBluetoothDeviceList();
      } catch (err) { }

      await ThermalPrinter.printBluetooth({
        payload,
        macAddress: this.connectedDevice.toUpperCase(),
        printerWidthMM: 58,
        printerNbrCharactersPerLine: 32,
      });

      return true;
    } catch (error: any) {
      console.error('Print Z Error:', error);
      throw error;
    }
  }
};

export const printerService = PrinterService;
