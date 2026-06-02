import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { colors, fonts, radius, spacing, statusConfig } from '../lib/theme'
import Icon from './Icon'

export function StatusPill({ status, size = 'sm' }) {
  const c = statusConfig[status] || { color: colors.textMuted, bg: colors.bgSection, label: status, icon: 'pin' }
  const S = { sm: { ph: 10, pv: 4, fs: 10 }, md: { ph: 14, pv: 6, fs: 12 } }
  const s = S[size]
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.bg, paddingHorizontal: s.ph, paddingVertical: s.pv, borderRadius: radius.pill }}>
      <Icon name={c.icon} size={s.fs} color={c.color} />
      <Text style={{ color: c.color, fontSize: s.fs, fontWeight: fonts.bold }}>{c.label}</Text>
    </View>
  )
}

export function StatusSelector({ value, onChange, disabled }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {Object.entries(statusConfig).map(([key, c]) => (
        <Pressable key={key} onPress={() => !disabled && onChange(key)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
            paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md,
            backgroundColor: value === key ? c.bg : colors.bgInput,
            borderWidth: 1.5, borderColor: value === key ? c.color + '50' : colors.border,
          }}>
          <Icon name={c.icon} size={12} color={value === key ? c.color : colors.textMuted} />
          <Text style={{ fontSize: fonts.sm, color: value === key ? c.color : colors.textMuted, fontWeight: value === key ? fonts.bold : fonts.regular }}>{c.label}</Text>
        </Pressable>
      ))}
    </View>
  )
}
