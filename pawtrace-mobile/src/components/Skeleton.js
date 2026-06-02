import React, { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { colors, radius, spacing } from '../lib/theme'

function SkeletonBlock({ width = '100%', height = 16, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[styles.block, { width, height, opacity }, style]}
    />
  )
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <SkeletonBlock width={60} height={60} style={{ borderRadius: radius.md }} />
      <View style={styles.cardBody}>
        <SkeletonBlock width="60%" height={14} />
        <SkeletonBlock width="40%" height={12} style={{ marginTop: 8 }} />
        <SkeletonBlock width="80%" height={12} style={{ marginTop: 8 }} />
      </View>
    </View>
  )
}

export function SkeletonFeed({ count = 4 }) {
  return (
    <View style={styles.feed}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  )
}

export default SkeletonBlock

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.border,
    borderRadius: 6,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.md,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  feed: {
    padding: spacing.lg,
  },
})
