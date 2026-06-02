import React from 'react'
import { View, Text, ScrollView, Pressable, Image, Switch } from 'react-native'
import { COLORS, SIZES, SEXES } from '../../lib/vision'
import { colors, fonts, spacing } from '../../lib/theme'
import Header from '../../components/Header'
import Card from '../../components/Card'
import Button from '../../components/Button'
import InputField from '../../components/InputField'
import ChipSelect from '../../components/ChipSelect'
import Badge from '../../components/Badge'
import Icon from '../../components/Icon'
import styles from './styles'

export default function ReviewStep({
  analysis, photos, form, setForm, loc, locLoading, fetchLocation,
  saving, saveError, onSubmit, onBack,
}) {
  if (analysis.error) return (
    <View style={styles.centerWrap}>
      <View style={[styles.successCircle, { backgroundColor: colors.dangerSoft, borderColor: colors.danger + '30' }]}>
        <Icon name="warning" size={48} color={colors.danger} />
      </View>
      <Text style={[styles.successTitle, { color: colors.danger }]}>Analysis failed</Text>
      <Text style={styles.successSub}>{analysis.error}</Text>
      <Button title="Try again" onPress={onBack} variant="primary" size="lg" />
    </View>
  )

  if (!analysis.is_dog) return (
    <View style={styles.centerWrap}>
      <View style={[styles.successCircle, { backgroundColor: colors.accentSoft, borderColor: colors.accent + '30' }]}>
        <Icon name="dog" size={48} color={colors.accent} />
      </View>
      <Text style={styles.successTitle}>No dog detected</Text>
      <Text style={styles.successSub}>Try uploading a clearer photo with a dog visible.</Text>
      <Button title="Try different photos" onPress={onBack} variant="primary" size="lg" />
    </View>
  )

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header
        title="Dog Details"
        subtitle="Confirm AI-detected info"
        back="Camera"
        onBack={onBack}
        variant="coral"
      />

      <View style={styles.content}>
        {/* AI result banner */}
        <Card variant="success">
          <View style={styles.aiResultRow}>
            <View style={styles.aiIconWrap}>
              <Icon name="ai" size={22} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiLabel}>AI Result</Text>
              <Text style={styles.aiBreed}>{analysis.breed}</Text>
            </View>
            <Badge
              label={`${analysis.breed_confidence}%`}
              color={colors.success}
              bg={colors.successSoft}
              size="md"
            />
          </View>
        </Card>

        {/* Photo previews */}
        {photos.length > 0 && (
          <View style={styles.photosGrid}>
            {photos.map((p, i) => (
              <View key={i} style={styles.photoWrap}>
                <Image source={{ uri: p.preview }} style={styles.photoThumb} />
              </View>
            ))}
          </View>
        )}

        {/* Dog details card */}
        <Card variant="elevated">
          <Text style={styles.sectionLabel}>FILL IN DETAILS</Text>

          <ChipSelect label="Colour" options={COLORS} value={form.color}
            onChange={v => setForm(f => ({ ...f, color: v }))} />
          <ChipSelect label="Size" options={SIZES} value={form.size}
            onChange={v => setForm(f => ({ ...f, size: v }))} />
          <ChipSelect label="Sex" options={SEXES} value={form.sex}
            onChange={v => setForm(f => ({ ...f, sex: v }))} />

          {/* Injury toggle */}
          <View style={styles.switchRow}>
            <View style={styles.switchLabelWrap}>
              <Icon name={form.injured ? 'bandage' : 'heart'} size={16} color={form.injured ? colors.danger : colors.success} />
              <Text style={[styles.switchLabel, form.injured && { color: colors.danger }]}>
                Mark as injured
              </Text>
            </View>
            <Switch
              value={form.injured}
              onValueChange={v => setForm(f => ({ ...f, injured: v }))}
              trackColor={{ false: colors.border, true: colors.danger + '80' }}
              thumbColor={form.injured ? colors.danger : colors.textMuted}
            />
          </View>
          {form.injured && (
            <InputField
              placeholder="Describe injury (e.g. limping, wound on leg)"
              value={form.injury_notes}
              onChangeText={v => setForm(f => ({ ...f, injury_notes: v }))}
              multiline
            />
          )}

          {/* Vaccination toggle */}
          <View style={styles.switchRow}>
            <View style={styles.switchLabelWrap}>
              <Icon name="vaccine" size={16} color={form.vaccinated ? colors.success : colors.textMuted} />
              <Text style={[styles.switchLabel, form.vaccinated && { color: colors.success }]}>
                Vaccinated
              </Text>
            </View>
            <Switch
              value={form.vaccinated}
              onValueChange={v => setForm(f => ({ ...f, vaccinated: v }))}
              trackColor={{ false: colors.border, true: colors.success + '80' }}
              thumbColor={form.vaccinated ? colors.success : colors.textMuted}
            />
          </View>
        </Card>

        {/* Location card */}
        <Card variant="warning">
          <View style={styles.locationRow}>
            <View style={styles.locationIconWrap}>
              <Icon name="pin" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationLabel}>Location</Text>
              {loc.lat ? (
                <Text style={styles.locationValue}>{loc.area}, {loc.city}</Text>
              ) : locLoading ? (
                <Text style={styles.locationLoading}>Getting GPS location...</Text>
              ) : (
                <Pressable onPress={fetchLocation} style={styles.locationGetBtn}>
                  <Text style={styles.locationGetBtnText}>Tap to get GPS location</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Card>

        {/* Reporter card */}
        <Card variant="elevated">
          <Text style={styles.sectionLabel}>YOUR INFO</Text>
          <InputField label="Your name" placeholder="Arun Kumar"
            value={form.reporter_name}
            onChangeText={v => setForm(f => ({ ...f, reporter_name: v }))} />
          <InputField label="Notes" placeholder="Any observations about the dog..."
            value={form.notes}
            onChangeText={v => setForm(f => ({ ...f, notes: v }))}
            multiline />
        </Card>

        {/* Error */}
        {saveError ? (
          <Card variant="danger">
            <Text style={{ color: colors.danger, fontSize: fonts.sm, fontWeight: fonts.medium }}>
              {saveError}
            </Text>
          </Card>
        ) : null}

        {/* Submit */}
        <Button
          title={saving ? 'Saving...' : 'Submit Report'}
          onPress={onSubmit}
          disabled={saving}
          loading={saving}
          variant="primary"
          size="lg"
        />

        <View style={{ height: spacing.huge }} />
      </View>
    </ScrollView>
  )
}
