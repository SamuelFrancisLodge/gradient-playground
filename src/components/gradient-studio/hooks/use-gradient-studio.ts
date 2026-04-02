import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	DEFAULT_EFFECT_PRESET_SELECTIONS,
	DEFAULT_PRESET_SELECTIONS,
	DEFAULT_STUDIO_SETTINGS,
	EFFECT_PRESET_CATALOG,
	PRESET_CATALOG,
	SHAPE_OPTIONS,
} from '@/components/gradient-studio/constants';
import { CUSTOM_PRESET_KEY } from '@/components/gradient-studio/types';
import type {
	EffectPresetSelectionState,
	EffectPresetKey,
	PaletteSwatch,
	PresetSelectionState,
	PresetGroupKey,
	StudioPatch,
	StudioSettings,
} from '@/components/gradient-studio/types';
import {
	computeRenderLoadScore,
	createId,
	patchSettings,
	randomPaletteHex,
	toOrbPalette,
} from '@/components/gradient-studio/utils';
import type { ShapeSelection } from '@/components/orb-gradient-field';

const PRESET_APPLY_ORDER: PresetGroupKey[] = [
	'style',
	'layout',
	'motion',
	'palette',
	'seed',
];

const EFFECT_PRESET_APPLY_ORDER: EffectPresetKey[] = [
	'blur',
	'glow',
	'noise',
	'warp',
	'metaball',
	'bloom',
	'posterize',
	'caustic',
	'depth',
	'fringe',
	'sweep',
	'vignette',
	'paletteDrift',
	'hueRotate',
];

const PRESET_GROUP_SETTING_KEYS: Record<
	PresetGroupKey,
	Array<keyof StudioSettings>
> = {
	style: (
		Object.keys(DEFAULT_STUDIO_SETTINGS) as Array<keyof StudioSettings>
	).filter(
		(key) => key !== 'palette' && key !== 'seed' && key !== 'seedLocked',
	),
	layout: [
		'circleCount',
		'minRadius',
		'maxRadius',
		'allowCrop',
		'shapeSelections',
	],
	motion: [
		'animate',
		'animationSpeed',
		'movementIntensity',
		'scaleIntensity',
		'shapeSpeedMin',
		'shapeSpeedMax',
	],
	palette: ['palette'],
	seed: ['seed', 'seedLocked'],
};

const EFFECT_SETTING_KEYS: Record<
	EffectPresetKey,
	Array<keyof StudioSettings>
> = {
	blur: ['blurEnabled', 'blurStdDeviation'],
	glow: ['glowEnabled', 'glowStdDeviation', 'glowIntensity', 'glowBlendMode'],
	noise: [
		'noiseEnabled',
		'noiseOpacity',
		'noiseFrequency',
		'coarseNoiseOpacity',
		'coarseNoiseFrequency',
	],
	warp: ['warpEnabled', 'warpAmount', 'warpSpeed', 'warpBaseFrequency'],
	metaball: ['metaballEnabled', 'metaballBlur', 'metaballThreshold'],
	bloom: ['bloomEnabled', 'bloomThreshold', 'bloomRadius', 'bloomIntensity'],
	posterize: ['posterizeEnabled', 'posterizeLevels', 'posterizeOpacity'],
	caustic: [
		'causticEnabled',
		'causticIntensity',
		'causticScale',
		'causticSpeed',
	],
	depth: ['depthEnabled', 'depthLayers', 'depthStrength'],
	fringe: ['fringeEnabled', 'fringeAmount'],
	sweep: [
		'sweepEnabled',
		'sweepIntensity',
		'sweepWidth',
		'sweepSpeed',
		'sweepAngle',
	],
	vignette: ['vignetteEnabled', 'vignetteAmount', 'vignetteColor'],
	paletteDrift: ['paletteDriftEnabled', 'paletteDriftSpeed'],
	hueRotate: ['hueRotateEnabled', 'hueRotateDegrees', 'hueRotateSpeed'],
};

const CUSTOM_PRESETS_STORAGE_KEY = 'gradient-studio.custom-presets.v1';
const CUSTOM_EFFECT_PRESETS_STORAGE_KEY =
	'gradient-studio.custom-effect-presets.v1';

function canUseLocalStorage(): boolean {
	return (
		typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
	);
}

function safeStorageGet(key: string): string | null {
	if (!canUseLocalStorage()) {
		return null;
	}

	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
}

function safeStorageSet(key: string, value: string): void {
	if (!canUseLocalStorage()) {
		return;
	}

	try {
		window.localStorage.setItem(key, value);
	} catch {
		return;
	}
}

function parseStoredValue(raw: string | null): unknown {
	if (!raw) {
		return null;
	}

	try {
		return JSON.parse(raw) as unknown;
	} catch {
		return null;
	}
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function clonePatchValue(key: keyof StudioSettings, value: unknown): unknown {
	if (key === 'palette' && Array.isArray(value)) {
		return value.map((swatch) => ({ ...swatch }));
	}

	if (key === 'shapeSelections' && Array.isArray(value)) {
		return [...value];
	}

	return value;
}

function buildPatchFromSettings(
	settings: StudioSettings,
	keys: Array<keyof StudioSettings>,
): StudioPatch {
	const patch: StudioPatch = {};

	for (const key of keys) {
		const value = clonePatchValue(key, settings[key]);
		if (key === 'palette') {
			patch.palette = value as PaletteSwatch[];
			continue;
		}

		(patch as Record<string, unknown>)[key] = value;
	}

	return patch;
}

function createInitialCustomPresets(
	settings: StudioSettings,
): Record<PresetGroupKey, StudioPatch> {
	return {
		style: buildPatchFromSettings(settings, PRESET_GROUP_SETTING_KEYS.style),
		layout: buildPatchFromSettings(settings, PRESET_GROUP_SETTING_KEYS.layout),
		motion: buildPatchFromSettings(settings, PRESET_GROUP_SETTING_KEYS.motion),
		palette: buildPatchFromSettings(
			settings,
			PRESET_GROUP_SETTING_KEYS.palette,
		),
		seed: buildPatchFromSettings(settings, PRESET_GROUP_SETTING_KEYS.seed),
	};
}

function createInitialCustomEffectPresets(
	settings: StudioSettings,
): Record<EffectPresetKey, StudioPatch> {
	return {
		blur: buildPatchFromSettings(settings, EFFECT_SETTING_KEYS.blur),
		glow: buildPatchFromSettings(settings, EFFECT_SETTING_KEYS.glow),
		noise: buildPatchFromSettings(settings, EFFECT_SETTING_KEYS.noise),
		warp: buildPatchFromSettings(settings, EFFECT_SETTING_KEYS.warp),
		metaball: buildPatchFromSettings(settings, EFFECT_SETTING_KEYS.metaball),
		bloom: buildPatchFromSettings(settings, EFFECT_SETTING_KEYS.bloom),
		posterize: buildPatchFromSettings(settings, EFFECT_SETTING_KEYS.posterize),
		caustic: buildPatchFromSettings(settings, EFFECT_SETTING_KEYS.caustic),
		depth: buildPatchFromSettings(settings, EFFECT_SETTING_KEYS.depth),
		fringe: buildPatchFromSettings(settings, EFFECT_SETTING_KEYS.fringe),
		sweep: buildPatchFromSettings(settings, EFFECT_SETTING_KEYS.sweep),
		vignette: buildPatchFromSettings(settings, EFFECT_SETTING_KEYS.vignette),
		paletteDrift: buildPatchFromSettings(
			settings,
			EFFECT_SETTING_KEYS.paletteDrift,
		),
		hueRotate: buildPatchFromSettings(settings, EFFECT_SETTING_KEYS.hueRotate),
	};
}

function mergePatch(
	previousPatch: StudioPatch,
	incomingPatch: StudioPatch,
	allowedKeys: Array<keyof StudioSettings>,
): StudioPatch {
	const merged: StudioPatch = { ...previousPatch };

	for (const key of allowedKeys) {
		if (!Object.prototype.hasOwnProperty.call(incomingPatch, key)) {
			continue;
		}

		if (key === 'palette') {
			const palette = incomingPatch.palette;
			if (palette) {
				merged.palette = palette.map((swatch) => ({ ...swatch }));
			}
			continue;
		}

		const value = (incomingPatch as Record<string, unknown>)[key];
		if (value === undefined) {
			continue;
		}

		(merged as Record<string, unknown>)[key] = clonePatchValue(key, value);
	}

	return merged;
}

function hydrateCustomPresets(
	defaults: Record<PresetGroupKey, StudioPatch>,
): Record<PresetGroupKey, StudioPatch> {
	const parsed = parseStoredValue(safeStorageGet(CUSTOM_PRESETS_STORAGE_KEY));
	if (!isObjectRecord(parsed)) {
		return defaults;
	}

	const next = { ...defaults };
	for (const group of PRESET_APPLY_ORDER) {
		const candidate = parsed[group];
		if (!isObjectRecord(candidate)) {
			continue;
		}

		next[group] = mergePatch(
			defaults[group],
			candidate as StudioPatch,
			PRESET_GROUP_SETTING_KEYS[group],
		);
	}

	return next;
}

function hydrateCustomEffectPresets(
	defaults: Record<EffectPresetKey, StudioPatch>,
): Record<EffectPresetKey, StudioPatch> {
	const parsed = parseStoredValue(
		safeStorageGet(CUSTOM_EFFECT_PRESETS_STORAGE_KEY),
	);
	if (!isObjectRecord(parsed)) {
		return defaults;
	}

	const next = { ...defaults };
	for (const effect of EFFECT_PRESET_APPLY_ORDER) {
		const candidate = parsed[effect];
		if (!isObjectRecord(candidate)) {
			continue;
		}

		next[effect] = mergePatch(
			defaults[effect],
			candidate as StudioPatch,
			EFFECT_SETTING_KEYS[effect],
		);
	}

	return next;
}

function findPresetPatch(
	group: PresetGroupKey,
	key: string,
): StudioPatch | null {
	const preset = PRESET_CATALOG[group].find((entry) => entry.key === key);
	return preset ? preset.patch : null;
}

function findEffectPresetPatch(
	effect: EffectPresetKey,
	key: string,
): StudioPatch | null {
	const preset = EFFECT_PRESET_CATALOG[effect].find(
		(entry) => entry.key === key,
	);
	return preset ? preset.patch : null;
}

const WEIGHT_EPSILON = 0.000001;

function clampWeight(value: number): number {
	return Math.min(1, Math.max(0, value));
}

function rebalanceUnlockedWeights(palette: PaletteSwatch[]): {
	palette: PaletteSwatch[] | null;
	message?: string;
} {
	const lockedSum = palette.reduce(
		(sum, swatch) => sum + (swatch.locked ? swatch.weight : 0),
		0,
	);

	if (lockedSum > 1 + WEIGHT_EPSILON) {
		return {
			palette: null,
			message:
				'Locked ratios exceed 100%. Unlock a color or reduce locked ratios.',
		};
	}

	const unlockedIndexes = palette
		.map((swatch, index) => ({ swatch, index }))
		.filter(({ swatch }) => !swatch.locked)
		.map(({ index }) => index);

	if (unlockedIndexes.length === 0) {
		return {
			palette: palette.map((swatch) => ({ ...swatch })),
			message: 'All ratios are locked. Unlock one color to rebalance.',
		};
	}

	const remaining = Math.max(0, 1 - lockedSum);
	const even = remaining / unlockedIndexes.length;
	const next = palette.map((swatch, index) =>
		unlockedIndexes.includes(index)
			? { ...swatch, weight: even }
			: { ...swatch },
	);

	if (remaining <= WEIGHT_EPSILON) {
		return {
			palette: next,
			message:
				'Locked ratios already use 100%. Unlocked colors were set to 0%.',
		};
	}

	return { palette: next };
}

function updatePaletteWeightWithLocks(
	palette: PaletteSwatch[],
	id: string,
	requestedWeight: number,
): {
	palette: PaletteSwatch[] | null;
	message?: string;
} {
	if (!Number.isFinite(requestedWeight)) {
		return {
			palette: null,
			message: 'Enter a valid ratio value.',
		};
	}

	const targetIndex = palette.findIndex((swatch) => swatch.id === id);
	if (targetIndex < 0) {
		return {
			palette: null,
			message: 'Color ratio target was not found.',
		};
	}

	const next = palette.map((swatch) => ({ ...swatch }));
	const lockedOtherSum = next.reduce((sum, swatch, index) => {
		if (index === targetIndex || !swatch.locked) {
			return sum;
		}

		return sum + swatch.weight;
	}, 0);

	const maxForTarget = Math.max(0, 1 - lockedOtherSum);
	const clampedTarget = Math.min(clampWeight(requestedWeight), maxForTarget);
	next[targetIndex].weight = clampedTarget;

	const adjustableIndexes = next
		.map((swatch, index) => ({ swatch, index }))
		.filter(({ swatch, index }) => index !== targetIndex && !swatch.locked)
		.map(({ index }) => index);

	const remaining = 1 - lockedOtherSum - clampedTarget;

	if (adjustableIndexes.length === 0) {
		if (Math.abs(remaining) > WEIGHT_EPSILON) {
			return {
				palette: null,
				message:
					'No unlocked colors are available to absorb the remaining ratio. Unlock at least one other color.',
			};
		}

		if (Math.abs(clampedTarget - requestedWeight) > WEIGHT_EPSILON) {
			return {
				palette: next,
				message: `Ratio capped at ${(clampedTarget * 100).toFixed(1)}% because locked colors reserve the rest.`,
			};
		}

		return { palette: next };
	}

	const adjustableTotal = adjustableIndexes.reduce(
		(sum, index) => sum + next[index].weight,
		0,
	);
	const safeRemaining = Math.max(0, remaining);

	if (adjustableTotal <= WEIGHT_EPSILON) {
		const even = safeRemaining / adjustableIndexes.length;
		for (const index of adjustableIndexes) {
			next[index].weight = even;
		}
	} else {
		for (const index of adjustableIndexes) {
			next[index].weight =
				safeRemaining * (next[index].weight / adjustableTotal);
		}
	}

	if (Math.abs(clampedTarget - requestedWeight) > WEIGHT_EPSILON) {
		return {
			palette: next,
			message: `Ratio capped at ${(clampedTarget * 100).toFixed(1)}% because locked colors reserve the rest.`,
		};
	}

	return { palette: next };
}

export function useGradientStudioState() {
	const [settings, setSettings] = useState<StudioSettings>(
		DEFAULT_STUDIO_SETTINGS,
	);
	const [presetSelections, setPresetSelections] =
		useState<PresetSelectionState>(DEFAULT_PRESET_SELECTIONS);
	const [effectPresetSelections, setEffectPresetSelections] =
		useState<EffectPresetSelectionState>(DEFAULT_EFFECT_PRESET_SELECTIONS);
	const [customPresets, setCustomPresets] = useState(() =>
		hydrateCustomPresets(createInitialCustomPresets(DEFAULT_STUDIO_SETTINGS)),
	);
	const [customEffectPresets, setCustomEffectPresets] = useState(() =>
		hydrateCustomEffectPresets(
			createInitialCustomEffectPresets(DEFAULT_STUDIO_SETTINGS),
		),
	);
	const [controlsOpen, setControlsOpen] = useState(true);
	const [seedTick, setSeedTick] = useState(0);
	const [statusMessage, setStatusMessage] = useState('');

	useEffect(() => {
		safeStorageSet(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(customPresets));
	}, [customPresets]);

	useEffect(() => {
		safeStorageSet(
			CUSTOM_EFFECT_PRESETS_STORAGE_KEY,
			JSON.stringify(customEffectPresets),
		);
	}, [customEffectPresets]);

	const applyPatch = useCallback((patch: StudioPatch) => {
		setSettings((previous) => patchSettings(previous, patch));
	}, []);

	const markCustomFromPatch = useCallback((patch: StudioPatch) => {
		const changedKeys = Object.keys(patch) as Array<keyof StudioSettings>;
		if (changedKeys.length === 0) {
			return;
		}

		const touchedGroups = PRESET_APPLY_ORDER.filter((group) =>
			changedKeys.some((key) => PRESET_GROUP_SETTING_KEYS[group].includes(key)),
		);
		if (touchedGroups.length > 0) {
			setPresetSelections((current) => {
				const next = { ...current };
				for (const group of touchedGroups) {
					next[group] = CUSTOM_PRESET_KEY;
				}
				return next;
			});

			setCustomPresets((current) => {
				const next = { ...current };
				for (const group of touchedGroups) {
					next[group] = mergePatch(
						current[group],
						patch,
						PRESET_GROUP_SETTING_KEYS[group],
					);
				}
				return next;
			});
		}

		const touchedEffects = EFFECT_PRESET_APPLY_ORDER.filter((effect) =>
			changedKeys.some((key) => EFFECT_SETTING_KEYS[effect].includes(key)),
		);
		if (touchedEffects.length === 0) {
			return;
		}

		setEffectPresetSelections((current) => {
			const next = { ...current };
			for (const effect of touchedEffects) {
				next[effect] = CUSTOM_PRESET_KEY;
			}
			return next;
		});

		setCustomEffectPresets((current) => {
			const next = { ...current };
			for (const effect of touchedEffects) {
				next[effect] = mergePatch(
					current[effect],
					patch,
					EFFECT_SETTING_KEYS[effect],
				);
			}
			return next;
		});
	}, []);

	const updateSetting = useCallback(
		<Key extends keyof StudioSettings>(
			key: Key,
			value: StudioSettings[Key],
		) => {
			const patch = { [key]: value } as StudioPatch;
			applyPatch(patch);
			markCustomFromPatch(patch);
		},
		[applyPatch, markCustomFromPatch],
	);

	const applyPreset = useCallback(
		(group: PresetGroupKey, key: string) => {
			setPresetSelections((current) => ({ ...current, [group]: key }));
			const patch =
				key === CUSTOM_PRESET_KEY
					? customPresets[group]
					: findPresetPatch(group, key);
			if (!patch) {
				return;
			}

			applyPatch(patch);

			if (key === CUSTOM_PRESET_KEY) {
				setStatusMessage(`Applied custom ${group} preset.`);
				return;
			}

			const selected = PRESET_CATALOG[group].find((entry) => entry.key === key);
			if (selected) {
				setStatusMessage(`Applied ${group} preset: ${selected.label}.`);
			}
		},
		[applyPatch, customPresets],
	);

	const applyAllSelectedPresets = useCallback(() => {
		const aggregatePatch: StudioPatch = {};

		for (const group of PRESET_APPLY_ORDER) {
			const key = presetSelections[group];
			const patch =
				key === CUSTOM_PRESET_KEY
					? customPresets[group]
					: findPresetPatch(group, key);
			if (!patch) {
				continue;
			}
			Object.assign(aggregatePatch, patch);
		}

		applyPatch(aggregatePatch);
		setStatusMessage('Applied all selected profile groups.');
	}, [applyPatch, customPresets, presetSelections]);

	const applyEffectPreset = useCallback(
		(effect: EffectPresetKey, key: string) => {
			setEffectPresetSelections((current) => ({ ...current, [effect]: key }));
			const patch =
				key === CUSTOM_PRESET_KEY
					? customEffectPresets[effect]
					: findEffectPresetPatch(effect, key);
			if (!patch) {
				return;
			}

			applyPatch(patch);

			if (key === CUSTOM_PRESET_KEY) {
				setStatusMessage(`Applied custom ${effect} preset.`);
				return;
			}

			const selected = EFFECT_PRESET_CATALOG[effect].find(
				(entry) => entry.key === key,
			);
			if (selected) {
				setStatusMessage(`Applied ${effect} preset: ${selected.label}.`);
			}
		},
		[applyPatch, customEffectPresets],
	);

	const saveCustomPreset = useCallback(
		(group: PresetGroupKey) => {
			const customPatch = buildPatchFromSettings(
				settings,
				PRESET_GROUP_SETTING_KEYS[group],
			);

			setCustomPresets((current) => ({
				...current,
				[group]: customPatch,
			}));
			setPresetSelections((current) => ({
				...current,
				[group]: CUSTOM_PRESET_KEY,
			}));
			setStatusMessage(`Saved custom ${group} preset.`);
		},
		[settings],
	);

	const saveCustomEffectPreset = useCallback(
		(effect: EffectPresetKey) => {
			const customPatch = buildPatchFromSettings(
				settings,
				EFFECT_SETTING_KEYS[effect],
			);

			setCustomEffectPresets((current) => ({
				...current,
				[effect]: customPatch,
			}));
			setEffectPresetSelections((current) => ({
				...current,
				[effect]: CUSTOM_PRESET_KEY,
			}));
			setStatusMessage(`Saved custom ${effect} preset.`);
		},
		[settings],
	);

	const toggleShapeSelection = useCallback(
		(shape: ShapeSelection, enabled: boolean) => {
			const set = new Set(settings.shapeSelections);
			if (enabled) {
				set.add(shape);
			} else {
				set.delete(shape);
			}

			if (set.size === 0) {
				setStatusMessage('At least one shape family must stay enabled.');
				return;
			}

			const patch: StudioPatch = {
				shapeSelections: Array.from(set),
			};
			applyPatch(patch);
			markCustomFromPatch(patch);
		},
		[applyPatch, markCustomFromPatch, settings.shapeSelections],
	);

	const addPaletteColor = useCallback(() => {
		const withNewColor = [
			...settings.palette,
			{
				id: createId('palette'),
				hex: randomPaletteHex(),
				weight: 0,
				enabled: true,
				locked: false,
			},
		];

		const result = rebalanceUnlockedWeights(withNewColor);
		if (!result.palette) {
			setStatusMessage(result.message ?? 'Could not add color right now.');
			return;
		}

		const patch: StudioPatch = { palette: result.palette };
		applyPatch(patch);
		markCustomFromPatch(patch);
		setStatusMessage(result.message ?? 'Added a new palette color.');
	}, [applyPatch, markCustomFromPatch, settings.palette]);

	const removePaletteColor = useCallback(
		(id: string) => {
			if (settings.palette.length <= 1) {
				setStatusMessage('At least one color is required.');
				return;
			}

			const reducedPalette = settings.palette.filter(
				(swatch) => swatch.id !== id,
			);
			const result = rebalanceUnlockedWeights(reducedPalette);
			if (!result.palette) {
				setStatusMessage(result.message ?? 'Could not remove that color.');
				return;
			}

			const patch: StudioPatch = { palette: result.palette };
			applyPatch(patch);
			markCustomFromPatch(patch);
			if (result.message) {
				setStatusMessage(result.message);
			}
		},
		[applyPatch, markCustomFromPatch, settings.palette],
	);

	const togglePaletteColor = useCallback(
		(id: string, enabled: boolean) => {
			const currentlyEnabled = settings.palette.filter(
				(swatch) => swatch.enabled,
			).length;
			if (!enabled && currentlyEnabled <= 1) {
				setStatusMessage('At least one color must stay active.');
				return;
			}

			const nextPalette = settings.palette.map((swatch) =>
				swatch.id === id ? { ...swatch, enabled } : swatch,
			);

			const patch: StudioPatch = { palette: nextPalette };
			applyPatch(patch);
			markCustomFromPatch(patch);
		},
		[applyPatch, markCustomFromPatch, settings.palette],
	);

	const setPaletteHex = useCallback(
		(id: string, hex: string) => {
			const nextPalette = settings.palette.map((swatch) =>
				swatch.id === id ? { ...swatch, hex } : swatch,
			);
			const patch: StudioPatch = { palette: nextPalette };
			applyPatch(patch);
			markCustomFromPatch(patch);
		},
		[applyPatch, markCustomFromPatch, settings.palette],
	);

	const setPaletteWeight = useCallback(
		(id: string, weight: number) => {
			const result = updatePaletteWeightWithLocks(settings.palette, id, weight);
			if (!result.palette) {
				setStatusMessage(result.message ?? 'Could not set that ratio.');
				return;
			}

			const patch: StudioPatch = { palette: result.palette };
			applyPatch(patch);
			markCustomFromPatch(patch);
			if (result.message) {
				setStatusMessage(result.message);
			}
		},
		[applyPatch, markCustomFromPatch, settings.palette],
	);

	const togglePaletteLock = useCallback(
		(id: string, locked: boolean) => {
			const nextPalette = settings.palette.map((swatch) =>
				swatch.id === id ? { ...swatch, locked } : swatch,
			);

			const patch: StudioPatch = { palette: nextPalette };
			applyPatch(patch);
			markCustomFromPatch(patch);

			const target = nextPalette.find((swatch) => swatch.id === id);
			if (!target) {
				return;
			}

			setStatusMessage(
				locked
					? `Locked ratio for ${target.hex.toUpperCase()}.`
					: `Unlocked ratio for ${target.hex.toUpperCase()}.`,
			);
		},
		[applyPatch, markCustomFromPatch, settings.palette],
	);

	const rebalancePalette = useCallback(() => {
		const result = rebalanceUnlockedWeights(settings.palette);
		if (!result.palette) {
			setStatusMessage(result.message ?? 'Could not rebalance palette ratios.');
			return;
		}

		const patch: StudioPatch = {
			palette: result.palette,
		};
		applyPatch(patch);
		markCustomFromPatch(patch);
		setStatusMessage(result.message ?? 'Rebalanced palette weights.');
	}, [applyPatch, markCustomFromPatch, settings.palette]);

	const randomizeSeed = useCallback(() => {
		if (settings.seedLocked) {
			const patch: StudioPatch = { seed: createId('seed') };
			applyPatch(patch);
			markCustomFromPatch(patch);
		} else {
			setSeedTick((value) => value + 1);
		}
		setStatusMessage('Generated a new layout seed.');
	}, [applyPatch, markCustomFromPatch, settings.seedLocked]);

	const resetToDefaults = useCallback(() => {
		setSettings(DEFAULT_STUDIO_SETTINGS);
		setPresetSelections(DEFAULT_PRESET_SELECTIONS);
		setEffectPresetSelections(DEFAULT_EFFECT_PRESET_SELECTIONS);
		setCustomPresets(createInitialCustomPresets(DEFAULT_STUDIO_SETTINGS));
		setCustomEffectPresets(
			createInitialCustomEffectPresets(DEFAULT_STUDIO_SETTINGS),
		);
		setSeedTick(0);
		setStatusMessage('Reset to default studio settings.');
	}, []);

	const orbPalette = useMemo(
		() => toOrbPalette(settings.palette),
		[settings.palette],
	);
	const effectiveSeed = settings.seedLocked
		? settings.seed
		: `live-${settings.seed}-${seedTick}`;
	const renderLoad = useMemo(
		() => computeRenderLoadScore(settings),
		[settings],
	);

	const activeEffectsCount = useMemo(
		() =>
			[
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
			].filter(Boolean).length,
		[settings],
	);

	const shapeSelectionSet = useMemo(
		() => new Set(settings.shapeSelections),
		[settings.shapeSelections],
	);

	return {
		settings,
		presetSelections,
		effectPresetSelections,
		customPresetKey: CUSTOM_PRESET_KEY,
		controlsOpen,
		setControlsOpen,
		statusMessage,
		setStatusMessage,
		shapeSelectionSet,
		orbPalette,
		effectiveSeed,
		renderLoad,
		activeEffectsCount,
		updateSetting,
		applyPreset,
		applyAllSelectedPresets,
		applyEffectPreset,
		saveCustomPreset,
		saveCustomEffectPreset,
		toggleShapeSelection,
		addPaletteColor,
		removePaletteColor,
		togglePaletteColor,
		togglePaletteLock,
		setPaletteHex,
		setPaletteWeight,
		rebalancePalette,
		randomizeSeed,
		resetToDefaults,
		presetCatalog: PRESET_CATALOG,
		effectPresetCatalog: EFFECT_PRESET_CATALOG,
		shapeOptions: SHAPE_OPTIONS,
	};
}
