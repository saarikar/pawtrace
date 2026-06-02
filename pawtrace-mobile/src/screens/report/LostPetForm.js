import React from 'react'
import { View, Text, ScrollView, Pressable, Image } from 'react-native'
import { SIZES, SEXES } from '../../lib/vision'
import { colors, fonts, spacing } from '../../lib/theme'
import Header from '../../components/Header'
import Card from '../../components/Card'
import Button from '../../components/Button'
import InputField from '../../components/InputField'
import ChipSelect from '../../components/ChipSelect'
import Icon from '../../components/Icon'
import styles from './styles'

export default function LostPetForm({
  photos, lostForm, setLostForm, saving, saveError,
  onSubmit, onBack, takePhoto, pickPhotos, removePhoto,
}) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header
        title="Report a Lost Pet"
        subtitle="Help us find your furry friend"
        back="Back"
        onBack={onBack}
        variant="coral"
      />

      <View style={styles.content}>
        {/* Lost pet info alert */}
        <Card variant="accent">
          <View style={styles.alertRow}>
            <View style={styles.alertIconWrap}>
              <Icon name="search" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>We will help you search</Text>
              <Text style={styles.alertSub}>
                Fill in details so rescuers can identify your pet
              </Text>
            </View>
          </View>
        </Card>

        {/* Photo upload section */}
        <Card variant="elevated">
          <Text style={styles.sectionLabel}>PET PHOTOS</Text>
          {photos.length > 0 && (
            <View style={styles.photosGrid}>
              {photos.map((p, i) => (
                <View key={i} style={styles.photoWrap}>
                  <Image source={{ uri: p.preview }} style={styles.photoThumb} />
                  <Pressable onPress={() => removePhoto(i)} style={styles.removeBtn}>
                    <Icon name="close" size={11} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          <View style={styles.buttonRow}>
            <Pressable onPress={takePhoto} style={({ pressed }) => [styles.cameraBtn, pressed && styles.pressed]}>
              <Icon name="camera" size={24} color={colors.white} />
              <Text style={styles.cameraBtnLabel}>Camera</Text>
            </Pressable>
            <Pressable onPress={pickPhotos} style={({ pressed }) => [styles.galleryBtn, pressed && styles.pressed]}>
              <Icon name="gallery" size={24} color={colors.primary} />
              <Text style={styles.galleryBtnLabel}>Gallery</Text>
            </Pressable>
          </View>
        </Card>

        {/* Pet details card */}
        <Card variant="elevated">
          <Text style={styles.sectionLabel}>PET DETAILS</Text>
          <InputField label="Pet name" placeholder="e.g. Bruno"
            value={lostForm.pet_name}
            onChangeText={v => setLostForm(f => ({ ...f, pet_name: v }))} />
          <InputField label="Breed" placeholder="e.g. Labrador"
            value={lostForm.breed}
            onChangeText={v => setLostForm(f => ({ ...f, breed: v }))} />
          <ChipSelect label="Size" options={SIZES} value={lostForm.size}
            onChange={v => setLostForm(f => ({ ...f, size: v }))} />
          <ChipSelect label="Sex" options={SEXES} value={lostForm.sex}
            onChange={v => setLostForm(f => ({ ...f, sex: v }))} />
        </Card>

        {/* Owner info card */}
        <Card variant="elevated">
          <Text style={styles.sectionLabel}>OWNER INFO</Text>
          <InputField label="Your name" placeholder="Riya Sharma"
            value={lostForm.reporter_name}
            onChangeText={v => setLostForm(f => ({ ...f, reporter_name: v }))} />
          <InputField label="Phone number" placeholder="98765 43210"
            value={lostForm.owner_phone}
            onChangeText={v => setLostForm(f => ({ ...f, owner_phone: v }))}
            keyboardType="phone-pad" />
          <InputField label="Notes" placeholder="Collar, markings, last seen location..."
            value={lostForm.notes}
            onChangeText={v => setLostForm(f => ({ ...f, notes: v }))}
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
          title={saving ? 'Filing report...' : 'File Lost Pet Report'}
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
