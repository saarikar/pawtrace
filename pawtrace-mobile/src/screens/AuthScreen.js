import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { signIn, signUp, getProfile } from '../lib/data'
import { isDemoMode } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { colors, fonts, spacing, radius, shadows, layout } from '../lib/theme'
import { CITIES } from '../lib/constants'
import Card from '../components/Card'
import Button from '../components/Button'
import InputField from '../components/InputField'
import ChipSelect from '../components/ChipSelect'
import Icon from '../components/Icon'

export default function AuthScreen() {
  const { setUser, setProfile } = useApp()
  const navigation = useNavigation()
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ name: '', email: '', password: '', city: 'Chennai' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError(''); setLoading(true)
    let user, err
    if (mode === 'signup') {
      if (!form.name || !form.email || !form.password) { setError('Please fill all fields'); setLoading(false); return }
      ;({ user, error: err } = await signUp(form.email, form.password, form.name, form.city))
    } else {
      ;({ user, error: err } = await signIn(form.email, form.password))
    }
    setLoading(false)
    if (err) { setError(err.message || 'Something went wrong'); return }
    const profile = user ? await getProfile(user.id) : { name: form.name, email: form.email, city: form.city }
    setUser(user); setProfile(profile); navigation.goBack()
  }

  const handleDemo = () => {
    setUser({ id: 'demo', email: 'demo@test.com' })
    setProfile({ id: 'demo', name: 'Demo User', city: 'Chennai', email: 'demo@test.com' })
    navigation.goBack()
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.inner}>
      {/* Logo */}
      <View style={styles.logo}>
        <View style={styles.logoCircle}><Icon name="paw" size={40} color={colors.primary} /></View>
        <Text style={styles.logoTitle}>PawTrace</Text>
        <Text style={styles.logoSub}>AI-Powered Dog Finder</Text>
      </View>

      {/* Form */}
      <View style={styles.formCard}>
        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          {[['signin', 'Sign In'], ['signup', 'Sign Up']].map(([key, label]) => (
            <Pressable key={key} onPress={() => { setMode(key); setError('') }}
              style={[styles.modeBtn, mode === key && styles.modeBtnActive]}>
              <Text style={[styles.modeBtnText, mode === key && styles.modeBtnTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {isDemoMode && (
          <Card variant="warning" style={{ marginBottom: spacing.lg }}>
            <Text style={{ fontSize: fonts.sm, color: colors.warning }}>Demo mode — no database connected</Text>
          </Card>
        )}
        {error ? <Card variant="danger" style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: fonts.sm, color: colors.danger }}>{error}</Text>
        </Card> : null}

        {mode === 'signup' && (
          <>
            <InputField label="Your name" value={form.name} onChangeText={v => set('name', v)} placeholder="Arun Kumar" />
            <ChipSelect label="City" options={CITIES} value={form.city} onChange={v => set('city', v)} />
          </>
        )}
        <InputField label="Email" value={form.email} onChangeText={v => set('email', v)}
          placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
        <InputField label="Password" value={form.password} onChangeText={v => set('password', v)}
          placeholder="••••••••" secureTextEntry onSubmitEditing={handleSubmit} />

        <Button title={mode === 'signup' ? 'Create Account' : 'Sign In'} onPress={handleSubmit} loading={loading} size="lg" />
        {mode === 'signin' && <View style={{ marginTop: spacing.md }}><Button title="Continue as Demo" onPress={handleDemo} variant="glass" /></View>}
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleText}>{mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}</Text>
        <Pressable onPress={() => { setMode(m => m === 'signup' ? 'signin' : 'signup'); setError('') }}>
          <Text style={styles.toggleLink}>{mode === 'signup' ? 'Sign in' : 'Sign up'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgScreen },
  inner: { paddingHorizontal: spacing.xxl, paddingTop: 80, paddingBottom: spacing.xxxl },
  logo: { alignItems: 'center', marginBottom: spacing.xxxl },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg, borderWidth: 2, borderColor: colors.primary + '40',
  },
  logoTitle: { fontSize: fonts.xxl, fontWeight: fonts.black, color: colors.primary },
  logoSub: { fontSize: fonts.base, color: colors.textMuted, marginTop: spacing.xs },
  formCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.xxl,
    borderWidth: 1, borderColor: colors.border, ...shadows.md,
  },
  modeToggle: {
    flexDirection: 'row', backgroundColor: colors.bgInput, borderRadius: radius.sm,
    padding: 3, marginBottom: spacing.xxl,
  },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.xs, alignItems: 'center' },
  modeBtnActive: { backgroundColor: colors.bgSection },
  modeBtnText: { fontSize: fonts.base, color: colors.textMuted, fontWeight: fonts.medium },
  modeBtnTextActive: { color: colors.text, fontWeight: fonts.bold },
  toggleRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xxl, alignItems: 'center' },
  toggleText: { fontSize: fonts.base, color: colors.textMuted },
  toggleLink: { color: colors.primary, fontWeight: fonts.bold, fontSize: fonts.base },
})
