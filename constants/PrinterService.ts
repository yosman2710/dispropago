import EscPosEncoder from 'esc-pos-encoder';
import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import BleManager from 'react-native-ble-manager';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export const PrinterService = {
  isInitialized: false,
  connectedDevice: null as string | null,

  /**
   * Initialize the BLE Manager and request permissions
   */
  async init() {
    if (this.isInitialized) return true;

    try {
      await BleManager.start({ showAlert: false });
      this.isInitialized = true;

      if (Platform.OS === 'android' && Platform.Version >= 23) {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
      }
      return true;
    } catch (error) {
      console.error('BLE Init Error:', error);
      return false;
    }
  },

  /**
   * Connect to a specific printer by its ID/Mac address
   */
  async connect(deviceId: string) {
    try {
      await BleManager.connect(deviceId);
      // Wait a bit for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Discover services to enable writing
      await BleManager.retrieveServices(deviceId);
      this.connectedDevice = deviceId;
      return true;
    } catch (error) {
      console.error('BLE Connect Error:', error);
      return false;
    }
  },

  /**
   * Print a sale receipt
   */
  async printReceipt(sale: any) {
    if (!this.connectedDevice) {
      // Auto-init for first time
      await this.init();
      // Note: In production you'd want a device picker, 
      // but we try to connect if we have a saved ID or search for one.
      // throw new Error('Impresora no conectada');
    }

    // Type guard for TypeScript
    if (!this.connectedDevice) {
      throw new Error('No se pudo establecer conexión con la impresora');
    }

    try {
      const encoder = new EscPosEncoder();

      // Build the ticket
      let result = encoder
        .initialize()
        .align('center')
        .size('normal')
        .text('DISPROPAGO POS')
        .newline()
        .text('RIF: J-12345678-9')
        .newline()
        .text('--------------------------------')
        .newline()
        .align('left')
        .text(`FECHA: ${new Date(sale.timestamp).toLocaleString()}`)
        .newline()
        .text(`CLIENTE: ${sale.customer.name}`)
        .newline()
        .text(`CEDULA: ${sale.customer.cedula}`)
        .newline()
        .text('--------------------------------')
        .newline();

      // Items
      sale.items.forEach((item: any) => {
        const name = item.name.substring(0, 15).padEnd(16);
        const qty = (item.weight || 0).toFixed(2).toString().padStart(5);
        const tot = (item.total || 0).toFixed(2).toString().padStart(9);
        result = result.text(`${name}${qty}${tot}`).newline();
      });

      const encodedReceipt = result
        .text('--------------------------------')
        .newline()
        .align('right')
        .text('TOTAL BS:')
        .newline()
        .width(2)
        .height(2)
        .text(`${(sale.total_bs || 0).toFixed(2)}`)
        .newline()
        .width(1)
        .height(1)
        .text(`TASA: ${sale.rate || 0} Bs/$`)
        .newline()
        .text(`TOTAL USD: $${(sale.total_usd || 0).toFixed(2)}`)
        .newline()
        .align('center')
        .newline()
        .text('¡GRACIAS POR SU COMPRA!')
        .newline()
        .newline()
        .newline()
        .cut()
        .encode();

      // Get services and characteristics
      const peripheralData = await BleManager.retrieveServices(this.connectedDevice);

      let writeService = '';
      let writeCharacteristic = '';

      // Heuristic to find the write characteristic for thermal printers
      if (peripheralData.characteristics) {
        for (const char of peripheralData.characteristics) {
          const props = char.properties as any;
          if (props && (props.Write || props.WriteWithoutResponse)) {
            writeService = char.service;
            writeCharacteristic = char.characteristic;
            break;
          }
        }
      }

      if (!writeCharacteristic) throw new Error('No se encontró canal de impresión compatible');

      // Send data in chunks of 20 bytes (safe for BLE MTU)
      const dataArray = Array.from(encodedReceipt) as number[];
      for (let i = 0; i < dataArray.length; i += 20) {
        const chunk = dataArray.slice(i, i + 20);
        await BleManager.writeWithoutResponse(
          this.connectedDevice,
          writeService,
          writeCharacteristic,
          chunk
        );
      }

      return true;
    } catch (error: any) {
      console.error('Print Error:', error);
      throw error;
    }
  }
};

export const printerService = PrinterService;
