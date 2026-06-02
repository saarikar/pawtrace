import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useApp } from '../context/AppContext'
import { getDogs } from '../lib/data'
import { colors, fonts, spacing, radius, shadows, layout } from '../lib/theme'
import Card from '../components/Card'
import DogCard from '../components/DogCard'
import Icon from '../components/Icon'

const ACTIONS = [
  { icon: 'scan', label: 'Scan Dog', sub: 'AI passport', color: colors.primary, screen: 'Scan' },
  { icon: 'search', label: 'Search', sub: 'Find by photo', color: colors.secondary, screen: 'Search' },
  { icon: 'report', label: 'Report', sub: 'Lost or stray', color: colors.accent, screen: 'Report' },
  { icon: 'stats', label: 'Stats', sub: 'Dashboard', color: colors.teal, screen: 'Stats' },
]

export default function HomeScreen() {
  const { profile } = useApp()
  const navigation = useNavigation()
  const [recent, setRecent] = useState([])
  const [stats, setStats] = useState({ total: 0, lost: 0, rescued: 0 })

  useEffect(() => {
    getDogs({}).then(({ data }) => {
      const dogs = data || []
      setRecent(dogs.slice(0, 4))
      setStats({
        total: dogs.length,
        lost: dogs.filter(d => d.report_type === 'lost_pet').length,
        rescued: dogs.filter(d => d.status === 'in_shelter' || d.status === 'reunited').length,
      })
    })
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  }

  return (
    <ScrollView style={st.screen} showsVerticalScrollIndicator={false}>
      {/* Hero header */}
      <View style={st.hero}>
        <View style={st.heroTop}>
          <View>
            <Text style={st.greeting}>{greeting()}</Text>
            <Text style={st.userName}>{profile?.name || 'Dog Lover'}</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Profile')} style={st.avatar}>
            <Icon name="profile" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Scan CTA */}
        <Pressable onPress={() => navigation.navigate('Scan')}
          style={({ pressed }) => [st.scanCta, pressed && { opacity: 0.92 }]}>
          <View style={st.scanIconWrap}>
            <Icon name="paw" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.scanTitle}>Every paw has a story</Text>
            <Text style={st.scanSub}>Scan a dog to create its passport</Text>
          </View>
          <View style={st.scanBtn}>
            <Text style={st.scanBtnText}>Scan</Text>
            <Icon name="arrow" size={14} color="#fff" />
          </View>
        </Pressable>
      </View>

      <View style={st.content}>
        {/* Stats row */}
        <View style={st.statsRow}>
          {[
            { v: stats.total, l: 'Tracked', icon: 'dog', c: colors.primary },
            { v: stats.lost, l: 'Lost', icon: 'search', c: colors.accent },
            { v: stats.rescued, l: 'Rescued', icon: 'shelter', c: colors.teal },
          ].map(s => (
            <View key={s.l} style={st.statCard}>
              <Icon name={s.icon} size={20} color={s.c} />
              <Text style={[st.statVal, { color: s.c }]}>{s.v}</Text>
              <Text style={st.statLabel}>{s.l}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={st.sectionTitle}>Quick Actions</Text>
        <View style={st.actionsGrid}>
          {ACTIONS.map(a => (
            <Pressable key={a.label} onPress={() => navigation.navigate(a.screen)}
              style={({ pressed }) => [st.actionCard, pressed && { opacity: 0.88 }]}>
              <View style={[st.actionIcon, { backgroundColor: a.color + '12' }]}>
                <Icon name={a.icon} size={22} color={a.color} />
              </View>
              <Text style={st.actionLabel}>{a.label}</Text>
              <Text style={st.actionSub}>{a.sub}</Text>
            </Pressable>
          ))}
        </View>

        {/* Alert */}
        <Pressable onPress={() => navigation.navigate('Feed')}
          style={({ pressed }) => [st.alertCard, pressed && { opacity: 0.9 }]}>
          <View style={st.alertIconWrap}>
            <Icon name="notification" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.alertTitle}>
              {stats.lost > 0 ? `${stats.lost} lost pet${stats.lost > 1 ? 's' : ''} reported` : 'Dogs need your help'}
            </Text>
            <Text style={st.alertSub}>Tap to view latest reports</Text>
          </View>
          <Icon name="arrow" size={18} color={colors.primary} />
        </Pressable>

        {/* Recent */}
        <View style={st.sectionRow}>
          <Text style={st.sectionTitle}>Recent Reports</Text>
          <Pressable onPress={() => navigation.navigate('Feed')}>
            <Text style={st.seeAll}>See all</Text>
          </Pressable>
        </View>

        {recent.length > 0
          ? recent.map(d => <DogCard key={d.id} dog={d} variant="compact" onPress={() => navigation.navigate('Dog', { dogId: d.id })} />)
          : <Card variant="flat"><View style={{ alignItems: 'center', padding: spacing.xl }}>
              <Icon name="paw" size={36} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: spacing.sm }}>No reports yet</Text>
            </View></Card>
        }

        <View style={{ height: spacing.huge }} />
      </View>
    </ScrollView>
  )
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgScreen },
  hero: { backgroundColor: colors.secondary, paddingTop: layout.headerPaddingTop, paddingHorizontal: layout.screenPadding, paddingBottom: spacing.xxl, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xxl },
  greeting: { color: 'rgba(255,255,255,0.7)', fontSize: fonts.sm },
  userName: { color: '#fff', fontSize: fonts.xl, fontWeight: fonts.black, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },

  scanCta: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.xl, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  scanIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  scanTitle: { color: '#fff', fontWeight: fonts.bold, fontSize: fonts.base },
  scanSub: { color: 'rgba(255,255,255,0.65)', fontSize: fonts.xs, marginTop: 2 },
  scanBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 4 },
  scanBtnText: { color: '#fff', fontWeight: fonts.bold, fontSize: fonts.sm },

  content: { padding: layout.screenPadding, marginTop: -spacing.xs },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.xxl },
  statCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  statVal: { fontSize: fonts.xl, fontWeight: fonts.black, marginTop: 4 },
  statLabel: { fontSize: fonts.xxs, color: colors.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

  sectionTitle: { fontSize: fonts.md, fontWeight: fonts.bold, color: colors.text, marginBottom: spacing.md },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  seeAll: { fontSize: fonts.sm, color: colors.primary, fontWeight: fonts.semibold },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl },
  actionCard: { width: '48%', backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  actionIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  actionLabel: { fontWeight: fonts.bold, fontSize: fonts.sm, color: colors.text },
  actionSub: { fontSize: fonts.xs, color: colors.textMuted, marginTop: 2 },

  alertCard: { backgroundColor: colors.primarySoft, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.xxl, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.primary + '20' },
  alertIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  alertTitle: { color: colors.text, fontWeight: fonts.semibold, fontSize: fonts.base },
  alertSub: { color: colors.textMuted, fontSize: fonts.xs, marginTop: 2 },
})
