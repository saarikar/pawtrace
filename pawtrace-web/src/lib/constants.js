// Shared constants — PawTrace India Design System v4 (matching mobile)

// ── Brand colors (coral-red + navy) ───────────────────────────────────
export const PRIMARY       = '#E8453C'        // warm coral-red (lively, happy)
export const PRIMARY_DARK  = '#C93830'
export const PRIMARY_LIGHT = '#FF6B5E'
export const PRIMARY_SOFT  = '#FFF0EF'

export const SECONDARY     = '#0B3558'        // deep navy (headers, trust)
export const SECONDARY_LT  = '#1A4F7A'

export const ACCENT        = '#F5A623'        // warm amber/gold
export const ACCENT_DARK   = '#D4900E'
export const ACCENT_SOFT   = '#FFF8EC'

export const TEAL          = '#22AA86'        // success/positive
export const TEAL_SOFT     = '#EEFAF6'

// ── Light surfaces ──
export const WHITE         = '#FFFFFF'
export const BG_SCREEN     = '#F7F7F7'
export const BG_CARD       = '#FFFFFF'
export const BG_SECTION    = '#FAFAFA'
export const BG_INPUT      = '#F5F5F5'

// ── Text hierarchy ──
export const TEXT          = '#1A1A2E'        // primary text
export const TEXT_SECONDARY= '#6B7280'        // secondary
export const TEXT_MUTED    = '#9CA3AF'        // muted/placeholder
export const TEXT_LIGHT    = '#FFFFFF'        // on dark backgrounds

// ── Semantic ──
export const SUCCESS       = '#22AA86'
export const SUCCESS_SOFT  = '#EEFAF6'
export const WARNING       = '#F5A623'
export const WARNING_SOFT  = '#FFF8EC'
export const DANGER        = '#E8453C'
export const DANGER_SOFT   = '#FFF0EF'
export const INFO          = '#3B82F6'
export const INFO_SOFT     = '#EFF6FF'

// ── Status colors ──
export const STATUS_SIGHTED   = '#F5A623'
export const STATUS_RESCUING  = '#E8453C'
export const STATUS_SHELTER   = '#3B82F6'
export const STATUS_REUNITED  = '#22AA86'

// ── Borders ──
export const BORDER        = '#E5E7EB'
export const BORDER_LIGHT  = '#F3F4F6'

// Legacy aliases (for backwards compatibility)
export const ORANGE      = PRIMARY
export const DARK_ORANGE = PRIMARY_DARK
export const NAVY        = SECONDARY
export const LIGHT_NAVY  = SECONDARY_LT
export const BG          = BG_SCREEN
export const GRAY        = TEXT_SECONDARY
export const LIGHT_GRAY  = BORDER_LIGHT
export const GREEN       = SUCCESS
export const RED         = DANGER
export const AMBER       = ACCENT

// ── Cities ──────────────────────────────────────────────────────────────
export const CITIES = [
  'Chennai', 'Bengaluru', 'Mumbai', 'Delhi',
  'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad',
]

// ── Dog status options ──────────────────────────────────────────────────
export const STATUSES = ['sighted', 'being_rescued', 'in_shelter', 'reunited']

// ── Report types ────────────────────────────────────────────────────────
export const REPORT_TYPES = ['stray', 'lost_pet']

// ── Spacing (design system scale) ────────────────────────────────────────
export const SPACING = {
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  xxl:   24,
  xxxl:  32,
  huge:  48,
}

// ── Border radius ────────────────────────────────────────────────────────
export const RADIUS = {
  xs:    6,
  sm:    10,
  md:    14,
  lg:    20,
  xl:    24,
  xxl:   30,
  pill:  999,
}

// ── Typography ──────────────────────────────────────────────────────────
export const FONT_SIZE = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  xxl:  32,
  hero: 40,
}

export const FONT_WEIGHT = {
  regular:  400,
  medium:   500,
  semibold: 600,
  bold:     700,
  black:    800,
}

// ── Shadow utilities ────────────────────────────────────────────────────
export const SHADOW = {
  sm:  '0 2px 8px rgba(11, 53, 88, 0.06)',
  md:  '0 4px 16px rgba(11, 53, 88, 0.08)',
  lg:  '0 10px 30px rgba(11, 53, 88, 0.1)',
  glow:'0 4px 12px rgba(232, 69, 60, 0.25)',
}

// ── Status display config ────────────────────────────────────────────────
export const STATUS_LABELS = {
  sighted: 'Sighted',
  being_rescued: 'Being Rescued',
  in_shelter: 'In Shelter',
  reunited: 'Reunited',
}

export const STATUS_COLORS = {
  sighted: ACCENT,
  being_rescued: PRIMARY,
  in_shelter: SECONDARY,
  reunited: SUCCESS,
}
