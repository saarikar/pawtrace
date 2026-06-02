import React from 'react'
import { View, Text } from 'react-native'
import { colors, fonts, radius } from '../lib/theme'

export default function Badge({ label, color, bg, icon, size = 'sm' }) {
  const c = color || colors.primary
  const b = bg || (c + '15')
  const S = { xs: { ph: 6, pv: 2, fs: 9 }, sm: { ph: 9, pv: 4, fs: 11 }, md: { ph: 14, pv: 5, fs: 13 } }
  const s = S[size]
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: b, paddingHorizontal: s.ph, paddingVertical: s.pv, borderRadius: radius.pill, alignSelf: 'flex-start' }}>
      {icon && <Text style={{ fontSize: s.fs, marginRight: 3 }}>{icon}</Text>}
      <Text style={{ color: c, fontSize: s.fs, fontWeight: fonts.bold, letterSpacing: 0.3 }}>{label}</Text>
    </View>
  )
}
