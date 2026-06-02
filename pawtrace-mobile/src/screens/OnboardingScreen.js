import React, { useState, useRef } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet, Dimensions, Animated } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors, fonts, spacing, radius } from '../lib/theme'
import Icon from '../components/Icon'

const { width } = Dimensions.get('window')

const SLIDES = [
  {
    icon: 'paw',
    title: 'Every Paw Has a Story',
    body: 'PawTrace uses AI to identify and track stray dogs across Indian cities, creating digital passports for each one.',
    color: colors.primary,
  },
  {
    icon: 'scan',
    title: 'Scan & Identify',
    body: 'Take a photo of any street dog. Our AI detects the breed, color, markings, and creates a unique identity.',
    color: colors.secondary,
  },
  {
    icon: 'search',
    title: 'Find Lost Pets',
    body: 'Lost your pet? Upload a photo and our visual matching engine searches the database to help reunite you.',
    color: colors.teal,
  },
  {
    icon: 'report',
    title: 'Report & Help',
    body: 'Report injured or stray dogs, track their status, and connect with local shelters and rescuers.',
    color: colors.accent,
  },
]

export default function OnboardingScreen({ onDone }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef(null)
  const scrollX = useRef(new Animated.Value(0)).current

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 })
    } else {
      completeOnboarding()
    }
  }

  const handleSkip = () => completeOnboarding()

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('onboarding_done', '1')
    onDone()
  }

  const renderSlide = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
        <Icon name={item.icon} size={48} color={item.color} />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.body}>{item.body}</Text>
    </View>
  )

  const isLast = currentIndex === SLIDES.length - 1

  return (
    <View style={styles.container}>
      <View style={styles.skipWrap}>
        {!isLast && (
          <Pressable onPress={handleSkip} hitSlop={12}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={e => setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width]
          const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' })
          const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' })
          return <Animated.View key={i} style={[styles.dot, { width: dotWidth, opacity, backgroundColor: colors.primary }]} />
        })}
      </View>

      <Pressable style={styles.nextBtn} onPress={handleNext}>
        <Text style={styles.nextText}>{isLast ? 'Get Started' : 'Next'}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingBottom: 40 },
  skipWrap: { position: 'absolute', top: 60, right: spacing.xxl, zIndex: 10 },
  skipText: { fontSize: fonts.base, color: colors.textMuted, fontWeight: fonts.semibold },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxxl },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxxl,
  },
  title: { fontSize: fonts.xxl, fontWeight: fonts.black, color: colors.text, textAlign: 'center', marginBottom: spacing.lg },
  body: { fontSize: fonts.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: spacing.xxl },
  dot: { height: 8, borderRadius: 4 },
  nextBtn: {
    marginHorizontal: spacing.xxl,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  nextText: { color: '#fff', fontSize: fonts.md, fontWeight: fonts.bold },
})
