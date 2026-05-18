import { exchangeRateService, mockProducts, productsService } from '@/constants/SupabaseSim';
import { COLORS, SHADOWS, SPACING } from '@/constants/theme';
import { CustomAlert } from '@/components/CustomAlert';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
const { width } = Dimensions.get('window');
const isTablet = width > 768;

export default function ProductsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [rate, setRate] = useState(exchangeRateService.currentRate);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    setLoading(true);
    const data = await productsService.getCachedProducts();
    setProducts(data);
    setLoading(false);
  };

  const handleSyncCatalog = async () => {
    setLoading(true);
    const result = await productsService.updateCatalog();
    if (result.success) {
      setProducts(result.data || []);
      CustomAlert.show({
        title: 'Catálogo Sincronizado',
        message: `Se han descargado y guardado localmente ${result.count || 0} productos. Ya puedes seguir usando el catálogo sin internet.`,
        type: 'success',
      });
    } else {
      const data = await productsService.getCachedProducts();
      setProducts(data);
      CustomAlert.show({
        title: 'Sincronización Fallida',
        message: result.message || 'No se pudo conectar con el servidor. Se mantendrá el catálogo guardado actual.',
        type: 'warning',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    // Ensure we have the latest rate for price conversion
    setRate(exchangeRateService.currentRate);
    loadProducts();
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const getProductImage = (item: any) => {
    if (item.image_url) {
      return { uri: item.image_url };
    }
    if (item.image) {
      return item.image;
    }
    const match = mockProducts.find(p => p.name === item.name || p.id === item.id);
    if (match && match.image) {
      return match.image;
    }
    return require('../assets/products/bisteck.png');
  };

  const renderProduct = ({ item }: { item: any }) => (
    <View style={[styles.productCard, SHADOWS.medium]}>
      <View style={styles.imageContainer}>
        <Image source={getProductImage(item)} style={styles.productImage} contentFit="cover" />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>

        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>USD</Text>
            <Text style={styles.priceValueUsd}>${item.price_usd.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Bs.</Text>
            <Text style={styles.priceValueBs}>{(item.price_usd * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>CATÁLOGO DE PRODUCTOS</Text>
            <View style={styles.rateChip}>
              <Text style={styles.rateText}>BCV: {rate.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre o categoría..."
                placeholderTextColor={COLORS.textSecondary}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={handleSyncCatalog}
              style={[styles.syncButton, SHADOWS.medium]}
              activeOpacity={0.7}
            >
              <Ionicons name="cloud-download-outline" size={24} color={COLORS.primary} />
              <Text style={styles.syncButtonText}>ACTUALIZAR</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando catálogo...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          renderItem={renderProduct}
          numColumns={isTablet ? 4 : 2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={80} color={COLORS.border} />
              <Text style={styles.emptyText}>No se encontraron productos</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  rateChip: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rateText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    height: 55,
    borderRadius: 16,
    ...SHADOWS.medium,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    height: 55,
    borderRadius: 16,
    gap: 8,
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
  },
  list: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    gap: SPACING.md,
  },
  productCard: {
    flex: 1,
    maxWidth: isTablet ? '23.6%' : '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 80,
    width: '100%',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  categoryText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '900',
  },
  productInfo: {
    padding: SPACING.xs,
  },
  productName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    height: 26,
  },
  priceContainer: {
    marginTop: SPACING.xs,
    backgroundColor: COLORS.background,
    padding: 5,
    borderRadius: 8,
    gap: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: COLORS.textSecondary,
  },
  priceValueUsd: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
  },
  priceValueBs: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    opacity: 0.2,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    marginTop: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
