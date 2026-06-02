import React from 'react'
import { View, Text, TextInput, StyleSheet } from 'react-native'
import { colors, fonts, spacing, radius } from '../lib/theme'

export default function InputField({ label, value, onChangeText, placeholder, hint, error, multiline = false, secureTextEntry = false, keyboardType = 'default', autoCapitalize = 'sentences', style, ...props }) {
  return (
    <View style={[st.container, style]}>
      {label && <Text style={st.label}>{label}</Text>}
      <TextInput
        style={[st.input, multiline && st.multiline, error && st.inputError]}
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={colors.textMuted} secureTextEntry={secureTextEntry}
        keyboardType={keyboardType} autoCapitalize={autoCapitalize} multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'} {...props} />
      {hint && !error && <Text style={st.hint}>{hint}</Text>}
      {error && <Text style={st.error}>{error}</Text>}
    </View>
  )
}

const st = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { fontSize: fonts.sm, fontWeight: fonts.semibold, color: colors.textSecondary, marginBottom: spacing.xs + 2 },
  input: { backgroundColor: colors.bgInput, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: fonts.base, color: colors.text },
  multiline: { height: 90, paddingTop: 14 },
  inputError: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  hint: { fontSize: fonts.xs, color: colors.textMuted, marginTop: spacing.xs },
  error: { fontSize: fonts.xs, color: colors.danger, marginTop: spacing.xs },
})
