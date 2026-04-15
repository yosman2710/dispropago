import { exchangeRateService, mockProducts } from '@/constants/SupabaseSim';
import { COLORS, SHADOWS, SPACING } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Dimensions, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

interface CartItem {
  id: string;
  name: string;
  price_usd: number;
  weight: number;
}

export default function SaleScreen() {
  const router = useRouter();
  const [rate, setRate] = useState(exchangeRateService.currentRate);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<typeof mockProducts[0] | null>(null);
  const [weightInput, setWeightInput] = useState('');

  // Customer Data State
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customer, setCustomer] = useState({
    cedula: '',
    name: '',
    phone: ''
  });

  const filteredProducts = mockProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const confirmWeight = () => {
    if (!selectedProduct || !weightInput) return;

    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.id === selectedProduct.id);
      if (existing) {
        return prev.map(item =>
          item.id === selectedProduct.id ? { ...item, weight: item.weight + weight } : item
        );
      }
      return [...prev, { id: selectedProduct.id, name: selectedProduct.name, price_usd: selectedProduct.price_usd, weight }];
    });

    setSelectedProduct(null);
    setWeightInput('');
  };

  const handleGoToPayment = () => {
    if (cart.length === 0) return;
    setCustomerModalVisible(true);
  };

  const proceedToPayment = () => {
    if (!customer.cedula || !customer.name || !customer.phone) {
      alert('Por favor complete todos los datos del cliente.');
      return;
    }
    setCustomerModalVisible(false);
    router.push({
      pathname: '/payment',
      params: {
        totalUsd: totals.usd,
        customerCedula: customer.cedula,
        customerName: customer.name,
        customerPhone: `+58${customer.phone}`,
        cartItems: JSON.stringify(cart)
      }
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totals = useMemo(() => {
    const usd = cart.reduce((sum, item) => sum + (item.price_usd * item.weight), 0);
    const bs = usd * rate;
    return { usd, bs };
  }, [cart, rate]);

  const renderProduct = ({ item }: { item: typeof mockProducts[0] }) => (
    <TouchableOpacity
      style={[styles.productCard, SHADOWS.medium]}
      onPress={() => setSelectedProduct(item)}
      activeOpacity={0.7}
    >
      <View style={styles.productImageContainer}>
        <Image source={item.image} style={styles.productImage} resizeMode="cover" />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceSymbol}>$</Text>
          <Text style={styles.priceValue}>{item.price_usd.toFixed(2)}</Text>
          <Text style={styles.priceUnit}> / kg</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemWeightBadge}>
        <Text style={styles.cartItemWeightText}>{item.weight.toFixed(2)}</Text>
        <Text style={styles.cartItemUnitText}>kg</Text>
      </View>
      <View style={styles.cartItemDetails}>
        <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cartItemPriceAlt}>${(item.price_usd * item.weight).toFixed(2)} USD</Text>
      </View>
      <TouchableOpacity
        onPress={() => removeFromCart(item.id)}
        style={styles.cartItemDelete}
      >
        <Ionicons name="trash" size={20} color={COLORS.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="chevron-back" size={28} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>DISPROPAGO POS</Text>
            <View style={styles.headerTasaBadge}>
              <Ionicons name="trending-up" size={16} color={COLORS.white} />
              <Text style={styles.headerTasaText}>BCV: {rate.toFixed(2)} Bs</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.body}>
        {/* Left Side: Professional Cart Column */}
        <View style={styles.cartColumn}>
          <View style={styles.panelHeader}>
            <View style={styles.panelTitleContainer}>
              <Ionicons name="receipt-outline" size={24} color={COLORS.primary} />
              <Text style={styles.panelTitle}>Resumen de Orden</Text>
            </View>
            <TouchableOpacity onPress={() => setCart([])}>
              <Text style={styles.clearAllText}>VACIAR</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={cart}
            keyExtractor={item => item.id}
            renderItem={renderCartItem}
            contentContainerStyle={styles.cartListContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="basket-outline" size={100} color={COLORS.border} />
                <Text style={styles.emptyStateText}>Cesta Vacía</Text>
                <Text style={styles.emptyStateSub}>Selecciona productos para comenzar</Text>
              </View>
            }
          />

          <View style={[styles.totalsPanel, SHADOWS.large]}>
            <View style={styles.totalsTop}>
              <View style={styles.totalEntry}>
                <Text style={styles.totalEntryLabel}>Subtotal</Text>
                <Text style={styles.totalEntryValue}>${totals.usd.toFixed(2)} USD</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.totalMainRow}>
                <Text style={styles.totalMainLabel}>TOTAL</Text>
                <View style={styles.totalMainValues}>
                  <Text style={styles.totalUsdLarge}>${totals.usd.toFixed(2)}</Text>
                  <Text style={styles.totalBsSmall}>{totals.bs.toLocaleString()} Bs.</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.payButton, cart.length === 0 && styles.payButtonDisabled]}
              disabled={cart.length === 0}
              onPress={handleGoToPayment}
            >
              <LinearGradient
                colors={cart.length > 0 ? ['#00C853', '#009624'] : [COLORS.border, COLORS.border]}
                style={styles.payButtonGradient}
              >
                <Text style={styles.payButtonText}>CONTINUAR AL PAGO</Text>
                <Ionicons name="wallet-outline" size={24} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Right Side: Product Catalog */}
        <View style={styles.catalogColumn}>
          <View style={styles.catalogHeader}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.searchTextInput}
                placeholder="Buscar por nombre de producto..."
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
          </View>

          <FlatList
            data={filteredProducts}
            keyExtractor={item => item.id}
            renderItem={renderProduct}
            numColumns={3}
            contentContainerStyle={styles.catalogList}
          />
        </View>
      </View>

      {/* Modern Weight Modal */}
      <Modal visible={!!selectedProduct} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, SHADOWS.large]}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.modalHeaderGradient}
            >
              <View style={styles.modalHeaderTop}>
                <Text style={styles.modalProductTitle}>{selectedProduct?.name}</Text>
                <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                  <Ionicons name="close-circle" size={32} color={COLORS.white} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalPriceBadge}>
                <Text style={styles.modalPriceText}>${selectedProduct?.price_usd.toFixed(2)} / kg</Text>
              </View>
            </LinearGradient>

            <View style={styles.modalGrid}>
              <View style={styles.modalDisplayPanel}>
                <View style={styles.weightValueBox}>
                  <Text style={styles.weightValueMain}>{weightInput || '0'}<Text style={styles.weightUnitMain}> kg</Text></Text>
                  <View style={styles.modalSubtotalRow}>
                    <Text style={styles.modalSubtotalLabel}>SUBTOTAL</Text>
                    <Text style={styles.modalSubtotalValue}>${((selectedProduct?.price_usd || 0) * (parseFloat(weightInput) || 0)).toFixed(2)}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  disabled={!weightInput}
                  style={[styles.modalConfirmBtn, !weightInput && { opacity: 0.5 }]}
                  onPress={confirmWeight}
                >
                  <Text style={styles.modalConfirmText}>AGREGAR A LA CESTA</Text>
                  <Ionicons name="add-circle" size={24} color={COLORS.white} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalKeypadPanel}>
                <View style={styles.numKeypad}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'del'].map((k) => (
                    <TouchableOpacity
                      key={k}
                      style={styles.numKey}
                      onPress={() => {
                        if (k === 'del') setWeightInput(prev => prev.slice(0, -1));
                        else if (k === '.' && weightInput.includes('.')) return;
                        else if (weightInput.length < 8) setWeightInput(prev => prev + k);
                      }}
                    >
                      <Text style={styles.numKeyText}>{k === 'del' ? '⌫' : k}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Customer Data Modal */}
      <Modal visible={customerModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.customerModalContent, SHADOWS.large]}>
            <View style={styles.customerModalHeader}>
              <Text style={styles.customerModalTitle}>DATOS DEL CLIENTE</Text>
              <TouchableOpacity onPress={() => setCustomerModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.customerForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>CÉDULA / RIF</Text>
                <View style={styles.formInputContainer}>
                  <Ionicons name="card-outline" size={20} color={COLORS.primary} />
                  <TextInput
                    style={styles.formInput}
                    placeholder="V-12345678"
                    keyboardType="numeric"
                    value={customer.cedula}
                    onChangeText={txt => setCustomer(prev => ({ ...prev, cedula: txt }))}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>NOMBRE COMPLETO</Text>
                <View style={styles.formInputContainer}>
                  <Ionicons name="person-outline" size={20} color={COLORS.primary} />
                  <TextInput
                    style={styles.formInput}
                    placeholder="Ej. Juan Pérez"
                    value={customer.name}
                    onChangeText={txt => setCustomer(prev => ({ ...prev, name: txt }))}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>TELÉFONO</Text>
                <View style={styles.formInputContainer}>
                  <Text style={styles.phonePrefix}>+58</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="4127805845"
                    keyboardType="phone-pad"
                    value={customer.phone}
                    onChangeText={txt => setCustomer(prev => ({ ...prev, phone: txt }))}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.customerSubmitBtn} onPress={proceedToPayment}>
                <Text style={styles.customerSubmitText}>CONTINUAR AL PAGO</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  iconButton: {
    padding: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  headerTasaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  headerTasaText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  // Cart Column (Left)
  cartColumn: {
    flex: 0.4,
    backgroundColor: COLORS.white,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  panelHeader: {
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  panelTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  clearAllText: {
    color: COLORS.danger,
    fontWeight: '800',
    fontSize: 12,
  },
  cartListContent: {
    padding: SPACING.md,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 16,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...SHADOWS.small,
  },
  cartItemWeightBadge: {
    backgroundColor: COLORS.accent,
    width: 65,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemWeightText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
  },
  cartItemUnitText: {
    color: COLORS.white,
    fontSize: 10,
    marginTop: -4,
    fontWeight: 'bold',
  },
  cartItemDetails: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  cartItemPriceAlt: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  cartItemDelete: {
    padding: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyStateText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyStateSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  totalsPanel: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...SHADOWS.large,
  },
  totalsTop: {
    padding: SPACING.md,
  },
  totalEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  totalEntryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  totalEntryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: SPACING.xs,
  },
  totalMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  totalMainLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 1,
  },
  totalMainValues: {
    alignItems: 'flex-end',
  },
  totalUsdLarge: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
  },
  totalBsSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginTop: -2,
  },
  payButton: {
    borderRadius: 14,
    overflow: 'hidden',
    ...SHADOWS.premium,
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
  payButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
  },
  // Catalog Column (Right)
  catalogColumn: {
    flex: 0.6,
    padding: SPACING.lg,
  },
  catalogHeader: {
    marginBottom: SPACING.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    height: 60,
    borderRadius: 30,
    ...SHADOWS.medium,
  },
  searchTextInput: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
  },
  catalogList: {
    gap: SPACING.sm,
    paddingBottom: 100, // Extra space for better scrolling experience if needed
  },
  productCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    margin: 4,
    overflow: 'hidden',
  },
  productImageContainer: {
    height: 110,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: SPACING.sm,
  },
  productName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: SPACING.xs,
  },
  priceSymbol: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
    marginRight: 2,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  priceUnit: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  // Modern Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 35, 126, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 750,
    backgroundColor: COLORS.white,
    borderRadius: 32,
    overflow: 'hidden',
  },
  modalHeaderGradient: {
    padding: SPACING.xl,
  },
  modalHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalProductTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    flex: 1,
  },
  modalPriceBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
  },
  modalPriceText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalGrid: {
    flexDirection: 'row',
    padding: SPACING.xl,
    gap: SPACING.xl,
  },
  modalDisplayPanel: {
    flex: 1,
    justifyContent: 'space-between',
  },
  weightValueBox: {
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  weightValueMain: {
    fontSize: 80,
    fontWeight: '900',
    color: COLORS.primary,
  },
  weightUnitMain: {
    fontSize: 30,
    color: COLORS.textSecondary,
  },
  modalSubtotalRow: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalSubtotalLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  modalSubtotalValue: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.success,
  },
  modalConfirmBtn: {
    backgroundColor: COLORS.success,
    height: 80,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    ...SHADOWS.premium,
  },
  modalConfirmText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '900',
  },
  modalKeypadPanel: {
    flex: 1.2,
  },
  numKeypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  numKey: {
    width: '31%',
    aspectRatio: 1.4,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  numKeyText: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.text,
  },
  // Customer Modal Styles
  customerModalContent: {
    width: 500,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.xl,
  },
  customerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  customerModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  customerForm: {
    gap: SPACING.lg,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  formInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    height: 55,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formInput: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  phonePrefix: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
    marginRight: 4,
  },
  customerSubmitBtn: {
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
    ...SHADOWS.medium,
  },
  customerSubmitText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
  },
});
