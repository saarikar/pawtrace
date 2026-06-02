import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors, fonts, spacing, layout } from '../lib/theme'

export default function Header({ title, subtitle, back, onBack, rightAction }) {
  return (
    <View style={styles.container}>
      {back && (
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>{back}</Text>
        </Pressable>
      )}
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {rightAction}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.secondary,
    paddingTop: layout.headerPaddingTop,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: spacing.sm },
  backIcon: { color: 'rgba(255,255,255,0.85)', fontSize: 22, fontWeight: fonts.bold },
  backText: { color: 'rgba(255,255,255,0.75)', fontSize: fonts.sm },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  title: { color: colors.textOnDark, fontWeight: fonts.black, fontSize: fonts.xl, letterSpacing: -0.3 },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: fonts.xs, marginTop: 3 },
})
