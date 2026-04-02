'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PaletteEditor } from '@/components/gradient-studio/components/palette-editor';
import {
	PanelSection,
	RangeInput,
	SelectInput,
	TinyStat,
	ToggleInput,
} from '@/components/gradient-studio/components/control-primitives';
import { useGradientStudioState } from '@/components/gradient-studio/hooks/use-gradient-studio';
import { CUSTOM_PRESET_KEY } from '@/components/gradient-studio/types';
import type {
	EffectPresetCatalog,
	EffectPresetKey,
	EffectPresetSelectionState,
	GlowBlendMode,
	PresetCatalog,
	PresetGroupKey,
	PresetSelectionState,
} from '@/components/gradient-studio/types';
import { OrbGradientField } from '@/components/orb-gradient-field';

const GLOW_BLEND_OPTIONS: Array<{ label: string; value: GlowBlendMode }> = [
	{ label: 'Screen', value: 'screen' },
	{ label: 'Overlay', value: 'overlay' },
	{ label: 'Color Dodge', value: 'color-dodge' },
	{ label: 'Soft Light', value: 'soft-light' },
];

type EffectPresetCardProps = {
	title: string;
	subtitle: string;
	effectKey: EffectPresetKey;
	presetCatalog: EffectPresetCatalog;
	presetSelections: EffectPresetSelectionState;
	onApplyPreset: (effect: EffectPresetKey, key: string) => void;
	onSavePreset: (effect: EffectPresetKey) => void;
	children: ReactNode;
};

type GlobalProfileControlProps = {
	title: string;
	subtitle: string;
	group: PresetGroupKey;
	presetCatalog: PresetCatalog;
	presetSelections: PresetSelectionState;
	onApplyProfile: (group: PresetGroupKey, key: string) => void;
	onSaveProfile: (group: PresetGroupKey) => void;
};

function GlobalProfileControl({
	title,
	subtitle,
	group,
	presetCatalog,
	presetSelections,
	onApplyProfile,
	onSaveProfile,
}: GlobalProfileControlProps) {
	const selectedKey = presetSelections[group];
	const selected = presetCatalog[group].find(
		(entry) => entry.key === selectedKey,
	);

	return (
		<div className="rounded-xl border border-white/12 bg-slate-950/40 p-3">
			<p className="text-[10px] uppercase tracking-[0.15em] text-cyan-100/85">
				{title}
			</p>
			<p className="mt-1 text-xs text-slate-300/75">{subtitle}</p>
			<div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
				<SelectInput
					hideLabel
					value={selectedKey}
					onChange={(value) => onApplyProfile(group, value)}
					options={[
						...presetCatalog[group].map((entry) => ({
							label: entry.label,
							value: entry.key,
						})),
						{ label: 'Custom', value: CUSTOM_PRESET_KEY },
					]}
				/>
				<button
					type="button"
					onClick={() => onSaveProfile(group)}
					className="cursor-pointer rounded-xl border border-cyan-300/30 bg-cyan-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100 transition hover:bg-cyan-500/25"
				>
					Save Custom
				</button>
			</div>
			<p className="mt-2 text-xs text-slate-300/75">
				{selectedKey === CUSTOM_PRESET_KEY
					? 'Manual profile values.'
					: (selected?.description ?? 'Choose an option.')}
			</p>
		</div>
	);
}

function EffectPresetCard({
	title,
	subtitle,
	effectKey,
	presetCatalog,
	presetSelections,
	onApplyPreset,
	onSavePreset,
	children,
}: EffectPresetCardProps) {
	const selectedKey = presetSelections[effectKey];
	const selected = presetCatalog[effectKey].find(
		(preset) => preset.key === selectedKey,
	);

	return (
		<div className="rounded-xl border border-white/12 bg-slate-950/40 p-3">
			<div className="mb-3">
				<p className="text-[10px] uppercase tracking-[0.15em] text-cyan-100/85">
					{title}
				</p>
				<p className="mt-1 text-xs text-slate-300/75">{subtitle}</p>
			</div>
			<div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
				<SelectInput
					hideLabel
					value={selectedKey}
					onChange={(value) => onApplyPreset(effectKey, value)}
					options={[
						...presetCatalog[effectKey].map((preset) => ({
							label: preset.label,
							value: preset.key,
						})),
						{ label: 'Custom', value: CUSTOM_PRESET_KEY },
					]}
				/>
				<button
					type="button"
					onClick={() => onSavePreset(effectKey)}
					className="cursor-pointer rounded-xl border border-cyan-300/30 bg-cyan-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100 transition hover:bg-cyan-500/25"
				>
					Save Custom
				</button>
			</div>
			<p className="mt-2 text-xs text-slate-300/75">
				{selectedKey === CUSTOM_PRESET_KEY
					? 'Manual profile values.'
					: (selected?.description ?? 'Choose a profile.')}
			</p>
			<div className="mt-3 space-y-3">{children}</div>
		</div>
	);
}

export function GradientSandbox() {
	const {
		settings,
		presetSelections,
		effectPresetSelections,
		controlsOpen,
		setControlsOpen,
		statusMessage,
		shapeSelectionSet,
		orbPalette,
		effectiveSeed,
		renderLoad,
		activeEffectsCount,
		updateSetting,
		applyPreset,
		applyEffectPreset,
		toggleShapeSelection,
		addPaletteColor,
		removePaletteColor,
		togglePaletteColor,
		setPaletteHex,
		setPaletteWeight,
		rebalancePalette,
		randomizeSeed,
		resetToDefaults,
		saveCustomPreset,
		saveCustomEffectPreset,
		presetCatalog,
		effectPresetCatalog,
		shapeOptions,
	} = useGradientStudioState();

	const [headingVisible, setHeadingVisible] = useState(true);
	const controlsPanelRef = useRef<HTMLElement | null>(null);
	const controlsScrollTopRef = useRef(0);

	useEffect(() => {
		if (!controlsOpen || !controlsPanelRef.current) {
			return;
		}

		controlsPanelRef.current.scrollTop = controlsScrollTopRef.current;
	}, [controlsOpen]);

	const renderToneClass =
		renderLoad.label === 'Heavy'
			? 'text-rose-100'
			: renderLoad.label === 'Balanced'
				? 'text-amber-100'
				: 'text-emerald-100';

	const activePaletteCount = useMemo(
		() => settings.palette.filter((swatch) => swatch.enabled).length,
		[settings.palette],
	);

	return (
		<main className="relative h-screen w-screen overflow-hidden bg-[#020817] text-slate-100">
			<OrbGradientField
				circleCount={settings.circleCount}
				minRadius={settings.minRadius}
				maxRadius={settings.maxRadius}
				allowCrop={settings.allowCrop}
				shapeSelections={settings.shapeSelections}
				shapeSpeedMin={settings.shapeSpeedMin}
				shapeSpeedMax={settings.shapeSpeedMax}
				colors={orbPalette.colors}
				colorRatios={orbPalette.ratios}
				seed={effectiveSeed}
				animate={settings.animate}
				animationSpeed={settings.animationSpeed}
				movementIntensity={settings.movementIntensity}
				scaleIntensity={settings.scaleIntensity}
				blurEnabled={settings.blurEnabled}
				blurStdDeviation={settings.blurStdDeviation}
				glowEnabled={settings.glowEnabled}
				glowStdDeviation={settings.glowStdDeviation}
				glowIntensity={settings.glowIntensity}
				glowBlendMode={settings.glowBlendMode}
				noiseEnabled={settings.noiseEnabled}
				noiseOpacity={settings.noiseOpacity}
				noiseFrequency={settings.noiseFrequency}
				coarseNoiseOpacity={settings.coarseNoiseOpacity}
				coarseNoiseFrequency={settings.coarseNoiseFrequency}
				warpEnabled={settings.warpEnabled}
				warpAmount={settings.warpAmount}
				warpSpeed={settings.warpSpeed}
				warpBaseFrequency={settings.warpBaseFrequency}
				metaballEnabled={settings.metaballEnabled}
				metaballBlur={settings.metaballBlur}
				metaballThreshold={settings.metaballThreshold}
				bloomEnabled={settings.bloomEnabled}
				bloomThreshold={settings.bloomThreshold}
				bloomRadius={settings.bloomRadius}
				bloomIntensity={settings.bloomIntensity}
				posterizeEnabled={settings.posterizeEnabled}
				posterizeLevels={settings.posterizeLevels}
				posterizeOpacity={settings.posterizeOpacity}
				causticEnabled={settings.causticEnabled}
				causticIntensity={settings.causticIntensity}
				causticScale={settings.causticScale}
				causticSpeed={settings.causticSpeed}
				depthEnabled={settings.depthEnabled}
				depthLayers={settings.depthLayers}
				depthStrength={settings.depthStrength}
				vignetteEnabled={settings.vignetteEnabled}
				vignetteAmount={settings.vignetteAmount}
				vignetteColor={settings.vignetteColor}
				fringeEnabled={settings.fringeEnabled}
				fringeAmount={settings.fringeAmount}
				sweepEnabled={settings.sweepEnabled}
				sweepIntensity={settings.sweepIntensity}
				sweepWidth={settings.sweepWidth}
				sweepSpeed={settings.sweepSpeed}
				sweepAngle={settings.sweepAngle}
				paletteDriftEnabled={settings.paletteDriftEnabled}
				paletteDriftSpeed={settings.paletteDriftSpeed}
				hueRotateEnabled={settings.hueRotateEnabled}
				hueRotateDegrees={settings.hueRotateDegrees}
				hueRotateSpeed={settings.hueRotateSpeed}
			/>

			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.22),transparent_36%),radial-gradient(circle_at_85%_74%,rgba(249,115,22,0.16),transparent_40%)]" />

			{headingVisible ? (
				<section className="absolute left-3 top-3 z-20 max-w-[min(34rem,calc(100vw-1.5rem))] rounded-3xl border border-white/20 bg-slate-950/60 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:left-5 sm:top-5 sm:p-6">
					<div className="mb-3 flex items-start justify-between gap-3">
						<p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/90">
							Gradient Studio
						</p>
						<button
							type="button"
							onClick={() => setHeadingVisible(false)}
							className="cursor-pointer rounded-full border border-white/25 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90 transition hover:bg-white/10"
						>
							Hide Heading
						</button>
					</div>
					<h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
						Interactive Gradient Playground
					</h1>
					<p className="mt-3 text-sm leading-relaxed text-slate-200/85 sm:text-base">
						Craft animated gradient scenes with stacked effects, profile groups,
						palette thumbnails, and deterministic seeds.
					</p>
					<div className="mt-4 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
						<TinyStat
							label="Palette"
							value={`${activePaletteCount}/${settings.palette.length} active`}
						/>
						<TinyStat label="Effects" value={`${activeEffectsCount} active`} />
						<TinyStat
							label="Motion"
							value={settings.animate ? 'Animated' : 'Static'}
						/>
						<TinyStat
							label="Render"
							value={renderLoad.label}
							colorClass={renderToneClass}
						/>
					</div>
				</section>
			) : (
				<button
					type="button"
					onClick={() => setHeadingVisible(true)}
					className="absolute left-3 top-3 z-20 cursor-pointer rounded-full border border-white/25 bg-slate-950/70 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_10px_28px_rgba(0,0,0,0.35)] transition hover:bg-slate-900/90 sm:left-5 sm:top-5"
				>
					Show Heading
				</button>
			)}

			{controlsOpen ? (
				<>
					<button
						type="button"
						onClick={() => setControlsOpen(false)}
						aria-label="Close control panel"
						className="absolute inset-0 z-20 cursor-pointer bg-transparent"
					/>
					<aside
						ref={controlsPanelRef}
						className="absolute right-3 top-3 z-30 h-[calc(100vh-1.5rem)] w-[min(26.5rem,calc(100vw-1.5rem))] overflow-y-auto rounded-3xl border border-white/20 bg-slate-950/85 p-4 shadow-[0_25px_70px_rgba(0,0,0,0.48)] backdrop-blur-2xl sm:right-4 sm:top-4 sm:p-5"
						onScroll={(event) => {
							controlsScrollTopRef.current = event.currentTarget.scrollTop;
						}}
						onClick={(event) => event.stopPropagation()}
					>
						<div className="mb-4 flex items-start justify-between gap-3">
							<div>
								<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/85">
									Studio Controls
								</p>
								<p className="mt-1 text-xs text-slate-300/80">
									Seed: {effectiveSeed}
								</p>
							</div>
							<button
								type="button"
								onClick={() => setControlsOpen(false)}
								className="cursor-pointer rounded-full border border-white/25 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.14em] text-white/90 transition hover:bg-white/10"
							>
								Hide
							</button>
						</div>

						{statusMessage ? (
							<div className="mb-4 rounded-xl border border-cyan-300/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100/95">
								{statusMessage}
							</div>
						) : null}

						<div className="space-y-4 pb-2">
							<PanelSection
								title="Style Profile"
								subtitle="Use-case driven look recipes; keep palette selection separate"
							>
								<GlobalProfileControl
									title="Use Case"
									subtitle="Poster, bloom, warp, fringe, and other effect-first profiles"
									group="style"
									presetCatalog={presetCatalog}
									presetSelections={presetSelections}
									onApplyProfile={applyPreset}
									onSaveProfile={saveCustomPreset}
								/>
							</PanelSection>

							<PanelSection
								title="Color and Seed"
								subtitle="Palette direction, color balance, and deterministic seed"
							>
								<div className="grid gap-3 sm:grid-cols-2">
									<GlobalProfileControl
										title="Palette Profile"
										subtitle="Overall color mood and contrast mix"
										group="palette"
										presetCatalog={presetCatalog}
										presetSelections={presetSelections}
										onApplyProfile={applyPreset}
										onSaveProfile={saveCustomPreset}
									/>
									<GlobalProfileControl
										title="Seed Profile"
										subtitle="Deterministic seed strategy and lock behavior"
										group="seed"
										presetCatalog={presetCatalog}
										presetSelections={presetSelections}
										onApplyProfile={applyPreset}
										onSaveProfile={saveCustomPreset}
									/>
								</div>

								<PaletteEditor
									palette={settings.palette}
									onAdd={addPaletteColor}
									onRemove={removePaletteColor}
									onToggle={togglePaletteColor}
									onHexChange={setPaletteHex}
									onWeightChange={setPaletteWeight}
									onRebalance={rebalancePalette}
								/>

								<div className="rounded-xl border border-white/12 bg-slate-950/40 p-3">
									<ToggleInput
										label="Lock Deterministic Seed"
										checked={settings.seedLocked}
										onChange={(value) => updateSetting('seedLocked', value)}
									/>
									<label className="mt-3 block text-[11px] uppercase tracking-[0.16em] text-slate-300/80">
										<span>Seed Token</span>
										<input
											type="text"
											value={settings.seed}
											onChange={(event) =>
												updateSetting('seed', event.target.value)
											}
											className="mt-1.5 w-full rounded-xl border border-white/20 bg-slate-950/80 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none transition focus:border-cyan-300/70"
										/>
									</label>
									<div className="mt-3 grid gap-2 sm:grid-cols-2">
										<button
											type="button"
											onClick={randomizeSeed}
											className="w-full cursor-pointer rounded-xl border border-cyan-300/30 bg-cyan-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-500/25"
										>
											Reroll Seed
										</button>
										<button
											type="button"
											onClick={resetToDefaults}
											className="w-full cursor-pointer rounded-xl border border-white/25 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/90 transition hover:bg-white/10"
										>
											Reset Defaults
										</button>
									</div>
								</div>
							</PanelSection>

							<PanelSection
								title="Layout and Motion"
								subtitle="Composition density, shape family, and movement"
							>
								<div className="grid gap-3 sm:grid-cols-2">
									<GlobalProfileControl
										title="Layout Profile"
										subtitle="Density and radius distribution"
										group="layout"
										presetCatalog={presetCatalog}
										presetSelections={presetSelections}
										onApplyProfile={applyPreset}
										onSaveProfile={saveCustomPreset}
									/>
									<GlobalProfileControl
										title="Motion Profile"
										subtitle="Animation energy and drift cadence"
										group="motion"
										presetCatalog={presetCatalog}
										presetSelections={presetSelections}
										onApplyProfile={applyPreset}
										onSaveProfile={saveCustomPreset}
									/>
								</div>

								<RangeInput
									label="Circle Count"
									value={settings.circleCount}
									min={10}
									max={30}
									onChange={(value) => updateSetting('circleCount', value)}
								/>
								<RangeInput
									label="Min Radius"
									value={settings.minRadius}
									min={40}
									max={600}
									formatValue={(value) => `${value}px`}
									onChange={(value) => updateSetting('minRadius', value)}
								/>
								<RangeInput
									label="Max Radius"
									value={settings.maxRadius}
									min={60}
									max={900}
									formatValue={(value) => `${value}px`}
									onChange={(value) => updateSetting('maxRadius', value)}
								/>
								<ToggleInput
									label="Allow Edge Crop"
									checked={settings.allowCrop}
									onChange={(value) => updateSetting('allowCrop', value)}
								/>

								<div className="rounded-xl border border-white/12 bg-slate-950/40 p-3">
									<p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-slate-300/75">
										Shape Families
									</p>
									<div className="grid grid-cols-2 gap-2 text-xs">
										{shapeOptions.map((shape) => (
											<label
												key={shape.value}
												className="flex cursor-pointer items-center justify-between rounded-lg border border-white/12 bg-slate-900/60 px-2.5 py-1.5"
											>
												<div>
													<p className="text-white/90">{shape.label}</p>
													<p className="text-[10px] text-slate-400">
														{shape.help}
													</p>
												</div>
												<input
													type="checkbox"
													checked={shapeSelectionSet.has(shape.value)}
													onChange={(event) =>
														toggleShapeSelection(
															shape.value,
															event.target.checked,
														)
													}
													className="h-4 w-4 cursor-pointer accent-cyan-400"
												/>
											</label>
										))}
									</div>
								</div>

								<ToggleInput
									label="Animate"
									checked={settings.animate}
									onChange={(value) => updateSetting('animate', value)}
								/>
								<RangeInput
									label="Animation Speed"
									value={settings.animationSpeed}
									min={0.2}
									max={3}
									step={0.05}
									disabled={!settings.animate}
									formatValue={(value) => `${value.toFixed(2)}x`}
									onChange={(value) => updateSetting('animationSpeed', value)}
								/>
								<RangeInput
									label="Movement Intensity"
									value={settings.movementIntensity}
									min={0}
									max={2}
									step={0.05}
									disabled={!settings.animate}
									formatValue={(value) => `${value.toFixed(2)}x`}
									onChange={(value) =>
										updateSetting('movementIntensity', value)
									}
								/>
								<RangeInput
									label="Scale Intensity"
									value={settings.scaleIntensity}
									min={0}
									max={2}
									step={0.05}
									disabled={!settings.animate}
									formatValue={(value) => `${value.toFixed(2)}x`}
									onChange={(value) => updateSetting('scaleIntensity', value)}
								/>
								<RangeInput
									label="Shape Speed Min"
									value={settings.shapeSpeedMin}
									min={0.15}
									max={3}
									step={0.05}
									disabled={!settings.animate}
									formatValue={(value) => `${value.toFixed(2)}x`}
									onChange={(value) => updateSetting('shapeSpeedMin', value)}
								/>
								<RangeInput
									label="Shape Speed Max"
									value={settings.shapeSpeedMax}
									min={0.15}
									max={3}
									step={0.05}
									disabled={!settings.animate}
									formatValue={(value) => `${value.toFixed(2)}x`}
									onChange={(value) => updateSetting('shapeSpeedMax', value)}
								/>
							</PanelSection>

							<PanelSection
								title="Core FX"
								subtitle="Blur, glow, and grain shaping"
							>
								<EffectPresetCard
									title="Blur"
									subtitle="Softness and diffusion"
									effectKey="blur"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
								>
									<RangeInput
										label="Blur Amount"
										value={settings.blurStdDeviation}
										min={0}
										max={180}
										disabled={!settings.blurEnabled}
										onChange={(value) =>
											updateSetting('blurStdDeviation', value)
										}
									/>
								</EffectPresetCard>

								<EffectPresetCard
									title="Glow"
									subtitle="Halo and blend shaping"
									effectKey="glow"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
								>
									<RangeInput
										label="Glow Blur"
										value={settings.glowStdDeviation}
										min={0}
										max={220}
										disabled={!settings.glowEnabled}
										onChange={(value) =>
											updateSetting('glowStdDeviation', value)
										}
									/>
									<RangeInput
										label="Glow Intensity"
										value={settings.glowIntensity}
										min={0}
										max={5}
										step={0.1}
										disabled={!settings.glowEnabled}
										formatValue={(value) => value.toFixed(1)}
										onChange={(value) => updateSetting('glowIntensity', value)}
									/>
									<SelectInput<GlowBlendMode>
										label="Glow Blend Mode"
										value={settings.glowBlendMode}
										onChange={(value) => updateSetting('glowBlendMode', value)}
										hideLabel
										options={GLOW_BLEND_OPTIONS}
									/>
								</EffectPresetCard>

								<EffectPresetCard
									title="Noise"
									subtitle="Fine and coarse grain"
									effectKey="noise"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
								>
									<RangeInput
										label="Fine Noise Opacity"
										value={settings.noiseOpacity}
										min={0}
										max={0.35}
										step={0.01}
										disabled={!settings.noiseEnabled}
										formatValue={(value) => value.toFixed(2)}
										onChange={(value) => updateSetting('noiseOpacity', value)}
									/>
									<RangeInput
										label="Fine Noise Frequency"
										value={settings.noiseFrequency}
										min={0.1}
										max={2.2}
										step={0.05}
										disabled={!settings.noiseEnabled}
										formatValue={(value) => value.toFixed(2)}
										onChange={(value) => updateSetting('noiseFrequency', value)}
									/>
									<RangeInput
										label="Coarse Noise Opacity"
										value={settings.coarseNoiseOpacity}
										min={0}
										max={0.2}
										step={0.005}
										disabled={!settings.noiseEnabled}
										formatValue={(value) => value.toFixed(3)}
										onChange={(value) =>
											updateSetting('coarseNoiseOpacity', value)
										}
									/>
									<RangeInput
										label="Coarse Noise Frequency"
										value={settings.coarseNoiseFrequency}
										min={0.01}
										max={0.5}
										step={0.01}
										disabled={!settings.noiseEnabled}
										formatValue={(value) => value.toFixed(2)}
										onChange={(value) =>
											updateSetting('coarseNoiseFrequency', value)
										}
									/>
								</EffectPresetCard>
							</PanelSection>

							<PanelSection
								title="Advanced FX"
								subtitle="Distortion, fusion, bloom, posterize, and caustics"
								defaultOpen={false}
							>
								<EffectPresetCard
									title="Liquid Warp"
									subtitle="Distortion intensity and tempo"
									effectKey="warp"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
								>
									<RangeInput
										label="Warp Amount"
										value={settings.warpAmount}
										min={0}
										max={60}
										disabled={!settings.warpEnabled}
										onChange={(value) => updateSetting('warpAmount', value)}
									/>
									<RangeInput
										label="Warp Speed"
										value={settings.warpSpeed}
										min={0.1}
										max={2.2}
										step={0.05}
										disabled={!settings.warpEnabled}
										formatValue={(value) => `${value.toFixed(2)}x`}
										onChange={(value) => updateSetting('warpSpeed', value)}
									/>
									<RangeInput
										label="Warp Frequency"
										value={settings.warpBaseFrequency}
										min={0.001}
										max={0.02}
										step={0.001}
										disabled={!settings.warpEnabled}
										formatValue={(value) => value.toFixed(3)}
										onChange={(value) =>
											updateSetting('warpBaseFrequency', value)
										}
									/>
								</EffectPresetCard>

								<EffectPresetCard
									title="Metaball Melt"
									subtitle="Shape fusion and threshold"
									effectKey="metaball"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
								>
									<RangeInput
										label="Melt Blur"
										value={settings.metaballBlur}
										min={0}
										max={60}
										disabled={!settings.metaballEnabled}
										onChange={(value) => updateSetting('metaballBlur', value)}
									/>
									<RangeInput
										label="Melt Threshold"
										value={settings.metaballThreshold}
										min={0.2}
										max={1}
										step={0.02}
										disabled={!settings.metaballEnabled}
										formatValue={(value) => value.toFixed(2)}
										onChange={(value) =>
											updateSetting('metaballThreshold', value)
										}
									/>
								</EffectPresetCard>

								<EffectPresetCard
									title="Bloom"
									subtitle="Highlight threshold and spread"
									effectKey="bloom"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
								>
									<RangeInput
										label="Bloom Threshold"
										value={settings.bloomThreshold}
										min={0}
										max={1}
										step={0.02}
										disabled={!settings.bloomEnabled}
										formatValue={(value) => value.toFixed(2)}
										onChange={(value) => updateSetting('bloomThreshold', value)}
									/>
									<RangeInput
										label="Bloom Radius"
										value={settings.bloomRadius}
										min={0}
										max={120}
										disabled={!settings.bloomEnabled}
										onChange={(value) => updateSetting('bloomRadius', value)}
									/>
									<RangeInput
										label="Bloom Intensity"
										value={settings.bloomIntensity}
										min={0}
										max={1.5}
										step={0.02}
										disabled={!settings.bloomEnabled}
										formatValue={(value) => value.toFixed(2)}
										onChange={(value) => updateSetting('bloomIntensity', value)}
									/>
								</EffectPresetCard>

								<EffectPresetCard
									title="Posterize"
									subtitle="Band count and graphic strength"
									effectKey="posterize"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
								>
									<RangeInput
										label="Posterize Levels"
										value={settings.posterizeLevels}
										min={2}
										max={12}
										disabled={!settings.posterizeEnabled}
										onChange={(value) =>
											updateSetting('posterizeLevels', value)
										}
									/>
									<RangeInput
										label="Posterize Opacity"
										value={settings.posterizeOpacity}
										min={0}
										max={1}
										step={0.02}
										disabled={!settings.posterizeEnabled}
										formatValue={(value) => value.toFixed(2)}
										onChange={(value) =>
											updateSetting('posterizeOpacity', value)
										}
									/>
								</EffectPresetCard>

								<EffectPresetCard
									title="Caustic Light"
									subtitle="Refractive texture intensity"
									effectKey="caustic"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
								>
									<RangeInput
										label="Caustic Intensity"
										value={settings.causticIntensity}
										min={0}
										max={1}
										step={0.02}
										disabled={!settings.causticEnabled}
										formatValue={(value) => value.toFixed(2)}
										onChange={(value) =>
											updateSetting('causticIntensity', value)
										}
									/>
									<RangeInput
										label="Caustic Scale"
										value={settings.causticScale}
										min={0.002}
										max={0.04}
										step={0.001}
										disabled={!settings.causticEnabled}
										formatValue={(value) => value.toFixed(3)}
										onChange={(value) => updateSetting('causticScale', value)}
									/>
									<RangeInput
										label="Caustic Speed"
										value={settings.causticSpeed}
										min={0.05}
										max={2.5}
										step={0.05}
										disabled={!settings.causticEnabled}
										formatValue={(value) => `${value.toFixed(2)}x`}
										onChange={(value) => updateSetting('causticSpeed', value)}
									/>
								</EffectPresetCard>
							</PanelSection>

							<PanelSection
								title="Depth and Styling"
								subtitle="Parallax, sweep, fringe, vignette, and drift"
								defaultOpen={false}
							>
								<EffectPresetCard
									title="Depth Parallax"
									subtitle="Layer stacking and depth strength"
									effectKey="depth"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
								>
									<RangeInput
										label="Depth Layers"
										value={settings.depthLayers}
										min={1}
										max={6}
										disabled={!settings.depthEnabled}
										onChange={(value) => updateSetting('depthLayers', value)}
									/>
									<RangeInput
										label="Depth Strength"
										value={settings.depthStrength}
										min={0}
										max={1.5}
										step={0.05}
										disabled={!settings.depthEnabled}
										formatValue={(value) => value.toFixed(2)}
										onChange={(value) => updateSetting('depthStrength', value)}
									/>
								</EffectPresetCard>

								<EffectPresetCard
									title="Chromatic Fringe"
									subtitle="RGB channel split applied across the scene"
									effectKey="fringe"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
								>
									<RangeInput
										label="Fringe Amount"
										value={settings.fringeAmount}
										min={0}
										max={8}
										step={0.1}
										disabled={!settings.fringeEnabled}
										formatValue={(value) => value.toFixed(1)}
										onChange={(value) => updateSetting('fringeAmount', value)}
									/>
								</EffectPresetCard>

								<EffectPresetCard
									title="Light Sweep"
									subtitle="Directional beam intensity and speed"
									effectKey="sweep"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
								>
									<RangeInput
										label="Sweep Intensity"
										value={settings.sweepIntensity}
										min={0}
										max={1}
										step={0.02}
										disabled={!settings.sweepEnabled}
										formatValue={(value) => value.toFixed(2)}
										onChange={(value) => updateSetting('sweepIntensity', value)}
									/>
									<RangeInput
										label="Sweep Width"
										value={settings.sweepWidth}
										min={0.08}
										max={0.6}
										step={0.01}
										disabled={!settings.sweepEnabled}
										formatValue={(value) => value.toFixed(2)}
										onChange={(value) => updateSetting('sweepWidth', value)}
									/>
									<RangeInput
										label="Sweep Speed"
										value={settings.sweepSpeed}
										min={0.1}
										max={2.2}
										step={0.05}
										disabled={!settings.sweepEnabled}
										formatValue={(value) => `${value.toFixed(2)}x`}
										onChange={(value) => updateSetting('sweepSpeed', value)}
									/>
									<RangeInput
										label="Sweep Angle"
										value={settings.sweepAngle}
										min={-90}
										max={90}
										step={1}
										disabled={!settings.sweepEnabled}
										formatValue={(value) => `${value.toFixed(0)}deg`}
										onChange={(value) => updateSetting('sweepAngle', value)}
									/>
								</EffectPresetCard>

								<EffectPresetCard
									title="Hue Rotate"
									subtitle="Global hue cycle and color spin"
									effectKey="hueRotate"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
								>
									<RangeInput
										label="Hue Degrees"
										value={settings.hueRotateDegrees}
										min={0}
										max={360}
										step={1}
										disabled={!settings.hueRotateEnabled}
										formatValue={(value) => `${value.toFixed(0)}deg`}
										onChange={(value) =>
											updateSetting('hueRotateDegrees', value)
										}
									/>
									<RangeInput
										label="Hue Cycle Speed"
										value={settings.hueRotateSpeed}
										min={0}
										max={2.5}
										step={0.05}
										disabled={!settings.hueRotateEnabled}
										formatValue={(value) => `${value.toFixed(2)}x`}
										onChange={(value) => updateSetting('hueRotateSpeed', value)}
									/>
								</EffectPresetCard>

								<EffectPresetCard
									title="Vignette"
									subtitle="Edge darkening and tone"
									effectKey="vignette"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
								>
									<RangeInput
										label="Vignette Amount"
										value={settings.vignetteAmount}
										min={0}
										max={1}
										step={0.02}
										disabled={!settings.vignetteEnabled}
										formatValue={(value) => value.toFixed(2)}
										onChange={(value) => updateSetting('vignetteAmount', value)}
									/>
									<label className="block text-[11px] uppercase tracking-[0.16em] text-slate-300/80">
										<span>Vignette Color</span>
										<input
											type="color"
											value={settings.vignetteColor}
											disabled={!settings.vignetteEnabled}
											onChange={(event) =>
												updateSetting('vignetteColor', event.target.value)
											}
											className="mt-1.5 h-10 w-full cursor-pointer rounded-xl border border-white/20 bg-slate-950/80 p-1 disabled:cursor-not-allowed disabled:opacity-45"
										/>
									</label>
								</EffectPresetCard>

								<EffectPresetCard
									title="Palette Drift"
									subtitle="Animated hue drift amount"
									effectKey="paletteDrift"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
								>
									<RangeInput
										label="Palette Drift Speed"
										value={settings.paletteDriftSpeed}
										min={0.05}
										max={1.2}
										step={0.01}
										disabled={!settings.paletteDriftEnabled}
										formatValue={(value) => `${value.toFixed(2)}x`}
										onChange={(value) =>
											updateSetting('paletteDriftSpeed', value)
										}
									/>
								</EffectPresetCard>
							</PanelSection>
						</div>
					</aside>
				</>
			) : (
				<button
					type="button"
					onClick={() => setControlsOpen(true)}
					className="absolute right-4 top-4 z-30 cursor-pointer rounded-full border border-white/25 bg-slate-950/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:bg-slate-900/90"
				>
					Show Controls
				</button>
			)}
		</main>
	);
}
