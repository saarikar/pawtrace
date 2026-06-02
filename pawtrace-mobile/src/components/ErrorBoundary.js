import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors, fonts, spacing, radius } from '../lib/theme'

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Pressable style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      )
    }
    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgScreen || '#FDF8F4',
    padding: spacing.xxl,
  },
  icon: { fontSize: 48, marginBottom: spacing.lg },
  title: {
    fontSize: fonts.xl,
    fontWeight: fonts.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fonts.base,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  buttonText: {
    color: '#fff',
    fontSize: fonts.base,
    fontWeight: fonts.bold,
  },
})
