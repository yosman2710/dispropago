import { Platform, NativeModules } from 'react-native';

let BluetoothEscposPrinter: any = null;
let BluetoothManager: any = null;

try {
  if (Platform.OS !== 'web' && NativeModules.BluetoothEscposPrinter) {
    const PrinterModule = require('react-native-bluetooth-escpos-printer');
    BluetoothEscposPrinter = PrinterModule.BluetoothEscposPrinter || {};
    BluetoothManager = PrinterModule.BluetoothManager || {};
  }
} catch (e) {
  console.log('Printer library not available in this environment');
}

// Fallback for ALIGN constants if module is missing
const ALIGN = BluetoothEscposPrinter?.ALIGN || { LEFT: 0, CENTER: 1, RIGHT: 2 };

export interface ReceiptData {
  id: string;
  timestamp: string;
  customer: {
    name: string;
    cedula: string;
  };
  items: Array<{
    name: string;
    price: number;
    weight: number;
    total: number;
  }>;
  totalUsd: number;
  totalBs: number;
  payments: {
    cash_bs: number;
    pos: number;
    transfer: number;
    cash_usd: number;
  };
  rate: number;
}

export const printerService = {
  /**
   * Main entry point to print.
   * This implementation uses react-native-bluetooth-escpos-printer.
   */
  async printReceipt(data: ReceiptData) {
    if (Platform.OS === 'web') {
      console.log('Printing is not supported on web.');
      return false;
    }

    try {
      // 1. Check if hardware is available
      if (!BluetoothManager || !BluetoothEscposPrinter) {
        throw new Error('El módulo de impresión no está disponible en este dispositivo (requiere Build Nativo).');
      }

      // 2. Check if Bluetooth is enabled
      const isBluetoothEnabled = await BluetoothManager.isBluetoothEnabled();
      if (!isBluetoothEnabled) {
        throw new Error('Bluetooth no está activado.');
      }

      // 2. We assume the printer is already paired and connected via the system settings.
      // For a more robust app, we would use BluetoothManager.scanDevices() here.

      // 3. Setup Printer
      await BluetoothEscposPrinter.printerInit();
      await BluetoothEscposPrinter.printerLeftSpace(0);

      // --- START RECEIPT ---

      // Header
      await BluetoothEscposPrinter.printerAlign(ALIGN.CENTER);
      await BluetoothEscposPrinter.printText('SISTEMA DE CONTROL\n', {
        encoding: 'GBK',
        codepage: 0,
        widthtimes: 1,
        heigthtimes: 1,
        fonttype: 1
      });
      await BluetoothEscposPrinter.printText('--------------------------------\n', {});

      // Info
      await BluetoothEscposPrinter.printerAlign(ALIGN.LEFT);
      await BluetoothEscposPrinter.printText(`Jornada: DISPROPAGO SALES\n`, {});
      await BluetoothEscposPrinter.printText(`No. Compra: ${data.id.slice(-10)}\n`, {});
      await BluetoothEscposPrinter.printText(`Cliente: ${data.customer.name.toUpperCase()}\n`, {});
      await BluetoothEscposPrinter.printText(`Cedula: ${data.customer.cedula}\n`, {});
      await BluetoothEscposPrinter.printText(`Fecha: ${new Date(data.timestamp).toLocaleString()}\n`, {});
      await BluetoothEscposPrinter.printText('--------------------------------\n', {});

      // Table Header
      await BluetoothEscposPrinter.printText('ARTICULO        PRECIO     TOTAL\n', {});
      await BluetoothEscposPrinter.printText('CANT.\n', {});
      await BluetoothEscposPrinter.printText('--------------------------------\n', {});

      // Items
      for (const item of data.items) {
        const namePart = item.name.toUpperCase().slice(0, 31).padEnd(32, '.');
        await BluetoothEscposPrinter.printText(`${namePart}\n`, {});

        const priceStr = item.price.toFixed(2);
        const weightStr = `${item.weight.toFixed(2)}kg`;
        const totalStr = item.total.toFixed(2);

        // Manual alignment for 32 columns
        const row = `${priceStr.padEnd(10)} ${weightStr.padEnd(8)} ${totalStr.padStart(12)}\n`;
        await BluetoothEscposPrinter.printText(row, {});
      }

      await BluetoothEscposPrinter.printText('--------------------------------\n', {});

      // Totals
      const totalUsdStr = `$${data.totalUsd.toFixed(2)}`;
      const totalBsStr = `${data.totalBs.toFixed(2)} Bs`;

      await BluetoothEscposPrinter.printText(`TOTAL USD: ${totalUsdStr.padStart(21)}\n`, {});
      await BluetoothEscposPrinter.printText(`TOTAL Bs:  ${totalBsStr.padStart(20)}\n`, {});
      await BluetoothEscposPrinter.printText(`Tasa: ${data.rate.toFixed(2)} Bs\n`, {});
      await BluetoothEscposPrinter.printText('--------------------------------\n', {});

      // Payments
      await BluetoothEscposPrinter.printText('Formas de pago:\n', {});
      if (data.payments.cash_usd > 0) await BluetoothEscposPrinter.printText(`- USD CASH: $${data.payments.cash_usd}\n`, {});
      if (data.payments.cash_bs > 0) await BluetoothEscposPrinter.printText(`- BS CASH: ${data.payments.cash_bs} Bs\n`, {});
      if (data.payments.pos > 0) await BluetoothEscposPrinter.printText(`- PUNTO: ${data.payments.pos} Bs\n`, {});
      if (data.payments.transfer > 0) await BluetoothEscposPrinter.printText(`- PAGO MOVIL: ${data.payments.transfer} Bs\n`, {});

      // Footer
      await BluetoothEscposPrinter.printText('\n', {});
      await BluetoothEscposPrinter.printerAlign(ALIGN.CENTER);
      await BluetoothEscposPrinter.printText('GRACIAS POR SU COMPRA\n', {});
      await BluetoothEscposPrinter.printText('\n\n\n', {}); // Cut space

      return true;
    } catch (e: any) {
      console.error('Printing failed:', e);
      // Fallback for development/simulation
      console.log('SIMULATED RECEIPT LOGGED ABOVE');
      return false;
    }
  }
};
