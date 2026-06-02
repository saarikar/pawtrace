import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { getDogs, getModelStats } from '../lib/data'
import { colors, fonts, spacing, radius, shadows, layout } from '../lib/theme'
import Header from '../components/Header'
import Card from '../components/Card'
import Icon from '../components/Icon'

export default function StatsScreen() {
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getDogs().then(({ data }) => {
      setDogs(data || [])
      setStats(getModelStats(data || []))
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Loading dashboard...</Text>
    </View>
  )

  const confColor = v => v >= 80 ? colors.success : v >= 60 ? colors.warning : colors.danger
  const breedsSorted = stats ? Object.entries(stats.breedDist).sort((a, b) => b[1] - a[1]) : []
  const vaccRate = stats?.total > 0 ? Math.round(((dogs.filter(d => d.vaccinated).length) / stats.total) * 100) : 0
  const barColors = [colors.primary, colors.accent, colors.secondary, colors.success]

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <Header title="Dashboard" subtitle="AI Model Performance" />

      <View style={styles.content}>
        {/* KPIs */}
        <View style={styles.kpiGrid}>
          {[
            { l: 'Dogs', v: stats.total, i: 'dog', c: colors.primary },
            { l: 'Vacc. Rate', v: vaccRate + '%', i: 'vaccine', c: colors.success },
            { l: 'AI Conf.', v: stats.avgConfidence + '%', i: 'ai', c: colors.secondary },
            { l: 'Reports', v: stats.total, i: 'report', c: colors.accent },
          ].map(k => (
            <View key={k.l} style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: k.c + '20' }]}>
                <Icon name={k.i} size={18} color={k.c} />
              </View>
              <Text style={[styles.kpiVal, { color: k.c }]}>{k.v}</Text>
              <Text style={styles.kpiLabel}>{k.l}</Text>
            </View>
          ))}
        </View>

        {/* Confidence */}
        <Card variant="elevated">
          <View style={styles.secTitleRow}>
            <Icon name="stats" size={16} color={colors.text} />
            <Text style={styles.secTitle}>Confidence Distribution</Text>
          </View>
          <View style={styles.confRow}>
            {[
              { l: 'High ≥80%', n: stats.confDist.high, c: colors.success },
              { l: 'Mid 60-79%', n: stats.confDist.mid, c: colors.warning },
              { l: 'Low <60%', n: stats.confDist.low, c: colors.danger },
            ].map(b => (
              <View key={b.l} style={[styles.confCard, { backgroundColor: b.c + '15' }]}>
                <Text style={[styles.confVal, { color: b.c }]}>{b.n}</Text>
                <Text style={[styles.confLabel, { color: b.c }]}>{b.l}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Breeds */}
        {breedsSorted.length > 0 && (
          <Card variant="elevated">
            <View style={styles.secTitleRow}>
              <Icon name="paw" size={16} color={colors.text} />
              <Text style={styles.secTitle}>Breed Distribution</Text>
            </View>
            {breedsSorted.map(([breed, count], i) => {
              const pct = stats.total ? Math.round((count / stats.total) * 100) : 0
              return (
                <View key={breed} style={styles.breedRow}>
                  <View style={styles.breedHead}>
                    <Text style={styles.breedName} numberOfLines={1}>{breed}</Text>
                    <Text style={[styles.breedPct, { color: barColors[i % 4] }]}>{count} ({pct}%)</Text>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: pct + '%', backgroundColor: barColors[i % 4] }]} />
                  </View>
                </View>
              )
            })}
          </Card>
        )}

        {/* Health */}
        <Card variant="elevated">
          <View style={styles.secTitleRow}>
            <Icon name="medical" size={16} color={colors.text} />
            <Text style={styles.secTitle}>Health Summary</Text>
          </View>
          {[
            { icon: 'warning', l: 'Injured', n: stats.injuredCount, c: stats.injuredCount > 0 ? colors.danger : colors.success },
            { icon: 'check', l: 'Healthy', n: stats.total - stats.injuredCount, c: colors.success },
            { icon: 'vaccine', l: 'Vaccinated', n: dogs.filter(d => d.vaccinated).length, c: colors.success },
          ].map((item) => (
            <View key={item.l} style={styles.healthRow}>
              <View style={styles.healthLeft}>
                <Icon name={item.icon} size={14} color={item.c} />
                <Text style={styles.healthLabel}>{item.l}</Text>
              </View>
              <Text style={[styles.healthVal, { color: item.c }]}>{item.n} / {stats.total}</Text>
            </View>
          ))}
        </Card>

        <View style={{ height: spacing.huge }} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgScreen },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgScreen },
  loadingText: { color: colors.textMuted, fontSize: fonts.base, marginTop: spacing.md },
  content: { padding: layout.screenPadding },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  kpiCard: {
    width: '48%', backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  kpiIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  kpiVal: { fontWeight: fonts.black, fontSize: fonts.xxl },
  kpiLabel: { color: colors.textMuted, fontSize: fonts.xs, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  secTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  secTitle: { fontSize: fonts.base, fontWeight: fonts.bold, color: colors.text },
  confRow: { flexDirection: 'row', gap: spacing.sm },
  confCard: { flex: 1, borderRadius: radius.sm, padding: spacing.md, alignItems: 'center' },
  confVal: { fontSize: fonts.xxl, fontWeight: fonts.black },
  confLabel: { fontSize: 9, fontWeight: fonts.semibold, marginTop: 4 },
  breedRow: { marginBottom: spacing.md },
  breedHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  breedName: { color: colors.textSecondary, fontSize: fonts.sm, flex: 1, marginRight: 8 },
  breedPct: { fontSize: fonts.sm, fontWeight: fonts.bold },
  barBg: { backgroundColor: colors.bgInput, borderRadius: 4, height: 8, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  healthRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  healthLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  healthLabel: { color: colors.textSecondary, fontSize: fonts.base },
  healthVal: { fontWeight: fonts.bold, fontSize: fonts.base },
})
