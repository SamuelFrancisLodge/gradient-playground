import type { OrbFilterIds, RandomFn } from '@/components/orb-field/types';

const DEFAULT_PASTEL_BLUES = [
	'#dff4ff',
	'#c4e9ff',
	'#a9ddff',
	'#8ed0ff',
	'#74c2ff',
	'#5ab2f2',
];

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function hashSeed(value: string): number {
	let hash = 1779033703 ^ value.length;

	for (let i = 0; i < value.length; i += 1) {
		hash = Math.imul(hash ^ value.charCodeAt(i), 3432918353);
		hash = (hash << 13) | (hash >>> 19);
	}

	hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
	hash = Math.imul(hash ^ (hash >>> 13), 3266489909);

	return (hash ^ (hash >>> 16)) >>> 0;
}

function createSeededRandom(seed: string): RandomFn {
	let state = hashSeed(seed);

	return () => {
		state += 0x6d2b79f5;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function getRandomizer(seed?: string | number): RandomFn {
	if (seed === undefined || seed === null || seed === '') {
		return Math.random;
	}

	return createSeededRandom(String(seed));
}

export function randomBetween(
	min: number,
	max: number,
	random: RandomFn,
): number {
	return min + random() * (max - min);
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
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

export function sanitizePalette(inputColors?: string[]): string[] {
	if (!inputColors || inputColors.length === 0) {
		return DEFAULT_PASTEL_BLUES;
	}

	const sanitized = inputColors
		.map((color) => color.trim())
		.filter((color) => HEX_COLOR_REGEX.test(color))
		.map(expandHex);

	return sanitized.length > 0 ? sanitized : DEFAULT_PASTEL_BLUES;
}

export function normalizeRatios(
	colorCount: number,
	inputRatios?: number[],
): number[] {
	if (!inputRatios || inputRatios.length !== colorCount) {
		return Array.from({ length: colorCount }, () => 1 / colorCount);
	}

	const cleaned = inputRatios.map((ratio) =>
		Number.isFinite(ratio) && ratio > 0 ? ratio : 0,
	);
	const total = cleaned.reduce((sum, ratio) => sum + ratio, 0);

	if (total <= 0) {
		return Array.from({ length: colorCount }, () => 1 / colorCount);
	}

	return cleaned.map((ratio) => ratio / total);
}

export function sanitizeHexColor(value: string, fallback: string): string {
	const trimmed = value.trim();
	if (!HEX_COLOR_REGEX.test(trimmed)) {
		return fallback;
	}

	return expandHex(trimmed);
}

export function buildColorPool(
	circleCount: number,
	palette: string[],
	ratios: number[],
	random: RandomFn,
): string[] {
	const expectedCounts = ratios.map((ratio) => ratio * circleCount);
	const counts = expectedCounts.map((value) => Math.floor(value));
	let missing = circleCount - counts.reduce((sum, count) => sum + count, 0);

	const byLargestFraction = expectedCounts
		.map((value, index) => ({
			index,
			fraction: value - Math.floor(value),
		}))
		.sort((a, b) => b.fraction - a.fraction);

	let fractionIndex = 0;
	while (missing > 0 && byLargestFraction.length > 0) {
		const target = byLargestFraction[fractionIndex % byLargestFraction.length];
		counts[target.index] += 1;
		missing -= 1;
		fractionIndex += 1;
	}

	const pool: string[] = [];
	counts.forEach((count, index) => {
		for (let i = 0; i < count; i += 1) {
			pool.push(palette[index]);
		}
	});

	while (pool.length < circleCount) {
		pool.push(palette[0]);
	}

	for (let i = pool.length - 1; i > 0; i -= 1) {
		const j = Math.floor(random() * (i + 1));
		const current = pool[i];
		pool[i] = pool[j];
		pool[j] = current;
	}

	return pool;
}

export function createFilterIds(cleanId: string): OrbFilterIds {
	return {
		blurFilterId: `${cleanId}-gaussian`,
		metaballFilterId: `${cleanId}-metaball`,
		glowFilterId: `${cleanId}-glow`,
		fineNoiseFilterId: `${cleanId}-noise-fine`,
		coarseNoiseFilterId: `${cleanId}-noise-coarse`,
		warpFilterId: `${cleanId}-warp`,
		bloomFilterId: `${cleanId}-bloom`,
		posterizeFilterId: `${cleanId}-posterize`,
		causticFilterId: `${cleanId}-caustic`,
		fringeFilterId: `${cleanId}-fringe`,
		hueRotateFilterId: `${cleanId}-hue-rotate`,
		sweepGradientId: `${cleanId}-sweep-gradient`,
		vignetteGradientId: `${cleanId}-vignette-gradient`,
		shapeGroupId: `${cleanId}-shape-group`,
	};
}
