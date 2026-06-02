import React from 'react'
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons'
import { colors } from '../lib/theme'

// Centralized icon mapping — clean vector icons replacing emojis
const ICON_MAP = {
  // Navigation
  home:        { set: 'Ionicons', name: 'home-outline', filled: 'home' },
  search:      { set: 'Ionicons', name: 'search-outline', filled: 'search' },
  camera:      { set: 'Ionicons', name: 'camera-outline', filled: 'camera' },
  stats:       { set: 'Ionicons', name: 'bar-chart-outline', filled: 'bar-chart' },
  profile:     { set: 'Ionicons', name: 'person-outline', filled: 'person' },

  // Actions
  scan:        { set: 'MaterialCommunityIcons', name: 'line-scan' },
  report:      { set: 'Ionicons', name: 'document-text-outline' },
  gallery:     { set: 'Ionicons', name: 'images-outline' },
  share:       { set: 'Ionicons', name: 'share-social-outline' },
  back:        { set: 'Ionicons', name: 'chevron-back' },
  close:       { set: 'Ionicons', name: 'close' },
  add:         { set: 'Ionicons', name: 'add' },
  arrow:       { set: 'Ionicons', name: 'arrow-forward' },
  filter:      { set: 'Ionicons', name: 'options-outline' },
  delete:      { set: 'Ionicons', name: 'trash-outline' },
  edit:        { set: 'Feather', name: 'edit-2' },
  logout:      { set: 'Ionicons', name: 'log-out-outline' },
  call:        { set: 'Ionicons', name: 'call-outline' },

  // Dog / Pet
  paw:         { set: 'MaterialCommunityIcons', name: 'paw' },
  dog:         { set: 'MaterialCommunityIcons', name: 'dog' },
  passport:    { set: 'Ionicons', name: 'card-outline' },
  qr:          { set: 'Ionicons', name: 'qr-code-outline' },

  // Status
  pin:         { set: 'Ionicons', name: 'location-outline', filled: 'location' },
  clock:       { set: 'Ionicons', name: 'time-outline' },
  ambulance:   { set: 'MaterialCommunityIcons', name: 'ambulance' },
  shelter:     { set: 'Ionicons', name: 'home-outline' },
  check:       { set: 'Ionicons', name: 'checkmark-circle-outline', filled: 'checkmark-circle' },
  alert:       { set: 'Ionicons', name: 'alert-circle-outline' },
  warning:     { set: 'Ionicons', name: 'warning-outline' },

  // Health
  vaccine:     { set: 'MaterialCommunityIcons', name: 'needle' },
  heart:       { set: 'Ionicons', name: 'heart-outline', filled: 'heart' },
  medical:     { set: 'Ionicons', name: 'medkit-outline' },
  bandage:     { set: 'MaterialCommunityIcons', name: 'bandage' },

  // Info
  ai:          { set: 'MaterialCommunityIcons', name: 'robot-outline' },
  breed:       { set: 'MaterialCommunityIcons', name: 'dna' },
  color:       { set: 'Ionicons', name: 'color-palette-outline' },
  size:        { set: 'MaterialCommunityIcons', name: 'ruler' },
  gender:      { set: 'MaterialCommunityIcons', name: 'gender-male-female' },
  age:         { set: 'MaterialCommunityIcons', name: 'cake-variant-outline' },
  notes:       { set: 'Ionicons', name: 'document-text-outline' },
  distance:    { set: 'MaterialCommunityIcons', name: 'map-marker-distance' },

  // Misc
  notification:{ set: 'Ionicons', name: 'notifications-outline' },
  info:        { set: 'Ionicons', name: 'information-circle-outline' },
  star:        { set: 'Ionicons', name: 'star-outline', filled: 'star' },
  eye:         { set: 'Ionicons', name: 'eye-outline' },
  map:         { set: 'Ionicons', name: 'map-outline' },
  globe:       { set: 'Ionicons', name: 'globe-outline' },
  mail:        { set: 'Ionicons', name: 'mail-outline' },
  database:    { set: 'MaterialCommunityIcons', name: 'database-outline' },
  target:      { set: 'Ionicons', name: 'scan-outline' },
  layers:      { set: 'Ionicons', name: 'layers-outline' },
  phone:       { set: 'Ionicons', name: 'call-outline' },
}

const SETS = { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 }

export default function Icon({ name, size = 20, color = colors.textSecondary, filled = false, style }) {
  const config = ICON_MAP[name]
  if (!config) return null

  const iconName = filled && config.filled ? config.filled : config.name
  const Component = SETS[config.set]
  if (!Component) return null

  return <Component name={iconName} size={size} color={color} style={style} />
}

// Tab bar icons
export function TabIcon({ name, focused, size = 22 }) {
  const config = ICON_MAP[name]
  if (!config) return null
  const iconName = focused && config.filled ? config.filled : config.name
  const Component = SETS[config.set]
  return <Component name={iconName} size={size} color={focused ? colors.primary : colors.textMuted} />
}
