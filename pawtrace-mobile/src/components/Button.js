import React from 'react'
import { Pressable, Text, ActivityIndicator } from 'react-native'
import { colors, fonts, radius, shadows } from '../lib/theme'

export default function Button({
  title, onPress, variant = 'primary', size = 'md',
  icon, loading = false, disabled = false, style,
}) {
  const V = {
    primary:   { bg: colors.primary, text: '#fff', border: 'transparent', shadow: shadows.glow },
    secondary: { bg: colors.secondary, text: '#fff', border: 'transparent', shadow: shadows.md },
    accent:    { bg: colors.accent, text: '#fff', border: 'transparent', shadow: shadows.md },
    teal:      { bg: colors.teal, text: '#fff', border: 'transparent', shadow: shadows.md },
    outline:   { bg: 'transparent', text: colors.primary, border: colors.primary, shadow: null },
    ghost:     { bg: colors.primarySoft, text: colors.primary, border: 'transparent', shadow: null },
    soft:      { bg: colors.bgSection, text: colors.textSecondary, border: colors.border, shadow: null },
    danger:    { bg: colors.dangerSoft, text: colors.danger, border: colors.danger + '40', shadow: null },
    white:     { bg: '#fff', text: colors.secondary, border: colors.border, shadow: shadows.sm },
  }
  const S = {
    sm: { py: 10, px: 18, fs: fonts.sm, r: radius.pill },
    md: { py: 14, px: 22, fs: fonts.base, r: radius.pill },
    lg: { py: 17, px: 28, fs: fonts.md, r: radius.pill },
  }
  const v = V[variant] || V.primary
  const s = S[size]

  return (
    <Pressable onPress={onPress} disabled={disabled || loading}
      style={({ pressed }) => [{
        backgroundColor: disabled ? colors.border : v.bg,
        borderColor: v.border, borderWidth: 1.5, borderRadius: s.r,
        paddingVertical: s.py, paddingHorizontal: s.px,
        alignItems: 'center', width: '100%',
        opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }],
      }, v.shadow && !disabled && v.shadow, style]}>
      {loading ? <ActivityIndicator color={v.text} size="small" /> : (
        <Text style={{ color: disabled ? colors.textMuted : v.text, fontSize: s.fs, fontWeight: fonts.bold, letterSpacing: 0.3 }}>
          {icon ? `${icon}  ${title}` : title}
        </Text>
      )}
    </Pressable>
  )
}
