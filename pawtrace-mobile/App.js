import React, { useState, useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View, Text } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppProvider, useApp } from './src/context/AppContext'
import AppNavigator from './src/navigation/AppNavigator'
import ErrorBoundary from './src/components/ErrorBoundary'
import OnboardingScreen from './src/screens/OnboardingScreen'
import useNetworkStatus from './src/lib/useNetworkStatus'
import { colors } from './src/lib/theme'

function OfflineBanner() {
  const isOnline = useNetworkStatus()
  if (isOnline) return null
  return (
    <View style={{ backgroundColor: colors.danger, paddingVertical: 6, paddingHorizontal: 16, alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>No internet connection</Text>
    </View>
  )
}

function AppContent() {
  const { loading } = useApp()
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🐾</Text>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textMuted, fontSize: 14 }}>Loading...</Text>
      </View>
    )
  }
  return (
    <>
      <StatusBar style="light" />
      <OfflineBanner />
      <AppNavigator />
    </>
  )
}

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(null)

  useEffect(() => {
    AsyncStorage.getItem('onboarding_done').then(v => setShowOnboarding(v !== '1'))
  }, [])

  if (showOnboarding === null) return null // still checking
  if (showOnboarding) return <OnboardingScreen onDone={() => setShowOnboarding(false)} />

  return (
    <ErrorBoundary>
      <AppProvider><AppContent /></AppProvider>
    </ErrorBoundary>
  )
}
