import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors, fonts, spacing, radius } from '../lib/theme'

export default function ChipSelect({ options, value, onChange, label }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      {label && <Text style={st.label}>{label}</Text>}
      <View style={st.row}>
        {options.map(opt => {
          const val = typeof opt === 'string' ? opt : opt.value
          const display = typeof opt === 'string' ? opt : opt.label
          const active = value === val
          return (
            <Pressable key={val} onPress={() => onChange(val)}
              style={[st.chip, active ? st.active : st.inactive]}>
              <Text style={[st.text, active ? st.textActive : st.textInactive]}>{display}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const st = StyleSheet.create({
  label: { fontSize: fonts.sm, fontWeight: fonts.semibold, color: colors.textSecondary, marginBottom: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1.5 },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  inactive: { backgroundColor: colors.bgInput, borderColor: colors.border },
  text: { fontSize: fonts.sm, fontWeight: fonts.semibold },
  textActive: { color: '#fff' },
  textInactive: { color: colors.textSecondary },
})
