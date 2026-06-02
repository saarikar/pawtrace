import { StyleSheet } from 'react-native'
import { colors, fonts, spacing, radius, shadows } from '../../lib/theme'

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg },
  pressed: { opacity: 0.88, transform: [{ scale: 0.97 }] },

  // ── Type toggle ──
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.bgSection,
    borderRadius: radius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: colors.bgCard,
    ...shadows.sm,
  },
  typeBtnText: {
    fontSize: fonts.sm,
    fontWeight: fonts.semibold,
    color: colors.textMuted,
  },
  typeBtnTextActive: {
    color: colors.text,
    fontWeight: fonts.bold,
  },

  // ── Status ──
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusText: { fontSize: fonts.sm, fontWeight: fonts.semibold },

  // ── Photos ──
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  photoWrap: { position: 'relative' },
  photoThumb: { width: 78, height: 78, borderRadius: radius.md },
  removeBtn: {
    position: 'absolute', top: -4, right: -4, width: 22, height: 22,
    borderRadius: 11, backgroundColor: colors.danger,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.sm,
  },
  removeBtnText: { color: '#fff', fontSize: 11, fontWeight: fonts.bold },

  // ── Hero ──
  heroSection: { alignItems: 'center', paddingVertical: spacing.xxl },
  heroCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xl,
    borderWidth: 3, borderColor: colors.primary + '30',
  },
  heroTitle: { fontSize: fonts.lg, fontWeight: fonts.black, color: colors.text, textAlign: 'center' },
  heroSub: {
    fontSize: fonts.base, color: colors.textSecondary,
    marginTop: spacing.sm, textAlign: 'center', lineHeight: 22,
  },

  // ── Camera / Gallery buttons ──
  buttonRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  cameraBtn: {
    flex: 1, padding: spacing.xl, backgroundColor: colors.primary,
    borderRadius: radius.xl, alignItems: 'center',
    ...shadows.glow,
  },
  cameraBtnLabel: { color: '#fff', fontSize: fonts.base, fontWeight: fonts.bold, marginTop: 4 },
  cameraBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: fonts.xs, marginTop: 2 },
  galleryBtn: {
    flex: 1, padding: spacing.xl, backgroundColor: colors.bgCard,
    borderRadius: radius.xl, alignItems: 'center',
    borderWidth: 2, borderColor: colors.primary,
    ...shadows.sm,
  },
  galleryBtnLabel: { color: colors.primary, fontSize: fonts.base, fontWeight: fonts.bold, marginTop: 4 },
  galleryBtnSub: { color: colors.textSecondary, fontSize: fonts.xs, marginTop: 2 },

  // ── AI result ──
  aiResultRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  aiIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.success + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  aiLabel: { fontSize: fonts.xs, fontWeight: fonts.semibold, color: colors.success, letterSpacing: 0.3 },
  aiBreed: { fontSize: fonts.md, fontWeight: fonts.black, color: colors.text, marginTop: 1 },

  // ── Section labels ──
  sectionLabel: {
    fontSize: fonts.xs, fontWeight: fonts.bold, color: colors.textMuted,
    letterSpacing: 1, marginBottom: spacing.lg,
  },

  // ── Switch rows ──
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.md, paddingVertical: spacing.xs,
  },
  switchLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  switchLabel: { fontSize: fonts.base, fontWeight: fonts.medium, color: colors.text },

  // ── Location ──
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  locationIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.accent + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  locationLabel: { fontSize: fonts.xs, fontWeight: fonts.semibold, color: colors.accent, letterSpacing: 0.3 },
  locationValue: { fontSize: fonts.base, fontWeight: fonts.bold, color: colors.text, marginTop: 2 },
  locationLoading: { fontSize: fonts.sm, color: colors.textMuted, marginTop: 2 },
  locationGetBtn: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.accent + '40',
    marginTop: spacing.xs,
  },
  locationGetBtnText: { fontSize: fonts.sm, fontWeight: fonts.semibold, color: colors.accent },

  // ── Alert (lost pet) ──
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  alertIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  alertTitle: { fontWeight: fonts.bold, fontSize: fonts.base, color: colors.primary },
  alertSub: { fontSize: fonts.xs, color: colors.textSecondary, marginTop: 2 },

  // ── How it works ──
  howTitle: {
    fontSize: fonts.sm, fontWeight: fonts.bold, color: colors.textSecondary,
    letterSpacing: 0.5, marginBottom: spacing.lg,
  },
  howStep: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginBottom: spacing.lg, position: 'relative',
  },
  howIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  howStepTitle: { fontSize: fonts.base, fontWeight: fonts.semibold, color: colors.text },
  howStepSub: { fontSize: fonts.xs, color: colors.textMuted, marginTop: 1 },
  howConnector: {
    position: 'absolute', left: 19, top: 42, width: 2, height: 16,
    backgroundColor: colors.border,
  },

  // ── Center screens (success, analyzing, errors) ──
  centerWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: spacing.xxxl, backgroundColor: colors.bgScreen,
  },
  successCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: colors.successSoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xxl,
    borderWidth: 3, borderColor: colors.success + '30',
  },
  successTitle: {
    fontSize: fonts.xl, fontWeight: fonts.black, color: colors.text,
    textAlign: 'center', marginBottom: spacing.sm,
  },
  successSub: {
    fontSize: fonts.base, color: colors.textSecondary, lineHeight: 22,
    textAlign: 'center', maxWidth: 280, marginBottom: spacing.xxl,
  },
  successActions: { width: '100%', gap: spacing.sm },

  // ── Analyzing ──
  analyzePhotoRow: {
    flexDirection: 'row', gap: 6, flexWrap: 'wrap',
    justifyContent: 'center', marginBottom: spacing.xl,
  },
  analyzeThumb: { width: 64, height: 64, borderRadius: radius.md },
  pulseRing: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl,
  },
  analyzeTitle: { fontSize: fonts.lg, fontWeight: fonts.bold, color: colors.text },
  pipelineSteps: { marginTop: spacing.xl, gap: spacing.md },
  pipelineStep: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgCard, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.pill, ...shadows.sm,
  },
  pipelineText: { fontSize: fonts.sm, color: colors.textSecondary, fontWeight: fonts.medium },
})
