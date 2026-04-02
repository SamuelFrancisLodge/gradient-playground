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

type MenuTone = 'dark' | 'light';

type GuideTopicKey = 'workflow' | 'ratios' | 'seed' | 'effects' | 'performance';

type GuideTopic = {
	key: GuideTopicKey;
	title: string;
	summary: string;
	details: string[];
};

const GUIDE_TOPICS: GuideTopic[] = [
	{
		key: 'workflow',
		title: 'Studio Workflow',
		summary:
			'Use presets first, then fine-tune controls for polish. Save custom sets when a look feels right.',
		details: [
			'Start with Style, Gradient, and Motion presets to establish direction quickly.',
			'Use Layout controls to tune circle density and radius balance before deep FX work.',
			'After refining, save custom presets so the same visual language is reusable.',
		],
	},
	{
		key: 'ratios',
		title: 'Gradient Ratios',
		summary:
			'Locks preserve selected swatch percentages while unlocked swatches absorb the remaining ratio.',
		details: [
			'Type exact percentages for precision while sliders remain fast for rough exploration.',
			'Lock key anchor colors before experimenting with secondary tones.',
			'Use Rebalance to distribute only unlocked colors evenly.',
		],
	},
	{
		key: 'seed',
		title: 'Deterministic Seed',
		summary:
			'Seed values make shape placement and motion repeatable, which is ideal for iteration and sharing.',
		details: [
			'When seed lock is on, the same token recreates the same composition.',
			'Reroll creates a fresh scene while keeping your current control values.',
			'Use meaningful seed names to track variants during design reviews.',
		],
	},
	{
		key: 'effects',
		title: 'Effect Stacking',
		summary:
			'Blend a few effects intentionally instead of maxing everything at once.',
		details: [
			'Core FX build the base mood; advanced FX should be layered one at a time.',
			'Depth, fringe, and sweep are strong stylizers and can easily dominate a scene.',
			'Tweak one effect family at a time to isolate visual changes cleanly.',
		],
	},
	{
		key: 'performance',
		title: 'Performance Tuning',
		summary:
			'Heavy combinations can increase render cost, especially with high blur and distortion settings.',
		details: [
			'Keep circle count and blur values moderate when multiple advanced FX are enabled.',
			'Disable unused effect groups to recover headroom before final tuning.',
			'Watch Render status and dial down expensive passes when the scene turns heavy.',
		],
	},
];

function TooltipBadge({
	text,
	tone = 'dark',
}: {
	text?: string;
	tone?: MenuTone;
}) {
	if (!text) {
		return null;
	}

	const isLight = tone === 'light';

	return (
		<span
			title={text}
			aria-label={text}
			className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold leading-none ${
				isLight
					? 'border border-amber-300 bg-amber-100 text-amber-800'
					: 'border border-cyan-300/35 bg-cyan-500/15 text-cyan-100'
			}`}
		>
			?
		</span>
	);
}

type ConceptGuidePanelProps = {
	tone: MenuTone;
	activeTopic: GuideTopicKey;
	onSelectTopic: (topic: GuideTopicKey) => void;
	onClose: () => void;
	compact?: boolean;
};

function ConceptGuidePanel({
	tone,
	activeTopic,
	onSelectTopic,
	onClose,
	compact = false,
}: ConceptGuidePanelProps) {
	const isLight = tone === 'light';
	const topic =
		GUIDE_TOPICS.find((entry) => entry.key === activeTopic) ?? GUIDE_TOPICS[0];

	return (
		<div
			className={`rounded-3xl border p-4 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-colors duration-500 ${
				isLight
					? 'border-amber-200/90 bg-[#fff9ef]/93 text-amber-950 shadow-[0_16px_44px_rgba(109,66,17,0.18)]'
					: 'border-white/18 bg-slate-950/82 text-slate-100'
			}`}
		>
			<div className="mb-3 flex items-start justify-between gap-3">
				<div>
					<p
						className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
							isLight ? 'text-cyan-700' : 'text-cyan-100/85'
						}`}
					>
						Concept Guide
					</p>
					<p
						className={`mt-1 text-xs ${
							isLight ? 'text-amber-800/85' : 'text-slate-300/75'
						}`}
					>
						Use tooltips for tiny hints and this panel for deeper context.
					</p>
				</div>
				<button
					type="button"
					onClick={onClose}
					title="Hide concept guide"
					className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
						isLight
							? 'border-amber-300 bg-[#fff1df] text-amber-900 hover:bg-[#ffe8cf]'
							: 'border-white/25 bg-white/5 text-white/85 hover:bg-white/10'
					}`}
				>
					Hide
				</button>
			</div>

			<div
				className={`grid gap-2 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}
			>
				{GUIDE_TOPICS.map((entry) => {
					const isActive = entry.key === topic.key;

					return (
						<button
							key={entry.key}
							type="button"
							onClick={() => onSelectTopic(entry.key)}
							title={entry.summary}
							className={`w-full rounded-xl border px-3 py-2 text-left text-xs font-semibold uppercase tracking-widest transition ${
								isActive
									? isLight
										? 'border-cyan-400 bg-cyan-100/80 text-cyan-900'
										: 'border-cyan-300/45 bg-cyan-500/20 text-cyan-100'
									: isLight
										? 'border-amber-200 bg-[#fffdf7] text-amber-900 hover:bg-[#fff3e2]'
										: 'border-white/15 bg-slate-900/55 text-slate-100 hover:bg-slate-900/75'
							}`}
						>
							{entry.title}
						</button>
					);
				})}
			</div>

			<div
				className={`mt-3 rounded-2xl border p-3 ${
					isLight
						? 'border-amber-200/80 bg-[#fff4e6]'
						: 'border-white/12 bg-slate-900/62'
				}`}
			>
				<p className="text-sm font-semibold">{topic.title}</p>
				<p
					className={`mt-1 text-xs leading-relaxed ${
						isLight ? 'text-amber-900/85' : 'text-slate-300/80'
					}`}
				>
					{topic.summary}
				</p>
				<ul
					className={`mt-2 space-y-1.5 text-xs ${
						isLight ? 'text-amber-900/85' : 'text-slate-200/85'
					}`}
				>
					{topic.details.map((detail) => (
						<li key={detail} className="flex items-start gap-2 leading-relaxed">
							<span className="pt-px">-</span>
							<span>{detail}</span>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

type EffectPresetCardProps = {
	title: string;
	subtitle: string;
	quickHint?: string;
	effectKey: EffectPresetKey;
	presetCatalog: EffectPresetCatalog;
	presetSelections: EffectPresetSelectionState;
	onApplyPreset: (effect: EffectPresetKey, key: string) => void;
	onSavePreset: (effect: EffectPresetKey) => void;
	tone?: MenuTone;
	children: ReactNode;
};

type GlobalProfileControlProps = {
	title: string;
	subtitle: string;
	quickHint?: string;
	group: PresetGroupKey;
	presetCatalog: PresetCatalog;
	presetSelections: PresetSelectionState;
	onApplyProfile: (group: PresetGroupKey, key: string) => void;
	onSaveProfile?: (group: PresetGroupKey) => void;
	showSaveButton?: boolean;
	tone?: MenuTone;
};

function GlobalProfileControl({
	title,
	subtitle,
	quickHint,
	group,
	presetCatalog,
	presetSelections,
	onApplyProfile,
	onSaveProfile,
	showSaveButton = false,
	tone = 'dark',
}: GlobalProfileControlProps) {
	const isLight = tone === 'light';
	const selectedKey = presetSelections[group];
	const selected = presetCatalog[group].find(
		(entry) => entry.key === selectedKey,
	);

	return (
		<div
			className={`rounded-xl border p-4 transition-colors duration-500 ${
				isLight
					? 'border-amber-200 bg-[#fffaf2]/90'
					: 'border-white/12 bg-slate-950/40'
			}`}
		>
			<div className="flex items-center gap-2">
				<p
					className={`text-[10px] uppercase tracking-[0.15em] ${
						isLight ? 'text-cyan-700' : 'text-cyan-100/85'
					}`}
				>
					{title}
				</p>
				<TooltipBadge text={quickHint} tone={tone} />
			</div>
			<p
				className={`mt-1.5 text-xs ${
					isLight ? 'text-amber-800/85' : 'text-slate-300/75'
				}`}
			>
				{subtitle}
			</p>
			<div
				className={`mt-3 ${
					showSaveButton ? 'grid grid-cols-[minmax(0,1fr)_auto] gap-2' : ''
				}`}
			>
				<SelectInput
					hideLabel
					tone={tone}
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
				{showSaveButton && onSaveProfile ? (
					<button
						type="button"
						onClick={() => onSaveProfile(group)}
						title="Save the current values as your custom preset for this group."
						className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
							isLight
								? 'border-cyan-300 bg-cyan-100/85 text-cyan-800 hover:bg-cyan-200/85'
								: 'border-cyan-300/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25'
						}`}
					>
						Save Custom
					</button>
				) : null}
			</div>
			<p
				className={`mt-3 text-xs ${
					isLight ? 'text-amber-800/85' : 'text-slate-300/75'
				}`}
			>
				{selectedKey === CUSTOM_PRESET_KEY
					? 'Manual preset values.'
					: (selected?.description ?? 'Choose an option.')}
			</p>
		</div>
	);
}

function EffectPresetCard({
	title,
	subtitle,
	quickHint,
	effectKey,
	presetCatalog,
	presetSelections,
	onApplyPreset,
	onSavePreset,
	tone = 'dark',
	children,
}: EffectPresetCardProps) {
	const isLight = tone === 'light';
	const selectedKey = presetSelections[effectKey];
	const selected = presetCatalog[effectKey].find(
		(preset) => preset.key === selectedKey,
	);

	return (
		<div
			className={`rounded-xl border p-4 transition-colors duration-500 ${
				isLight
					? 'border-amber-200 bg-[#fffaf2]/90'
					: 'border-white/12 bg-slate-950/40'
			}`}
		>
			<div className="mb-4">
				<div className="flex items-center gap-2">
					<p
						className={`text-[10px] uppercase tracking-[0.15em] ${
							isLight ? 'text-cyan-700' : 'text-cyan-100/85'
						}`}
					>
						{title}
					</p>
					<TooltipBadge text={quickHint} tone={tone} />
				</div>
				<p
					className={`mt-1.5 text-xs ${
						isLight ? 'text-amber-800/85' : 'text-slate-300/75'
					}`}
				>
					{subtitle}
				</p>
			</div>
			<div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
				<SelectInput
					hideLabel
					tone={tone}
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
					title="Save the current values as your custom preset for this effect."
					className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
						isLight
							? 'border-cyan-300 bg-cyan-100/85 text-cyan-800 hover:bg-cyan-200/85'
							: 'border-cyan-300/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25'
					}`}
				>
					Save Custom
				</button>
			</div>
			<p
				className={`mt-3 text-xs ${
					isLight ? 'text-amber-800/85' : 'text-slate-300/75'
				}`}
			>
				{selectedKey === CUSTOM_PRESET_KEY
					? 'Manual preset values.'
					: (selected?.description ?? 'Choose a preset.')}
			</p>
			<div className="mt-4 space-y-4">{children}</div>
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
		togglePaletteLock,
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
	const [menuTone, setMenuTone] = useState<MenuTone>(() => {
		if (typeof window === 'undefined') {
			return 'dark';
		}

		const stored = window.localStorage.getItem('gradient-studio.menu-tone.v1');
		if (stored === 'light' || stored === 'dark') {
			return stored;
		}

		return 'dark';
	});
	const [guideOpen, setGuideOpen] = useState<boolean>(() => {
		if (typeof window === 'undefined') {
			return false;
		}

		return window.localStorage.getItem('gradient-studio.guide-open.v1') === '1';
	});
	const [activeGuideTopic, setActiveGuideTopic] =
		useState<GuideTopicKey>('workflow');
	const controlsPanelRef = useRef<HTMLElement | null>(null);
	const controlsScrollTopRef = useRef(0);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		window.localStorage.setItem('gradient-studio.menu-tone.v1', menuTone);
	}, [menuTone]);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		window.localStorage.setItem(
			'gradient-studio.guide-open.v1',
			guideOpen ? '1' : '0',
		);
	}, [guideOpen]);

	useEffect(() => {
		if (!controlsOpen || !controlsPanelRef.current) {
			return;
		}

		controlsPanelRef.current.scrollTop = controlsScrollTopRef.current;
	}, [controlsOpen]);

	const isLightMenu = menuTone === 'light';

	const renderToneClass = isLightMenu
		? renderLoad.label === 'Heavy'
			? 'text-rose-700'
			: renderLoad.label === 'Balanced'
				? 'text-amber-700'
				: 'text-emerald-700'
		: renderLoad.label === 'Heavy'
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
				<section
					className={`absolute left-3 top-3 z-20 max-w-[min(34rem,calc(100vw-1.5rem))] rounded-3xl border p-5 shadow-[0_25px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl transition-colors duration-500 sm:left-5 sm:top-5 sm:p-6 ${
						isLightMenu
							? 'border-amber-200/70 bg-[#fff8ed]/88 text-amber-950'
							: 'border-white/20 bg-slate-950/60'
					}`}
				>
					<div className="mb-3 flex items-start justify-between gap-3">
						<p
							className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${
								isLightMenu ? 'text-cyan-700' : 'text-cyan-100/90'
							}`}
						>
							Gradient Studio
						</p>
						<button
							type="button"
							onClick={() => setHeadingVisible(false)}
							className={`cursor-pointer rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
								isLightMenu
									? 'border-amber-300 bg-[#fff4e5] text-amber-900 hover:bg-[#ffecd8]'
									: 'border-white/25 bg-white/5 text-white/90 hover:bg-white/10'
							}`}
						>
							Hide Heading
						</button>
					</div>
					<h1
						className={`text-3xl font-semibold tracking-tight sm:text-4xl ${
							isLightMenu ? 'text-amber-950' : 'text-white'
						}`}
					>
						Interactive Gradient Playground
					</h1>
					<p
						className={`mt-3 text-sm leading-relaxed sm:text-base ${
							isLightMenu ? 'text-amber-900/85' : 'text-slate-200/85'
						}`}
					>
						Craft animated gradient scenes with stacked effects, profile groups,
						palette thumbnails, and deterministic seeds.
					</p>
					<div className="mt-4 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
						<TinyStat
							label="Palette"
							value={`${activePaletteCount}/${settings.palette.length} active`}
							tone={menuTone}
						/>
						<TinyStat
							label="Effects"
							value={`${activeEffectsCount} active`}
							tone={menuTone}
						/>
						<TinyStat
							label="Motion"
							value={settings.animate ? 'Animated' : 'Static'}
							tone={menuTone}
						/>
						<TinyStat
							label="Render"
							value={renderLoad.label}
							colorClass={renderToneClass}
							tone={menuTone}
						/>
					</div>
				</section>
			) : (
				<button
					type="button"
					onClick={() => setHeadingVisible(true)}
					className={`absolute left-3 top-3 z-20 cursor-pointer rounded-full border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] shadow-[0_10px_28px_rgba(0,0,0,0.35)] transition-colors duration-500 sm:left-5 sm:top-5 ${
						isLightMenu
							? 'border-amber-300 bg-[#fff4e5] text-amber-900 hover:bg-[#ffecd8]'
							: 'border-white/25 bg-slate-950/70 text-white hover:bg-slate-900/90'
					}`}
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
					{guideOpen ? (
						<aside className="absolute right-112 top-4 z-30 hidden h-[calc(100vh-2rem)] w-80 overflow-y-auto xl:block">
							<ConceptGuidePanel
								tone={menuTone}
								activeTopic={activeGuideTopic}
								onSelectTopic={setActiveGuideTopic}
								onClose={() => setGuideOpen(false)}
							/>
						</aside>
					) : null}
					<aside
						ref={controlsPanelRef}
						className={`absolute right-3 top-3 z-30 h-[calc(100vh-1.5rem)] w-[min(26.5rem,calc(100vw-1.5rem))] overflow-y-auto rounded-3xl border p-4 shadow-[0_25px_70px_rgba(0,0,0,0.48)] backdrop-blur-2xl transition-colors duration-500 sm:right-4 sm:top-4 sm:p-5 ${
							isLightMenu
								? 'border-amber-200/70 bg-[#fff9f0]/92 text-amber-950'
								: 'border-white/20 bg-slate-950/85 text-slate-100'
						}`}
						onScroll={(event) => {
							controlsScrollTopRef.current = event.currentTarget.scrollTop;
						}}
						onClick={(event) => event.stopPropagation()}
					>
						<div className="mb-4 flex items-start justify-between gap-3">
							<div>
								<p
									className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${
										isLightMenu ? 'text-cyan-700' : 'text-cyan-100/85'
									}`}
								>
									Studio Controls
								</p>
								<p
									className={`mt-1 text-xs ${
										isLightMenu ? 'text-amber-800/85' : 'text-slate-300/80'
									}`}
								>
									Seed: {effectiveSeed}
								</p>
							</div>
							<div className="flex flex-col items-end gap-2">
								<button
									type="button"
									onClick={() =>
										setMenuTone((current) =>
											current === 'dark' ? 'light' : 'dark',
										)
									}
									title="Switch control menu between dark and light tones."
									className={`cursor-pointer rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
										isLightMenu
											? 'border-amber-300 bg-[#fff4e5] text-amber-900 hover:bg-[#ffecd8]'
											: 'border-white/25 bg-white/5 text-white/90 hover:bg-white/10'
									}`}
								>
									Menu: {isLightMenu ? 'Light' : 'Dark'}
								</button>
								<button
									type="button"
									onClick={() => setGuideOpen((current) => !current)}
									title="Toggle detailed concept help panel."
									className={`cursor-pointer rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
										isLightMenu
											? 'border-amber-300 bg-[#fff4e5] text-amber-900 hover:bg-[#ffecd8]'
											: 'border-white/25 bg-white/5 text-white/90 hover:bg-white/10'
									}`}
								>
									Guide: {guideOpen ? 'On' : 'Off'}
								</button>
								<button
									type="button"
									onClick={() => setControlsOpen(false)}
									title="Hide studio controls"
									className={`cursor-pointer rounded-full border px-3 py-1 text-xs uppercase tracking-[0.14em] transition ${
										isLightMenu
											? 'border-amber-300 bg-[#fff4e5] text-amber-900 hover:bg-[#ffecd8]'
											: 'border-white/25 bg-white/5 text-white/90 hover:bg-white/10'
									}`}
								>
									Hide
								</button>
							</div>
						</div>

						{statusMessage ? (
							<div
								className={`mb-4 rounded-xl border px-3 py-2 text-xs ${
									isLightMenu
										? 'border-cyan-300 bg-cyan-100/80 text-cyan-900'
										: 'border-cyan-300/25 bg-cyan-500/10 text-cyan-100/95'
								}`}
							>
								{statusMessage}
							</div>
						) : null}

						{guideOpen ? (
							<div className="mb-4 xl:hidden">
								<ConceptGuidePanel
									tone={menuTone}
									activeTopic={activeGuideTopic}
									onSelectTopic={setActiveGuideTopic}
									onClose={() => setGuideOpen(false)}
									compact
								/>
							</div>
						) : null}

						<div className="space-y-4 pb-2">
							<PanelSection
								title="Style"
								subtitle="Pick the visual feel and motion behavior; color is controlled separately"
								tone={menuTone}
								titleHint="High-level look and movement direction. Keep this broad, then fine-tune below."
							>
								<GlobalProfileControl
									title="Style Preset"
									subtitle="Affects look, animation, and effects without changing palette colors"
									quickHint="Fast visual mood selector without touching your gradient colors."
									group="style"
									presetCatalog={presetCatalog}
									presetSelections={presetSelections}
									onApplyProfile={applyPreset}
									tone={menuTone}
								/>
								<button
									type="button"
									onClick={() => saveCustomPreset('style')}
									title="Save the current style values as your custom style preset."
									className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
										isLightMenu
											? 'border-cyan-300 bg-cyan-100/85 text-cyan-800 hover:bg-cyan-200/85'
											: 'border-cyan-300/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25'
									}`}
								>
									Save Style Custom
								</button>
							</PanelSection>

							<PanelSection
								title="Gradient and Seed"
								subtitle="Choose a gradient preset, or Off to keep your current colors"
								tone={menuTone}
								titleHint="Use tooltips for quick actions. Open Concept Guide for ratio locks and seed strategy details."
							>
								<div className="grid gap-3 sm:grid-cols-2">
									<GlobalProfileControl
										title="Gradient Preset"
										subtitle="Off, curated gradient presets, or custom"
										quickHint="Pick a color direction instantly, then refine swatches below."
										group="palette"
										presetCatalog={presetCatalog}
										presetSelections={presetSelections}
										onApplyProfile={applyPreset}
										tone={menuTone}
									/>
									<GlobalProfileControl
										title="Seed Preset"
										subtitle="Deterministic seed strategy and lock behavior"
										quickHint="Controls repeatability so the same seed recreates the same scene."
										group="seed"
										presetCatalog={presetCatalog}
										presetSelections={presetSelections}
										onApplyProfile={applyPreset}
										tone={menuTone}
									/>
								</div>

								<PaletteEditor
									palette={settings.palette}
									onAdd={addPaletteColor}
									onRemove={removePaletteColor}
									onToggle={togglePaletteColor}
									onToggleLock={togglePaletteLock}
									onHexChange={setPaletteHex}
									onWeightChange={setPaletteWeight}
									onRebalance={rebalancePalette}
									onSaveCustom={() => saveCustomPreset('palette')}
									tone={menuTone}
								/>

								<div
									className={`rounded-xl border p-4 transition-colors duration-500 ${
										isLightMenu
											? 'border-amber-200 bg-[#fff6e8]'
											: 'border-white/12 bg-slate-950/40'
									}`}
								>
									<ToggleInput
										label="Lock Deterministic Seed"
										hint="Keep this on to preserve shape layout and motion pattern for the same seed token."
										checked={settings.seedLocked}
										tone={menuTone}
										onChange={(value) => updateSetting('seedLocked', value)}
									/>
									<label
										className={`mt-4 block text-[11px] uppercase tracking-[0.16em] ${
											isLightMenu ? 'text-amber-800/85' : 'text-slate-300/80'
										}`}
									>
										<span>Seed Token</span>
										<input
											type="text"
											value={settings.seed}
											onChange={(event) =>
												updateSetting('seed', event.target.value)
											}
											title="Any text token works. Same token plus locked seed yields repeatable output."
											className={`mt-1.5 w-full rounded-xl border px-3 py-2 text-sm normal-case tracking-normal outline-none transition ${
												isLightMenu
													? 'border-amber-200 bg-[#fffef8] text-amber-950 focus:border-cyan-500'
													: 'border-white/20 bg-slate-950/80 text-white focus:border-cyan-300/70'
											}`}
										/>
									</label>
									<div className="mt-4 grid gap-2 sm:grid-cols-3">
										<button
											type="button"
											onClick={randomizeSeed}
											title="Generate a new seed while keeping all current controls."
											className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
												isLightMenu
													? 'border-cyan-300 bg-cyan-100/85 text-cyan-800 hover:bg-cyan-200/85'
													: 'border-cyan-300/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25'
											}`}
										>
											Reroll Seed
										</button>
										<button
											type="button"
											onClick={resetToDefaults}
											title="Reset all controls to default values."
											className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
												isLightMenu
													? 'border-amber-200 bg-[#fff0dc] text-amber-900 hover:bg-[#ffe8cf]'
													: 'border-white/25 bg-white/5 text-white/90 hover:bg-white/10'
											}`}
										>
											Reset Defaults
										</button>
										<button
											type="button"
											onClick={() => saveCustomPreset('seed')}
											title="Save current seed behavior as your custom seed preset."
											className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
												isLightMenu
													? 'border-cyan-300 bg-cyan-100/85 text-cyan-800 hover:bg-cyan-200/85'
													: 'border-cyan-300/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25'
											}`}
										>
											Save Seed Custom
										</button>
									</div>
								</div>
							</PanelSection>

							<PanelSection
								title="Layout and Motion"
								subtitle="Composition density, shape family, and movement"
								tone={menuTone}
								titleHint="Layout affects composition shape. Motion controls tempo and drift energy."
							>
								<div className="grid gap-3 sm:grid-cols-2">
									<GlobalProfileControl
										title="Layout Preset"
										subtitle="Density and radius distribution"
										quickHint="Fast composition tuning for circle count and radius balance."
										group="layout"
										presetCatalog={presetCatalog}
										presetSelections={presetSelections}
										onApplyProfile={applyPreset}
										tone={menuTone}
									/>
									<GlobalProfileControl
										title="Motion Preset"
										subtitle="Animation energy and drift cadence"
										quickHint="Switch between Off and animated movement profiles quickly."
										group="motion"
										presetCatalog={presetCatalog}
										presetSelections={presetSelections}
										onApplyProfile={applyPreset}
										tone={menuTone}
									/>
								</div>

								<div className="grid gap-2 sm:grid-cols-2">
									<button
										type="button"
										onClick={() => saveCustomPreset('layout')}
										title="Save the current layout values as your custom layout preset."
										className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
											isLightMenu
												? 'border-cyan-300 bg-cyan-100/85 text-cyan-800 hover:bg-cyan-200/85'
												: 'border-cyan-300/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25'
										}`}
									>
										Save Layout Custom
									</button>
									<button
										type="button"
										onClick={() => saveCustomPreset('motion')}
										title="Save the current motion values as your custom motion preset."
										className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
											isLightMenu
												? 'border-cyan-300 bg-cyan-100/85 text-cyan-800 hover:bg-cyan-200/85'
												: 'border-cyan-300/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25'
										}`}
									>
										Save Motion Custom
									</button>
								</div>

								<RangeInput
									label="Circle Count"
									hint="Lower values produce bolder, cleaner compositions."
									value={settings.circleCount}
									min={1}
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
									hint="Allow circles to extend beyond viewport edges for a cinematic crop."
									checked={settings.allowCrop}
									onChange={(value) => updateSetting('allowCrop', value)}
								/>

								<div
									className={`rounded-xl border p-3 transition-colors duration-500 ${
										isLightMenu
											? 'border-amber-200 bg-[#fff6e8]'
											: 'border-white/12 bg-slate-950/40'
									}`}
								>
									<p
										className={`mb-2 text-[10px] uppercase tracking-[0.14em] ${
											isLightMenu ? 'text-amber-800/85' : 'text-slate-300/75'
										}`}
									>
										Shape Families
									</p>
									<div className="grid grid-cols-2 gap-2 text-xs">
										{shapeOptions.map((shape) => (
											<label
												key={shape.value}
												className={`flex cursor-pointer items-center justify-between rounded-lg border px-2.5 py-1.5 transition-colors duration-500 ${
													isLightMenu
														? 'border-amber-200 bg-[#fffdf7]'
														: 'border-white/12 bg-slate-900/60'
												}`}
											>
												<div>
													<p
														className={
															isLightMenu ? 'text-amber-950' : 'text-white/90'
														}
													>
														{shape.label}
													</p>
													<p
														className={`text-[10px] ${
															isLightMenu
																? 'text-amber-800/80'
																: 'text-slate-400'
														}`}
													>
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
									hint="Turn motion Off for still frames and deterministic snapshots."
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
								tone={menuTone}
								titleHint="Use these first. They establish softness, light bloom, and texture foundation."
							>
								<EffectPresetCard
									title="Blur"
									subtitle="Softness and diffusion"
									quickHint="Higher blur smooths gradients but can hide shape detail."
									effectKey="blur"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
									tone={menuTone}
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
									quickHint="Blend mode shifts how glow mixes with the base scene."
									effectKey="glow"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
									tone={menuTone}
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
										tone={menuTone}
										hint="Try Screen for natural bloom and Color Dodge for punchier highlights."
										onChange={(value) => updateSetting('glowBlendMode', value)}
										hideLabel
										options={GLOW_BLEND_OPTIONS}
									/>
								</EffectPresetCard>

								<EffectPresetCard
									title="Noise"
									subtitle="Fine and coarse grain"
									quickHint="Use subtle noise to avoid flat digital gradients."
									effectKey="noise"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
									tone={menuTone}
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
								tone={menuTone}
								titleHint="Powerful stylizers. Add one at a time, then rebalance intensity."
							>
								<EffectPresetCard
									title="Liquid Warp"
									subtitle="Distortion intensity and tempo"
									quickHint="Distorts geometry; too much can blur focal structure."
									effectKey="warp"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
									tone={menuTone}
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
									quickHint="Merges nearby shapes into organic blobs."
									effectKey="metaball"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
									tone={menuTone}
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
									quickHint="Lower threshold catches more highlights and can wash the scene."
									effectKey="bloom"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
									tone={menuTone}
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
									quickHint="Lower levels create a bold graphic look."
									effectKey="posterize"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
									tone={menuTone}
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
									quickHint="Adds watery light refraction detail across the scene."
									effectKey="caustic"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
									tone={menuTone}
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
								tone={menuTone}
								titleHint="Scene-level stylizers. Use subtle values for polish, higher values for experimental looks."
							>
								<EffectPresetCard
									title="Depth Parallax"
									subtitle="Layer stacking and depth strength"
									quickHint="Creates perceived depth by layering movement and blur cues."
									effectKey="depth"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
									tone={menuTone}
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
									quickHint="Small values feel optical. Large values push stylized glitch energy."
									effectKey="fringe"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
									tone={menuTone}
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
									quickHint="Adds directional cinematic lighting movement."
									effectKey="sweep"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
									tone={menuTone}
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
									quickHint="Useful for slow ambient color cycling across the whole scene."
									effectKey="hueRotate"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
									tone={menuTone}
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
									quickHint="Use gently for focus; strong values create dramatic framing."
									effectKey="vignette"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
									tone={menuTone}
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
									<label
										className={`block text-[11px] uppercase tracking-[0.16em] ${
											isLightMenu ? 'text-amber-800/85' : 'text-slate-300/80'
										}`}
									>
										<span>Vignette Color</span>
										<input
											type="color"
											value={settings.vignetteColor}
											disabled={!settings.vignetteEnabled}
											onChange={(event) =>
												updateSetting('vignetteColor', event.target.value)
											}
											title="Choose the edge tint used by the vignette effect."
											className={`mt-1.5 h-10 w-full cursor-pointer rounded-xl border p-1 disabled:cursor-not-allowed disabled:opacity-45 ${
												isLightMenu
													? 'border-amber-200 bg-[#fffdf7]'
													: 'border-white/20 bg-slate-950/80'
											}`}
										/>
									</label>
								</EffectPresetCard>

								<EffectPresetCard
									title="Palette Drift"
									subtitle="Animated hue drift amount"
									quickHint="Slow drift keeps scenes alive without obvious hue cycling."
									effectKey="paletteDrift"
									presetCatalog={effectPresetCatalog}
									presetSelections={effectPresetSelections}
									onApplyPreset={applyEffectPreset}
									onSavePreset={saveCustomEffectPreset}
									tone={menuTone}
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
					className={`absolute right-4 top-4 z-30 cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-colors duration-500 ${
						isLightMenu
							? 'border-amber-300 bg-[#fff4e5] text-amber-900 hover:bg-[#ffecd8]'
							: 'border-white/25 bg-slate-950/75 text-white hover:bg-slate-900/90'
					}`}
				>
					Show Controls
				</button>
			)}
		</main>
	);
}
