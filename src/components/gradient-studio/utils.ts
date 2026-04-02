import type {
	PaletteSwatch,
	StudioPatch,
	StudioSettings,
} from '@/components/gradient-studio/types';

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const RANDOM_SWATCH_POOL = [
	'#ff7e5f',
	'#feb47b',
	'#7f7fd5',
	'#86a8e7',
	'#91eae4',
	'#1f8a70',
	'#bedb39',
	'#f2c94c',
	'#f2994a',
	'#eb5757',
	'#2d9cdb',
	'#56ccf2',
	'#6fcf97',
	'#9b51e0',
	'#f72585',
];

export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

export function createId(prefix: string): string {
	const randomPart =
		typeof crypto !== 'undefined' && 'randomUUID' in crypto
			? crypto.randomUUID().slice(0, 8)
			: Math.random().toString(36).slice(2, 10);
	return `${prefix}-${randomPart}`;
}

function expandHex(hex: string): string {
	if (hex.length === 4) {
		const r = hex[1];
		const g = hex[2];
		const b = hex[3];
		return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
	}
	return hex.toLowerCase();
}

export function sanitizeHex(input: string, fallback: string): string {
	const trimmed = input.trim();
	if (!HEX_COLOR_REGEX.test(trimmed)) {
		return fallback;
	}
	return expandHex(trimmed);
}

export function randomPaletteHex(): string {
	const pick =
		RANDOM_SWATCH_POOL[Math.floor(Math.random() * RANDOM_SWATCH_POOL.length)];
	return pick ?? '#86a8e7';
}

export function normalizePaletteWeights(
	palette: PaletteSwatch[],
): PaletteSwatch[] {
	if (palette.length === 0) {
		return [];
	}

	const safe = palette.map((swatch) => ({
		...swatch,
		weight: Number.isFinite(swatch.weight) ? Math.max(0.01, swatch.weight) : 1,
	}));
	const total = safe.reduce((sum, swatch) => sum + swatch.weight, 0);

	if (total <= 0) {
		const even = 1 / safe.length;
		return safe.map((swatch) => ({ ...swatch, weight: even }));
	}

	return safe.map((swatch) => ({
		...swatch,
		weight: swatch.weight / total,
	}));
}

export function ensureVisiblePalette(
	palette: PaletteSwatch[],
): PaletteSwatch[] {
	if (palette.length === 0) {
		return [];
	}

	if (palette.some((swatch) => swatch.enabled)) {
		return palette;
	}

	return palette.map((swatch, index) => ({
		...swatch,
		enabled: index === 0,
	}));
}

export function toOrbPalette(palette: PaletteSwatch[]): {
	colors: string[];
	ratios: number[];
} {
	const enabled = ensureVisiblePalette(palette).filter(
		(swatch) => swatch.enabled,
	);
	if (enabled.length === 0) {
		return {
			colors: ['#86a8e7'],
			ratios: [1],
		};
	}

	const normalized = normalizePaletteWeights(enabled);
	return {
		colors: normalized.map((swatch) => swatch.hex),
		ratios: normalized.map((swatch) => swatch.weight),
	};
}

export function patchSettings(
	previous: StudioSettings,
	patch: StudioPatch,
): StudioSettings {
	const merged: StudioSettings = {
		...previous,
		...patch,
		palette: patch.palette ? patch.palette : previous.palette,
	};

	const safeMinRadius = Math.min(merged.minRadius, merged.maxRadius - 8);
	const safeMaxRadius = Math.max(merged.maxRadius, safeMinRadius + 8);
	const safeCircleCount = Math.round(clamp(merged.circleCount, 10, 30));
	const safeShapeSpeedMin = Math.min(
		merged.shapeSpeedMin,
		merged.shapeSpeedMax,
	);
	const safeShapeSpeedMax = Math.max(merged.shapeSpeedMax, safeShapeSpeedMin);
	const safePalette = ensureVisiblePalette(
		normalizePaletteWeights(
			merged.palette.map((swatch) => ({
				...swatch,
				hex: sanitizeHex(swatch.hex, '#86a8e7'),
			})),
		),
	);

	return {
		...merged,
		circleCount: safeCircleCount,
		minRadius: safeMinRadius,
		maxRadius: safeMaxRadius,
		shapeSpeedMin: safeShapeSpeedMin,
		shapeSpeedMax: safeShapeSpeedMax,
		vignetteColor: sanitizeHex(merged.vignetteColor, '#040a16'),
		palette: safePalette,
	};
}

export function computeRenderLoadScore(settings: StudioSettings): {
	score: number;
	label: 'Light' | 'Balanced' | 'Heavy';
} {
	const enabledEffects = [
		settings.blurEnabled,
		settings.glowEnabled,
		settings.noiseEnabled,
		settings.warpEnabled,
		settings.metaballEnabled,
		settings.bloomEnabled,
		settings.posterizeEnabled,
		settings.causticEnabled,
		settings.depthEnabled,
		settings.vignetteEnabled,
		settings.fringeEnabled,
		settings.sweepEnabled,
		settings.paletteDriftEnabled,
		settings.hueRotateEnabled,
	].filter(Boolean).length;

	const score =
		settings.circleCount +
		enabledEffects * 7 +
		settings.depthLayers * 2 +
		(settings.animate ? 10 : 0) +
		(settings.warpEnabled ? 10 : 0) +
		(settings.metaballEnabled ? 12 : 0) +
		(settings.bloomEnabled ? 6 : 0) +
		(settings.causticEnabled ? 8 : 0) +
		(settings.posterizeEnabled ? 4 : 0) +
		(settings.hueRotateEnabled ? 5 : 0);

	if (score < 100) {
		return { score, label: 'Light' };
	}

	if (score < 150) {
		return { score, label: 'Balanced' };
	}

	return { score, label: 'Heavy' };
}
