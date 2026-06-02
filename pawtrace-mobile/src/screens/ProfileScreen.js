import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { updateProfile } from '../lib/data'
import { isDemoMode } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { colors, fonts, spacing, radius, shadows, layout } from '../lib/theme'
import { CITIES } from '../lib/constants'
import Header from '../components/Header'
import Card from '../components/Card'
import Button from '../components/Button'
import InputField from '../components/InputField'
import ChipSelect from '../components/ChipSelect'
import Badge from '../components/Badge'
import Icon from '../components/Icon'

export default function ProfileScreen() {
  const { user, profile, setProfile, signOut } = useApp()
  const navigation = useNavigation()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: profile?.name || '', city: profile?.city || 'Chennai' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  if (!user) return (
    <View style={styles.authWrap}>
      <View style={styles.authCircle}><Icon name="profile" size={40} color={colors.textMuted} /></View>
      <Text style={styles.authTitle}>Sign in to continue</Text>
      <Text style={styles.authSub}>Track reports & manage your passport</Text>
      <Button title="Sign In" onPress={() => navigation.navigate('Auth')} size="lg" style={{ width: 200 }} />
    </View>
  )

  const handleSave = async () => {
    setSaving(true); setError('')
    const { error: err } = await updateProfile(user.id, { name: form.name, city: form.city })
    setSaving(false)
    if (err) { setError(err.message); return }
    setProfile(p => ({ ...p, ...form }))
    setEditing(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const displayName = profile?.name || user?.email || 'User'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>PROFILE</Text>
        <View style={styles.profileRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{displayName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: 3 }}>
              <Icon name="pin" size={13} color={colors.textSecondary} />
              <Text style={styles.city}>{profile?.city || 'India'}</Text>
            </View>
            <Badge label="PawTrace Member" color={colors.primary} size="sm" />
          </View>
        </View>
        <View style={styles.idRow}>
          <Text style={styles.idLabel}>MEMBER ID</Text>
          <Text style={styles.idVal}>PT-USER-{user?.id?.slice(0, 6)?.toUpperCase() || 'DEMO'}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Profile details */}
        <Card variant="elevated">
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Profile Details</Text>
            <Pressable onPress={() => { setEditing(e => !e); setForm({ name: profile?.name || '', city: profile?.city || 'Chennai' }) }}>
              <Text style={styles.editLink}>{editing ? 'Cancel' : 'Edit'}</Text>
            </Pressable>
          </View>
          {editing ? (
            <>
              <InputField label="Name" value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="Your name" />
              <ChipSelect label="City" options={CITIES} value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} />
              {error ? <Text style={{ color: colors.danger, fontSize: fonts.sm, marginBottom: spacing.md }}>{error}</Text> : null}
              <Button title="Save Changes" onPress={handleSave} loading={saving} />
            </>
          ) : (
            [['Name', profile?.name || '—'], ['City', profile?.city || '—'], ['Email', user?.email || '—']].map(([k, v]) => (
              <View key={k} style={styles.detailRow}>
                <Text style={styles.detailKey}>{k}</Text>
                <Text style={styles.detailVal}>{v}</Text>
              </View>
            ))
          )}
          {saved && (
            <View style={{ marginTop: spacing.md, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
              <Icon name="check" size={14} color={colors.success} />
              <Text style={{ fontSize: fonts.sm, color: colors.success, fontWeight: fonts.semibold }}>Updated</Text>
            </View>
          )}
        </Card>

        {/* About */}
        <Card variant="glass">
          <Text style={styles.aboutTitle}>About PawTrace</Text>
          {[
            { icon: 'globe', k: 'Project', v: 'PawTrace India' },
            { icon: 'database', k: 'Database', v: isDemoMode ? 'Demo' : 'Supabase' },
            { icon: 'dog', k: 'Breeds', v: '13 Indian types' },
            { icon: 'ai', k: 'AI', v: 'YOLOv8 + MobileNetV2' },
          ].map((item) => (
            <View key={item.k} style={styles.aboutRow}>
              <Icon name={item.icon} size={14} color={colors.textSecondary} />
              <Text style={styles.aboutKey}>{item.k}</Text>
              <Text style={styles.aboutVal}>{item.v}</Text>
            </View>
          ))}
        </Card>

        <Pressable onPress={() => navigation.navigate('Privacy')} style={styles.privacyLink}>
          <Icon name="document" size={14} color={colors.textSecondary} />
          <Text style={styles.privacyText}>Privacy Policy</Text>
          <Icon name="arrow" size={14} color={colors.textMuted} />
        </Pressable>

        <Button title="Sign Out" onPress={signOut} variant="danger" />
        <View style={{ height: spacing.huge }} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgScreen },
  authWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgScreen, padding: spacing.xxxl, gap: spacing.lg },
  authCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center' },
  authTitle: { fontSize: fonts.lg, fontWeight: fonts.bold, color: colors.text, textAlign: 'center' },
  authSub: { fontSize: fonts.base, color: colors.textMuted, textAlign: 'center' },

  header: { backgroundColor: colors.white, paddingTop: layout.headerPaddingTop, paddingHorizontal: layout.screenPadding, paddingBottom: spacing.xxl },
  headerLabel: { color: colors.textMuted, fontSize: fonts.xs, fontWeight: fonts.bold, letterSpacing: 1, marginBottom: spacing.lg },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.lg },
  avatar: {
    width: 60, height: 60, borderRadius: 20,
    backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.primary + '40',
  },
  avatarText: { color: colors.primary, fontSize: fonts.xl, fontWeight: fonts.black },
  name: { color: colors.text, fontWeight: fonts.black, fontSize: fonts.xl },
  city: { color: colors.textSecondary, fontSize: fonts.sm },
  idRow: {
    backgroundColor: colors.bgSection, borderRadius: radius.sm, padding: spacing.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  idLabel: { color: colors.textMuted, fontSize: fonts.xs, letterSpacing: 0.5 },
  idVal: { color: colors.primary, fontSize: fonts.sm, fontWeight: fonts.bold, letterSpacing: 1 },

  content: { padding: layout.screenPadding },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  cardTitle: { fontSize: fonts.base, fontWeight: fonts.bold, color: colors.text },
  editLink: { fontSize: fonts.sm, color: colors.primary, fontWeight: fonts.bold },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  detailKey: { color: colors.textMuted, fontSize: fonts.base },
  detailVal: { fontWeight: fonts.semibold, color: colors.text, fontSize: fonts.base },
  aboutTitle: { fontSize: fonts.sm, fontWeight: fonts.bold, color: colors.textMuted, letterSpacing: 0.5, marginBottom: spacing.lg },
  aboutRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  aboutKey: { flex: 1, color: colors.textMuted, fontSize: fonts.sm },
  aboutVal: { fontWeight: fonts.semibold, color: colors.text, fontSize: fonts.sm },
  privacyLink: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.borderLight,
  },
  privacyText: { flex: 1, fontSize: fonts.base, color: colors.text, fontWeight: fonts.medium },
})
