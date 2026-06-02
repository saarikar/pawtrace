import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { getDogs } from '../lib/data'
import { colors, fonts, spacing, radius, shadows, layout } from '../lib/theme'
import DogCard from '../components/DogCard'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import { SkeletonFeed } from '../components/Skeleton'

const TABS = [
  { key: 'all', label: 'All', icon: 'paw' },
  { key: 'lost', label: 'Lost', icon: 'search' },
  { key: 'stray', label: 'Stray', icon: 'dog' },
  { key: 'vaccinated', label: 'Vacc.', icon: 'vaccine' },
]

export default function FeedScreen() {
  const navigation = useNavigation()
  const [filter, setFilter] = useState('all')
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const f = {}
    if (filter === 'lost') f.report_type = 'lost_pet'
    else if (filter === 'stray') f.report_type = 'stray'
    else if (filter === 'vaccinated') { f.report_type = 'stray'; f.vaccinated = true }
    const { data } = await getDogs(f)
    setDogs(data || [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const displayed = dogs.filter(d => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (d.breed || '').toLowerCase().includes(q) ||
      (d.area || '').toLowerCase().includes(q) ||
      (d.dog_id || '').includes(q) ||
      (d.pet_name || '').toLowerCase().includes(q)
    )
  })

  const renderItem = useCallback(({ item }) => (
    <DogCard dog={item} variant="full" onPress={() => navigation.navigate('Dog', { dogId: item.id })} />
  ), [navigation])

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Lost & Found</Text>
            <Text style={styles.headerSub}>{displayed.length} reports</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Search')} style={styles.aiBtn}>
            <Icon name="ai" size={14} color={colors.primary} />
            <Text style={styles.aiBtnText}>AI Search</Text>
          </Pressable>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Icon name="search" size={14} color={colors.textMuted} />
          <TextInput
            placeholder="Search breed, area, name..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabBar}>
        {TABS.map(({ key, label, icon }) => (
          <Pressable key={key} onPress={() => setFilter(key)}
            style={[styles.tab, filter === key && styles.tabActive]}>
            <Icon name={icon} size={11} color={filter === key ? colors.white : colors.textMuted} />
            <Text style={[styles.tabText, filter === key && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <SkeletonFeed count={5} />
      ) : (
        <FlatList
          data={displayed}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState icon="paw" title="No reports found"
              message={search ? 'Try a different search' : 'Be the first to report!'}
              actionLabel="Report a Dog" onAction={() => navigation.navigate('Report')} />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgScreen },
  header: { backgroundColor: colors.white, paddingTop: layout.headerPaddingTop, paddingHorizontal: layout.screenPadding, paddingBottom: spacing.lg },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  headerTitle: { color: colors.text, fontWeight: fonts.black, fontSize: fonts.xl },
  headerSub: { color: colors.textMuted, fontSize: fonts.xs, marginTop: 2 },
  aiBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primarySoft, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill,
  },
  aiBtnText: { color: colors.primary, fontSize: fonts.sm, fontWeight: fonts.bold },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgInput, borderRadius: radius.sm, paddingHorizontal: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: fonts.base, color: colors.text },
  tabBar: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: layout.screenPadding, paddingVertical: spacing.md,
    backgroundColor: colors.bgScreen,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: fonts.xs, color: colors.textMuted, fontWeight: fonts.medium },
  tabTextActive: { color: colors.white, fontWeight: fonts.bold },
  list: { padding: layout.screenPadding, paddingTop: spacing.sm },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
