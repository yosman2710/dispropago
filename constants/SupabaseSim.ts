import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = 'https://miuzphjvwzjycmbesjug.supabase.co';
const SUPABASE_KEY = 'sb_publishable_s4x5FgXxmmRl7vrBOmGeCw_ZMADU9QF';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SALES_STORAGE_KEY = '@pos_local_sales';

// Simulated Products (Static for now, could be fetched from Supabase)
export const mockProducts = [
  { id: '1', name: 'Bisteck de Res', price_usd: 11.99, category: 'Carnes', image: require('../assets/products/bisteck.png') },
  { id: '2', name: 'Costillas de Res', price_usd: 4.39, category: 'Carnes', image: require('../assets/products/costillas.png') },
  { id: '3', name: 'Carne para Guisar', price_usd: 9.65, category: 'Carnes', image: require('../assets/products/guisar.png') },
  { id: '4', name: 'Carne para Mechar', price_usd: 9.65, category: 'Carnes', image: require('../assets/products/mechar.png') },
  { id: '5', name: 'Carne Molida', price_usd: 9.59, category: 'Carnes', image: require('../assets/products/molida.png') },
  { id: '6', name: 'Osobuco', price_usd: 4.39, category: 'Carnes', image: require('../assets/products/osobuco.jpg') },
];

export const exchangeRateService = {
  currentRate: 47.50, // Default fallback

  async updateRate() {
    try {
      const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      if (response.ok) {
        const data = await response.json();
        if (data && data.promedio) {
          this.currentRate = data.promedio;
          return this.currentRate;
        }
      }
    } catch (error) {
      console.log('Using last known rate:', this.currentRate);
    }
    return this.currentRate;
  }
};

// Helper to generate a valid UUID v4 string
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const storageService = {
  /**
   * Save a sale locally to AsyncStorage.
   * This ensures the app works without internet.
   */
  async saveSale(sale: any) {
    try {
      const newSale = {
        ...sale,
        id: generateUUID(), // Now compatible with Supabase UUID type
        timestamp: new Date().toISOString(),
        synced: false,
        voided: false,
        rate_used: exchangeRateService.currentRate
      };

      const existingSalesStr = await AsyncStorage.getItem(SALES_STORAGE_KEY);
      const existingSales = existingSalesStr ? JSON.parse(existingSalesStr) : [];
      
      const updatedSales = [...existingSales, newSale];
      await AsyncStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(updatedSales));
      
      return newSale;
    } catch (e) {
      console.error('Error saving sale locally:', e);
      throw e;
    }
  },

  /**
   * Mark a sale as voided locally.
   */
  async voidSale(saleId: string) {
    try {
      const salesStr = await AsyncStorage.getItem(SALES_STORAGE_KEY);
      if (!salesStr) return;
      
      const allSales = JSON.parse(salesStr);
      const updatedSales = allSales.map((s: any) => 
        s.id === saleId ? { ...s, voided: true, synced: false } : s
      );
      
      await AsyncStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(updatedSales));
      return { success: true };
    } catch (e) {
      console.error('Error voiding sale:', e);
      return { success: false, error: e };
    }
  },

  async getLocalSales() {
    try {
      const salesStr = await AsyncStorage.getItem(SALES_STORAGE_KEY);
      return salesStr ? JSON.parse(salesStr) : [];
    } catch (e) {
      console.error('Error getting local sales:', e);
      return [];
    }
  },

  /**
   * Synchronize all unsynced local sales to Supabase.
   */
  async syncToSupabase() {
    try {
      const salesStr = await AsyncStorage.getItem(SALES_STORAGE_KEY);
      if (!salesStr) return { success: true, count: 0 };
      
      const allSales = JSON.parse(salesStr);
      const unsyncedSales = allSales.filter((s: any) => !s.synced);
      
      if (unsyncedSales.length === 0) return { success: true, count: 0 };

      let syncCount = 0;

      for (const sale of unsyncedSales) {
        // 1. Upsert into 'sales' table (Updates if ID exists, inserts if not)
        const { error: saleError } = await supabase
          .from('sales')
          .upsert([{
            id: sale.id, // Primary key
            total_usd: sale.total_usd,
            total_bs: sale.total_bs,
            rate: sale.rate_used,
            customer_name: sale.customer.name,
            customer_cedula: sale.customer.cedula,
            customer_phone: sale.customer.phone,
            created_at: sale.timestamp,
            payment_details: sale.payments,
            status: sale.voided ? 'voided' : 'active'
          }]);

        if (saleError) {
          console.error('Error syncing sale metadata:', saleError);
          continue; // Skip this one for now
        }

        // 2. Insert into 'sale_items' table
        const itemsToInsert = sale.items.map((item: any) => ({
          sale_id: sale.id,
          product_name: item.name, // Ajustado de 'name' a 'product_name'
          price_usd: item.price,
          weight_kg: item.weight,
          total_bs: item.total
        }));

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Error syncing sale items:', itemsError);
          continue;
        }

        // 3. Mark locally as synced
        sale.synced = true;
        syncCount++;
      }

      // Save updated local list
      await AsyncStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(allSales));

      return { success: true, count: syncCount };
    } catch (e) {
      console.error('Fatal sync error:', e);
      return { success: false, error: e };
    }
  }
};
