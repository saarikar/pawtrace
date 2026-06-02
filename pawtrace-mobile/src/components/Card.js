import React from 'react'
import { View, StyleSheet } from 'react-native'
import { colors, spacing, radius, shadows } from '../lib/theme'

export default function Card({ children, style, variant = 'default', padded = true }) {
  const V = {
    default:  { bg: colors.bgCard, border: colors.borderLight, shadow: shadows.sm },
    elevated: { bg: colors.bgCard, border: 'transparent', shadow: shadows.lg },
    flat:     { bg: colors.bgSection, border: colors.borderLight, shadow: null },
    accent:   { bg: colors.primarySoft, border: colors.primary + '20', shadow: null },
    success:  { bg: colors.successSoft, border: colors.success + '25', shadow: null },
    warning:  { bg: colors.warningSoft, border: colors.warning + '25', shadow: null },
    danger:   { bg: colors.dangerSoft, border: colors.danger + '25', shadow: null },
    info:     { bg: colors.infoSoft, border: colors.info + '25', shadow: null },
    teal:     { bg: colors.tealSoft, border: colors.teal + '25', shadow: null },
    glass:    { bg: colors.bgCard, border: colors.border, shadow: shadows.md },
    dark:     { bg: colors.secondary, border: 'transparent', shadow: shadows.lg },
  }
  const v = V[variant] || V.default

  return (
    <View style={[
      { backgroundColor: v.bg, borderColor: v.border, borderWidth: 1, borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.md },
      v.shadow,
      padded && { padding: spacing.lg },
      style,
    ]}>
      {children}
    </View>
  )
}
