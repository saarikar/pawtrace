// ═══════════════════════════════════════════════════════════════════════
// PawTrace India — Design System v4
// Clean, professional light theme inspired by Drools.com
// Warm coral-red accent on white/light surfaces
// Large rounded cards, pill buttons, generous whitespace
// ═══════════════════════════════════════════════════════════════════════

export const colors = {
  // Primary — warm coral-red (lively, happy)
  primary:       '#E8453C',
  primaryDark:   '#C93830',
  primaryLight:  '#FF6B5E',
  primaryMuted:  '#E8453C15',
  primarySoft:   '#FFF0EF',

  // Secondary — deep navy (headers, trust)
  secondary:     '#0B3558',
  secondaryLight:'#1A4F7A',

  // Accent — warm amber/gold
  accent:        '#F5A623',
  accentDark:    '#D4900E',
  accentMuted:   '#F5A62320',
  accentSoft:    '#FFF8EC',

  // Tertiary — teal for success/positive
  teal:          '#22AA86',
  tealMuted:     '#22AA8618',
  tealSoft:      '#EEFAF6',

  // ── Light surfaces ──
  white:         '#FFFFFF',
  bgScreen:      '#F7F7F7',     // screen backgrounds
  bgCard:        '#FFFFFF',     // card backgrounds
  bgSection:     '#FAFAFA',     // alternate section bg
  bgInput:       '#F5F5F5',     // input fields

  // ── Text hierarchy ──
  text:          '#1A1A2E',     // primary text — near black
  textSecondary: '#6B7280',     // secondary
  textMuted:     '#9CA3AF',     // muted/placeholder
  textOnDark:    '#FFFFFF',     // on dark backgrounds
  textOnPrimary: '#FFFFFF',     // on primary color

  // ── Semantic ──
  success:       '#22AA86',
  successSoft:   '#EEFAF6',
  warning:       '#F5A623',
  warningSoft:   '#FFF8EC',
  danger:        '#E8453C',
  dangerSoft:    '#FFF0EF',
  info:          '#3B82F6',
  infoSoft:      '#EFF6FF',

  // Status
  statusSighted:   '#F5A623',
  statusRescuing:  '#E8453C',
  statusShelter:   '#3B82F6',
  statusReunited:  '#22AA86',

  // Borders
  border:        '#E5E7EB',
  borderLight:   '#F3F4F6',

  // Shadows
  shadowColor:   '#0B355815',

  // Overlay
  overlay:       'rgba(11, 53, 88, 0.5)',
}

export const fonts = {
  xxs:  9,
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  xxl:  32,
  hero: 40,

  regular:  '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
  black:    '800',
  heavy:    '900',
}

export const spacing = {
  xxs:  2,
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  huge: 48,
  giant:64,
}

export const radius = {
  xs:    6,
  sm:    10,
  md:    14,
  lg:    20,
  xl:    24,
  xxl:   30,
  pill:  999,
}

export const shadows = {
  sm: {
    shadowColor: '#0B3558',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#0B3558',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0B3558',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 8,
  },
  glow: {
    shadowColor: '#E8453C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
}

export const statusConfig = {
  sighted: {
    color: colors.statusSighted,
    bg: colors.warningSoft,
    label: 'Sighted',
    icon: 'pin',
  },
  being_rescued: {
    color: colors.statusRescuing,
    bg: colors.dangerSoft,
    label: 'Being Rescued',
    icon: 'ambulance',
  },
  in_shelter: {
    color: colors.statusShelter,
    bg: colors.infoSoft,
    label: 'In Shelter',
    icon: 'shelter',
  },
  reunited: {
    color: colors.statusReunited,
    bg: colors.successSoft,
    label: 'Reunited',
    icon: 'check',
  },
}

export const layout = {
  headerPaddingTop: 54,
  tabBarHeight: 68,
  screenPadding: 20,
}
