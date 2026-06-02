import React from 'react'
import { View, Text, Image, ActivityIndicator } from 'react-native'
import { colors } from '../../lib/theme'
import Icon from '../../components/Icon'
import styles from './styles'

export default function AnalyzingStep({ photos }) {
  return (
    <View style={styles.centerWrap}>
      <View style={styles.analyzePhotoRow}>
        {photos.slice(0, 5).map((p, i) => (
          <Image key={i} source={{ uri: p.preview }} style={styles.analyzeThumb} />
        ))}
      </View>
      <View style={styles.pulseRing}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
      <Text style={styles.analyzeTitle}>
        Analysing {photos.length} photo{photos.length !== 1 ? 's' : ''}
      </Text>
      <View style={styles.pipelineSteps}>
        {[
          { icon: 'target', label: 'Detecting dog' },
          { icon: 'breed', label: 'Classifying breed' },
          { icon: 'search', label: 'Matching features' },
        ].map((s, i) => (
          <View key={i} style={styles.pipelineStep}>
            <Icon name={s.icon} size={14} color={colors.textSecondary} />
            <Text style={styles.pipelineText}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
