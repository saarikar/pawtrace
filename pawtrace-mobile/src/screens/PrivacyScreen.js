import React from 'react'
import { ScrollView, Text, View, StyleSheet, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { colors, fonts, spacing, layout } from '../lib/theme'
import Icon from '../components/Icon'

const SECTIONS = [
  {
    title: 'Information We Collect',
    body: `When you create an account, we collect your name, email address, and city. When you submit a dog report, we collect the photo, GPS location, and any notes you provide. Photos are processed by our AI models to extract breed, color, and visual features for matching purposes.`,
  },
  {
    title: 'How We Use Your Data',
    body: `Your data is used to: identify and track stray dogs, match lost pets with found reports, display reports to other users in your area, and improve our AI detection models. We do not sell your personal data to third parties.`,
  },
  {
    title: 'Photo Processing',
    body: `Dog photos are sent to our backend servers for AI analysis (breed detection, feature extraction). Photos are stored in Supabase cloud storage. Feature vectors (mathematical representations) are stored for visual matching. We do not use your photos for advertising.`,
  },
  {
    title: 'Location Data',
    body: `GPS coordinates are collected when you submit a report to tag the dog's location. Location is used for proximity-based search and matching. You can deny location permissions; reports will still work but without geographic context.`,
  },
  {
    title: 'Data Sharing',
    body: `Dog reports (breed, color, location, photo) are visible to all app users to facilitate reunification. Your name appears as the reporter. Your email and account details are never shared publicly. We may share anonymized, aggregated data with animal welfare organizations.`,
  },
  {
    title: 'Data Retention',
    body: `Account data is retained while your account is active. Dog reports remain in the database to maintain the community record. You can request deletion of your account and associated data by contacting us.`,
  },
  {
    title: 'Security',
    body: `We use Supabase with row-level security, encrypted connections (TLS), and API key authentication. However, no system is perfectly secure, and we cannot guarantee absolute security of your data.`,
  },
  {
    title: 'Contact',
    body: `For privacy concerns or data deletion requests, contact: privacy@pawtrace.in`,
  },
]

export default function PrivacyScreen() {
  const navigation = useNavigation()

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Icon name="back" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: June 2026</Text>
        <Text style={styles.intro}>
          PawTrace India ("we", "our") is committed to protecting your privacy.
          This policy explains what data we collect and how we use it.
        </Text>

        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <View style={{ height: spacing.huge }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgScreen },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: layout.headerPaddingTop, paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.lg, backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  headerTitle: { fontSize: fonts.md, fontWeight: fonts.bold, color: colors.text },
  content: { padding: layout.screenPadding },
  updated: { fontSize: fonts.xs, color: colors.textMuted, marginBottom: spacing.md },
  intro: { fontSize: fonts.base, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.xxl },
  section: { marginBottom: spacing.xxl },
  sectionTitle: { fontSize: fonts.md, fontWeight: fonts.bold, color: colors.text, marginBottom: spacing.sm },
  sectionBody: { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 22 },
})
