import React from 'react'
import { View, Text } from 'react-native'
import Button from './Button'
import Icon from './Icon'
import { colors, fonts, spacing } from '../lib/theme'

export default function EmptyState({ icon = 'paw', title, message, actionLabel, onAction }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.huge, paddingHorizontal: spacing.xxl }}>
      <View style={{ marginBottom: spacing.lg }}>
        <Icon name={icon} size={56} color={colors.textMuted} />
      </View>
      <Text style={{ fontSize: fonts.lg, fontWeight: fonts.bold, color: colors.text, textAlign: 'center', marginBottom: spacing.sm }}>{title}</Text>
      {message && <Text style={{ fontSize: fonts.base, color: colors.textMuted, textAlign: 'center', lineHeight: 22, maxWidth: 280 }}>{message}</Text>}
      {actionLabel && onAction && <View style={{ marginTop: spacing.xl, width: 200 }}><Button title={actionLabel} onPress={onAction} size="sm" /></View>}
    </View>
  )
}
