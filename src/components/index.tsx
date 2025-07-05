// CrampPanchayat Reusable Components
// Privacy-first UI components with accessibility support

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { EmojiType } from "../types";
import { THEME_COLORS, SPACING, BORDER_RADIUS } from "../constants";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Primary Button Component with haptic feedback
 */
export function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  icon,
  style,
  testID,
}: ButtonProps) {
  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const buttonStyle = [
    styles.button,
    styles[`button_${size}`],
    styles[`button_${variant}`],
    disabled && styles.button_disabled,
    style,
  ];

  const textStyle = [
    styles.buttonText,
    styles[`buttonText_${size}`],
    styles[`buttonText_${variant}`],
    disabled && styles.buttonText_disabled,
  ];

  if (variant === "primary") {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        style={buttonStyle}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: disabled || loading }}
      >
        <LinearGradient
          colors={disabled ? ["#E0E0E0", "#BDBDBD"] : ["#E91E63", "#AD1457"]}
          style={styles.gradientButton}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.buttonContent}>
              {icon && (
                <Ionicons
                  name={icon}
                  size={size === "small" ? 16 : size === "large" ? 24 : 20}
                  color="#FFFFFF"
                  style={styles.buttonIcon}
                />
              )}
              <Text style={textStyle}>{title}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      style={buttonStyle}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? "#E91E63" : "#FFFFFF"}
          size="small"
        />
      ) : (
        <View style={styles.buttonContent}>
          {icon && (
            <Ionicons
              name={icon}
              size={size === "small" ? 16 : size === "large" ? 24 : 20}
              color={variant === "outline" ? "#E91E63" : "#FFFFFF"}
              style={styles.buttonIcon}
            />
          )}
          <Text style={textStyle}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

interface EmojiProfileButtonProps {
  emoji: EmojiType;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
  testID?: string;
}

/**
 * Emoji Profile Selection Button
 */
export function EmojiProfileButton({
  emoji,
  onPress,
  selected = false,
  disabled = false,
  size = "medium",
  style,
  testID,
}: EmojiProfileButtonProps) {
  const handlePress = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const buttonSize = size === "small" ? 60 : size === "large" ? 100 : 80;
  const emojiSize = size === "small" ? 30 : size === "large" ? 50 : 40;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.emojiButton,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
        },
        selected && styles.emojiButton_selected,
        disabled && styles.emojiButton_disabled,
        style,
      ]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`Select ${emoji} profile`}
      accessibilityState={{ selected, disabled }}
    >
      <Text style={[styles.emojiText, { fontSize: emojiSize }]}>{emoji}</Text>
    </TouchableOpacity>
  );
}

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: boolean;
  shadow?: boolean;
  testID?: string;
}

/**
 * Card Container Component
 */
export function Card({
  children,
  style,
  padding = true,
  shadow = true,
  testID,
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        shadow && styles.card_shadow,
        padding && styles.card_padding,
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Screen Header Component
 */
export function Header({
  title,
  subtitle,
  rightElement,
  style,
  testID,
}: HeaderProps) {
  return (
    <View style={[styles.header, style]} testID={testID}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement && <View style={styles.headerRight}>{rightElement}</View>}
    </View>
  );
}

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  testID?: string;
}

/**
 * Loading Overlay Component
 */
export function LoadingOverlay({
  visible,
  message = "Loading...",
  testID,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <View style={styles.loadingOverlay} testID={testID}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color="#E91E63" />
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    </View>
  );
}

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Empty State Component
 */
export function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  style,
  testID,
}: EmptyStateProps) {
  return (
    <View style={[styles.emptyState, style]} testID={testID}>
      <Ionicons name={icon} size={64} color="#BDBDBD" />
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateDescription}>{description}</Text>
      {actionText && onAction && (
        <Button
          title={actionText}
          onPress={onAction}
          variant="outline"
          style={styles.emptyStateAction}
        />
      )}
    </View>
  );
}

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  destructive?: boolean;
}

/**
 * Confirmation Dialog Helper
 */
export function showConfirmDialog({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  Alert.alert(
    title,
    message,
    [
      {
        text: cancelText,
        onPress: onCancel,
        style: "cancel",
      },
      {
        text: confirmText,
        onPress: onConfirm,
        style: destructive ? "destructive" : "default",
      },
    ],
    { cancelable: true }
  );
}

const styles = StyleSheet.create({
  // Button Styles
  button: {
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  button_small: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    minHeight: 32,
  },
  button_medium: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  button_large: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 56,
  },
  button_primary: {
    backgroundColor: "#E91E63",
  },
  button_secondary: {
    backgroundColor: "#757575",
  },
  button_outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#E91E63",
  },
  button_danger: {
    backgroundColor: "#F44336",
  },
  button_disabled: {
    backgroundColor: "#E0E0E0",
    borderColor: "#E0E0E0",
  },
  gradientButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: SPACING.xs,
  },
  buttonText: {
    fontWeight: "600",
    textAlign: "center",
  },
  buttonText_small: {
    fontSize: 14,
  },
  buttonText_medium: {
    fontSize: 16,
  },
  buttonText_large: {
    fontSize: 18,
  },
  buttonText_primary: {
    color: "#FFFFFF",
  },
  buttonText_secondary: {
    color: "#FFFFFF",
  },
  buttonText_outline: {
    color: "#E91E63",
  },
  buttonText_danger: {
    color: "#FFFFFF",
  },
  buttonText_disabled: {
    color: "#9E9E9E",
  },

  // Emoji Button Styles
  emojiButton: {
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    margin: SPACING.xs,
  },
  emojiButton_selected: {
    borderColor: "#E91E63",
    backgroundColor: "#FCE4EC",
  },
  emojiButton_disabled: {
    opacity: 0.5,
  },
  emojiText: {
    textAlign: "center",
  },

  // Card Styles
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: BORDER_RADIUS.lg,
  },
  card_padding: {
    padding: SPACING.md,
  },
  card_shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#757575",
    marginTop: 4,
  },
  headerRight: {
    marginLeft: SPACING.md,
  },

  // Loading Overlay Styles
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  loadingContent: {
    backgroundColor: "#FFFFFF",
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: "center",
    minWidth: 120,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 16,
    color: "#212121",
    textAlign: "center",
  },

  // Empty State Styles
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    marginTop: SPACING.md,
    textAlign: "center",
  },
  emptyStateDescription: {
    fontSize: 16,
    color: "#757575",
    marginTop: SPACING.sm,
    textAlign: "center",
    lineHeight: 24,
  },
  emptyStateAction: {
    marginTop: SPACING.lg,
  },
});
