import React from 'react'
import { View, Text, ScrollView, Pressable, Image } from 'react-native'
import { colors, spacing } from '../../lib/theme'
import Header from '../../components/Header'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import Icon from '../../components/Icon'
import styles from './styles'

export default function CaptureStep({
  reportType, setReportType, backend, photos,
  takePhoto, pickPhotos, removePhoto, onAnalyse,
}) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header title="Report a Dog" subtitle="Photos  →  AI analysis  →  Save" variant="coral" />

      <View style={styles.content}>
        {/* Report type toggle */}
        <View style={styles.typeToggle}>
          {[
            { key: 'stray', icon: 'dog', label: 'Stray Dog' },
            { key: 'lost_pet', icon: 'search', label: 'Lost Pet' },
          ].map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setReportType(item.key)}
              style={[styles.typeBtn, reportType === item.key && styles.typeBtnActive]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name={item.icon} size={14} color={reportType === item.key ? colors.text : colors.textMuted} />
                <Text style={[styles.typeBtnText, reportType === item.key && styles.typeBtnTextActive]}>
                  {item.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Backend status */}
        <Card variant={backend?.online ? 'success' : backend === null ? 'flat' : 'danger'}>
          <View style={styles.statusRow}>
            <Icon name={backend?.online ? 'check' : backend === null ? 'clock' : 'close'} size={16} color={backend?.online ? colors.success : backend === null ? colors.textMuted : colors.danger} />
            <Text style={[styles.statusText, {
              color: backend?.online ? colors.success : backend === null ? colors.textMuted : colors.danger,
            }]}>
              {backend === null
                ? 'Checking AI backend...'
                : backend?.online
                  ? `AI online · ${backend.dogs_in_db} dogs in database`
                  : 'AI backend offline'}
            </Text>
          </View>
        </Card>

        {/* Photos */}
        {photos.length > 0 && (
          <View style={styles.photosGrid}>
            {photos.map((p, i) => (
              <View key={i} style={styles.photoWrap}>
                <Image source={{ uri: p.preview }} style={styles.photoThumb} />
                <Pressable onPress={() => removePhoto(i)} style={styles.removeBtn}>
                  <Icon name="close" size={11} color="#fff" />
                </Pressable>
                <Badge label={`#${i + 1}`} color="#fff" bg="rgba(0,0,0,0.5)" size="xs"
                  style={{ position: 'absolute', bottom: 4, left: 4 }} />
              </View>
            ))}
          </View>
        )}

        {/* No photos — Hero */}
        {photos.length === 0 && (
          <View style={styles.heroSection}>
            <View style={styles.heroCircle}>
              <Icon name="camera" size={56} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Take or upload dog photos</Text>
            <Text style={styles.heroSub}>
              Our AI will detect and classify the breed{'\n'}from clear, well-lit photos
            </Text>
          </View>
        )}

        {/* Camera / gallery buttons */}
        <View style={styles.buttonRow}>
          <Pressable onPress={takePhoto} style={({ pressed }) => [styles.cameraBtn, pressed && styles.pressed]}>
            <Icon name="camera" size={32} color={colors.white} />
            <Text style={styles.cameraBtnLabel}>Camera</Text>
            <Text style={styles.cameraBtnSub}>Take photo</Text>
          </Pressable>
          <Pressable onPress={pickPhotos} style={({ pressed }) => [styles.galleryBtn, pressed && styles.pressed]}>
            <Icon name="gallery" size={32} color={colors.primary} />
            <Text style={styles.galleryBtnLabel}>Gallery</Text>
            <Text style={styles.galleryBtnSub}>Pick existing</Text>
          </Pressable>
        </View>

        {/* Analyze button */}
        {photos.length > 0 && (
          <Button
            title={backend?.online
              ? `Analyse ${photos.length} photo${photos.length !== 1 ? 's' : ''}`
              : 'Backend offline'}
            onPress={onAnalyse}
            disabled={!backend?.online}
            variant="secondary"
            size="lg"
          />
        )}

        {/* How it works (when idle with no photos) */}
        {photos.length === 0 && (
          <Card variant="flat" style={{ marginTop: spacing.lg }}>
            <Text style={styles.howTitle}>How reporting works</Text>
            {[
              { icon: 'camera', title: 'Take photos', sub: 'Snap 1-5 clear photos of the dog' },
              { icon: 'ai', title: 'AI analyses', sub: 'Breed detection via YOLO + MobileNetV2' },
              { icon: 'report', title: 'Review & submit', sub: 'Confirm details and save to database' },
            ].map((item, i) => (
              <View key={i} style={styles.howStep}>
                <View style={styles.howIcon}><Icon name={item.icon} size={20} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.howStepTitle}>{item.title}</Text>
                  <Text style={styles.howStepSub}>{item.sub}</Text>
                </View>
                {i < 2 && <View style={styles.howConnector} />}
              </View>
            ))}
          </Card>
        )}

        <View style={{ height: spacing.huge }} />
      </View>
    </ScrollView>
  )
}
