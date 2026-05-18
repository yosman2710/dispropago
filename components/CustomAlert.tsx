import { COLORS, SHADOWS, SPACING } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'question' | 'warning' | 'info';
  buttons?: AlertButton[];
}

let globalShowAlert: (options: AlertOptions) => void = () => {};

export const CustomAlert = {
  show: (options: AlertOptions) => {
    globalShowAlert(options);
  },
};

export function CustomAlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({ title: '' });

  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    globalShowAlert = (newOptions: AlertOptions) => {
      setOptions(newOptions);
      setVisible(true);
    };
  }, []);

  useEffect(() => {
    if (visible) {
      // Start entry animations
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation values when hidden
      backdropOpacity.setValue(0);
      cardScale.setValue(0.85);
    }
  }, [visible]);

  const handleDismiss = (onComplete?: () => void) => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      if (onComplete) {
        onComplete();
      }
    });
  };

  const handleButtonPress = (btn: AlertButton) => {
    handleDismiss(() => {
      if (btn.onPress) {
        btn.onPress();
      }
    });
  };

  // Helper to get Icon properties based on Alert Type
  const getAlertConfig = () => {
    const type = options.type || 'info';
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          color: COLORS.success,
          bg: '#E8F5E9',
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          color: COLORS.danger,
          bg: '#FFEBEE',
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          color: COLORS.warning,
          bg: '#FFF8E1',
        };
      case 'question':
        return {
          icon: 'help-circle' as const,
          color: COLORS.primary,
          bg: '#E8EAF6',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          color: COLORS.info,
          bg: '#E1F5FE',
        };
    }
  };

  const config = getAlertConfig();

  // Render alert buttons
  const renderButtons = () => {
    const buttons = options.buttons || [{ text: 'OK' }];

    // If 2 buttons, render in a side-by-side row
    if (buttons.length === 2) {
      return (
        <View style={styles.buttonRow}>
          {buttons.map((btn, idx) => {
            const isDestructive = btn.style === 'destructive';
            const isCancel = btn.style === 'cancel';

            let btnStyle: any = styles.primaryBtn;
            let textStyle = styles.primaryBtnText;

            if (isDestructive) {
              btnStyle = styles.destructiveBtn;
              textStyle = styles.destructiveBtnText;
            } else if (isCancel) {
              btnStyle = styles.cancelBtn;
              textStyle = styles.cancelBtnText;
            }

            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                style={[styles.flexButton, btnStyle]}
                onPress={() => handleButtonPress(btn)}
              >
                <Text style={textStyle}>{btn.text.toUpperCase()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    // Otherwise, render vertically stacked
    return (
      <View style={styles.buttonColumn}>
        {buttons.map((btn, idx) => {
          const isDestructive = btn.style === 'destructive';
          const isCancel = btn.style === 'cancel';

          let btnStyle: any = styles.primaryBtn;
          let textStyle = styles.primaryBtnText;

          if (isDestructive) {
            btnStyle = styles.destructiveBtn;
            textStyle = styles.destructiveBtnText;
          } else if (isCancel) {
            btnStyle = styles.cancelBtn;
            textStyle = styles.cancelBtnText;
          }

          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              style={[styles.fullWidthBtn, btnStyle, idx > 0 && { marginTop: SPACING.sm }]}
              onPress={() => handleButtonPress(btn)}
            >
              <Text style={textStyle}>{btn.text.toUpperCase()}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <>
      {children}
      <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
        <View style={styles.overlay}>
          {/* Animated transparent dark background */}
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.65],
                }),
              },
            ]}
          />

          {/* Animated Card Container */}
          <Animated.View
            style={[
              styles.cardContainer,
              SHADOWS.large,
              {
                transform: [{ scale: cardScale }],
                opacity: backdropOpacity, // fade in alongside scaling
              },
            ]}
          >
            {/* Top Close Button for simple dismiss if no explicit buttons */}
            {!options.buttons && (
              <TouchableOpacity style={styles.closeIcon} onPress={() => handleDismiss()}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}

            {/* Icon Container with pastel background */}
            <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
              <Ionicons name={config.icon} size={36} color={config.color} />
            </View>

            {/* Content */}
            <Text style={styles.title}>{options.title}</Text>
            {options.message ? (
              <Text style={styles.message}>{options.message}</Text>
            ) : null}

            {/* Action Buttons */}
            {renderButtons()}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A', // Using application's slate dark background for the backdrop
  },
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.xl,
    width: '90%',
    maxWidth: isTablet ? 450 : 380,
    alignItems: 'center',
    position: 'relative',
  },
  closeIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: SPACING.xs,
  },
  // Button Row (Side-by-side)
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  flexButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Button Column (Stacked)
  buttonColumn: {
    width: '100%',
    marginTop: SPACING.xl,
  },
  fullWidthBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Buttons styles
  primaryBtn: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  destructiveBtn: {
    backgroundColor: COLORS.danger,
    ...SHADOWS.small,
  },
  destructiveBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
});
