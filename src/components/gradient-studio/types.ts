import type { ShapeSelection } from '@/components/orb-gradient-field';

export const CUSTOM_PRESET_KEY = 'custom';

export type GlowBlendMode = 'screen' | 'overlay' | 'color-dodge' | 'soft-light';

export type PaletteSwatch = {
	id: string;
	hex: string;
	weight: number;
	enabled: boolean;
};

export type StudioSettings = {
	circleCount: number;
	minRadius: number;
	maxRadius: number;
	allowCrop: boolean;
	shapeSelections: ShapeSelection[];
	shapeSpeedMin: number;
	shapeSpeedMax: number;
	animate: boolean;
	animationSpeed: number;
	movementIntensity: number;
	scaleIntensity: number;
	blurEnabled: boolean;
	blurStdDeviation: number;
	glowEnabled: boolean;
	glowStdDeviation: number;
	glowIntensity: number;
	glowBlendMode: GlowBlendMode;
	noiseEnabled: boolean;
	noiseOpacity: number;
	noiseFrequency: number;
	coarseNoiseOpacity: number;
	coarseNoiseFrequency: number;
	warpEnabled: boolean;
	warpAmount: number;
	warpSpeed: number;
	warpBaseFrequency: number;
	metaballEnabled: boolean;
	metaballBlur: number;
	metaballThreshold: number;
	bloomEnabled: boolean;
	bloomThreshold: number;
	bloomRadius: number;
	bloomIntensity: number;
	posterizeEnabled: boolean;
	posterizeLevels: number;
	posterizeOpacity: number;
	causticEnabled: boolean;
	causticIntensity: number;
	causticScale: number;
	causticSpeed: number;
	depthEnabled: boolean;
	depthLayers: number;
	depthStrength: number;
	vignetteEnabled: boolean;
	vignetteAmount: number;
	vignetteColor: string;
	fringeEnabled: boolean;
	fringeAmount: number;
	sweepEnabled: boolean;
	sweepIntensity: number;
	sweepWidth: number;
	sweepSpeed: number;
	sweepAngle: number;
	paletteDriftEnabled: boolean;
	paletteDriftSpeed: number;
	hueRotateEnabled: boolean;
	hueRotateDegrees: number;
	hueRotateSpeed: number;
	seed: string;
	seedLocked: boolean;
	palette: PaletteSwatch[];
};

export type StudioPatch = Partial<Omit<StudioSettings, 'palette'>> & {
	palette?: PaletteSwatch[];
};

export type PresetDefinition = {
	key: string;
	label: string;
	description: string;
	patch: StudioPatch;
};

export type PresetGroupKey = 'style' | 'layout' | 'motion' | 'palette' | 'seed';

export type PresetCatalog = Record<PresetGroupKey, PresetDefinition[]>;

export type PresetSelectionState = Record<PresetGroupKey, string>;

export type EffectPresetKey =
	| 'blur'
	| 'glow'
	| 'noise'
	| 'warp'
	| 'metaball'
	| 'bloom'
	| 'posterize'
	| 'caustic'
	| 'depth'
	| 'fringe'
	| 'sweep'
	| 'vignette'
	| 'paletteDrift'
	| 'hueRotate';

export type EffectPresetCatalog = Record<EffectPresetKey, PresetDefinition[]>;

export type EffectPresetSelectionState = Record<EffectPresetKey, string>;

export type ShapeOption = {
	label: string;
	value: ShapeSelection;
	help: string;
};
