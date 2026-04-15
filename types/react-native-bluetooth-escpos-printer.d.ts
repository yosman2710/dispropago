declare module 'react-native-bluetooth-escpos-printer' {
  export interface BluetoothManager {
    isBluetoothEnabled(): Promise<boolean>;
    enableBluetooth(): Promise<string[] | null>;
    disableBluetooth(): Promise<void>;
    scanDevices(): Promise<string>;
    connect(address: string): Promise<void>;
    unpair(address: string): Promise<void>;
  }

  export interface PrintOptions {
    encoding?: string;
    codepage?: number;
    widthtimes?: number;
    heigthtimes?: number;
    fonttype?: number;
  }

  export interface BluetoothEscposPrinter {
    printerInit(): Promise<void>;
    printerLeftSpace(space: number): Promise<void>;
    printerLineSpace(space: number): Promise<void>;
    printerUnderLine(line: number): Promise<void>;
    printerAlign(align: number): Promise<void>;
    printText(text: string, options: PrintOptions): Promise<void>;
    printColumn(
      columnWidths: number[],
      columnAligns: number[],
      columnTexts: string[],
      options: PrintOptions
    ): Promise<void>;
    printPic(base64: string, options: { width: number; left: number }): Promise<void>;
    printQRCode(content: string, size: number, correctionLevel: number): Promise<void>;
    printBarCode(
      str: string,
      nType: number,
      nWidthX: number,
      nHeight: number,
      nHriFontType: number,
      nHriFontPosition: number
    ): Promise<void>;
    cutPaper(): Promise<void>;

    ALIGN: {
      LEFT: number;
      CENTER: number;
      RIGHT: number;
    };

    ERROR_CORRECTION: {
      L: number;
      M: number;
      Q: number;
      H: number;
    };

    BARCODETYPE: {
      UPC_A: number;
      UPC_E: number;
      JAN13: number;
      JAN8: number;
      CODE39: number;
      ITF: number;
      CODABAR: number;
      CODE93: number;
      CODE128: number;
    };

    ROTATION: {
      OFF: number;
      ON: number;
    };
  }

  export interface BluetoothTscPrinter {
    // Add TSC printer methods if needed
  }

  export const BluetoothManager: BluetoothManager;
  export const BluetoothEscposPrinter: BluetoothEscposPrinter;
  export const BluetoothTscPrinter: BluetoothTscPrinter;
}
