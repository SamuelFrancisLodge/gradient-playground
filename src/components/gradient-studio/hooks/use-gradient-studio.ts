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
	style: Object.keys(DEFAULT_STUDIO_SETTINGS) as Array<keyof StudioSettings>,
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

function equalWeightPalette(palette: PaletteSwatch[]): PaletteSwatch[] {
	if (palette.length === 0) {
		return [];
	}

	const even = 1 / palette.length;
	return palette.map((swatch) => ({ ...swatch, weight: even }));
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
				setStatusMessage(`Applied custom ${group} profile.`);
				return;
			}

			const selected = PRESET_CATALOG[group].find((entry) => entry.key === key);
			if (selected) {
				setStatusMessage(`Applied ${group} profile: ${selected.label}.`);
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
				setStatusMessage(`Applied custom ${effect} profile.`);
				return;
			}

			const selected = EFFECT_PRESET_CATALOG[effect].find(
				(entry) => entry.key === key,
			);
			if (selected) {
				setStatusMessage(`Applied ${effect} profile: ${selected.label}.`);
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
			setStatusMessage(`Saved custom ${group} profile.`);
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
			setStatusMessage(`Saved custom ${effect} profile.`);
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
		const nextPalette = equalWeightPalette([
			...settings.palette,
			{
				id: createId('palette'),
				hex: randomPaletteHex(),
				weight: 1,
				enabled: true,
			},
		]);

		const patch: StudioPatch = { palette: nextPalette };
		applyPatch(patch);
		markCustomFromPatch(patch);
		setStatusMessage('Added a new palette color.');
	}, [applyPatch, markCustomFromPatch, settings.palette]);

	const removePaletteColor = useCallback(
		(id: string) => {
			if (settings.palette.length <= 1) {
				setStatusMessage('At least one color is required.');
				return;
			}

			const nextPalette = equalWeightPalette(
				settings.palette.filter((swatch) => swatch.id !== id),
			);
			const patch: StudioPatch = { palette: nextPalette };
			applyPatch(patch);
			markCustomFromPatch(patch);
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
			const nextPalette = settings.palette.map((swatch) =>
				swatch.id === id ? { ...swatch, weight } : swatch,
			);
			const patch: StudioPatch = { palette: nextPalette };
			applyPatch(patch);
			markCustomFromPatch(patch);
		},
		[applyPatch, markCustomFromPatch, settings.palette],
	);

	const rebalancePalette = useCallback(() => {
		const patch: StudioPatch = {
			palette: equalWeightPalette(settings.palette),
		};
		applyPatch(patch);
		markCustomFromPatch(patch);
		setStatusMessage('Rebalanced palette weights.');
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
