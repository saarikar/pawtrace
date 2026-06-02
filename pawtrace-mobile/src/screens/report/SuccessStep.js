import React from 'react'
import { View, Text } from 'react-native'
import { colors } from '../../lib/theme'
import Button from '../../components/Button'
import Icon from '../../components/Icon'
import styles from './styles'

export default function SuccessStep({ reportType, onReset, onGoBack }) {
  return (
    <View style={styles.centerWrap}>
      <View style={styles.successCircle}>
        <Icon name={reportType === 'lost_pet' ? 'search' : 'check'} size={48} color={reportType === 'lost_pet' ? colors.primary : colors.success} />
      </View>
      <Text style={styles.successTitle}>
        {reportType === 'lost_pet' ? 'Lost pet report filed!' : 'Dog added successfully!'}
      </Text>
      <Text style={styles.successSub}>
        {reportType === 'lost_pet'
          ? 'Your report is now visible to rescuers in your area.'
          : 'Saved to directory and feature database for matching.'}
      </Text>
      <View style={styles.successActions}>
        <Button title="Report another" onPress={onReset} variant="primary" size="lg" />
        <Button title="Back to feed" onPress={onGoBack} variant="ghost" />
      </View>
    </View>
  )
}
