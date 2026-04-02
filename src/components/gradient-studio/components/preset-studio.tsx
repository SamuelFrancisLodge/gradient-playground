import { SelectInput } from '@/components/gradient-studio/components/control-primitives';
import type {
	PresetCatalog,
	PresetGroupKey,
	PresetSelectionState,
} from '@/components/gradient-studio/types';

type PresetStudioProps = {
	presetCatalog: PresetCatalog;
	presetSelections: PresetSelectionState;
	onApplyPreset: (group: PresetGroupKey, key: string) => void;
	onApplyAll: () => void;
	onReset: () => void;
};

const PRESET_GROUP_LABELS: Record<
	PresetGroupKey,
	{ label: string; subtitle: string }
> = {
	style: {
		label: 'Style',
		subtitle: 'Look direction (does not change palette)',
	},
	layout: {
		label: 'Layout',
		subtitle: 'Shape scale and composition',
	},
	motion: {
		label: 'Motion',
		subtitle: 'Animation tempo and intensity',
	},
	palette: {
		label: 'Palette',
		subtitle: 'Color swatch pack only',
	},
	seed: {
		label: 'Seed',
		subtitle: 'Deterministic layout identity',
	},
};

const PRESET_GROUP_ORDER: PresetGroupKey[] = [
	'style',
	'layout',
	'motion',
	'palette',
	'seed',
];

export function PresetStudio({
	presetCatalog,
	presetSelections,
	onApplyPreset,
	onApplyAll,
	onReset,
}: PresetStudioProps) {
	return (
		<div className="space-y-3">
			<div className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100/90">
				Style changes rendering behavior. Palette only swaps swatches.
			</div>

			{PRESET_GROUP_ORDER.map((group) => {
				const meta = PRESET_GROUP_LABELS[group];
				const selectedKey = presetSelections[group];
				const selected = presetCatalog[group].find(
					(preset) => preset.key === selectedKey,
				);

				return (
					<div
						key={group}
						className="rounded-xl border border-white/12 bg-slate-950/50 p-3"
					>
						<div className="mb-2">
							<p className="text-[10px] uppercase tracking-[0.16em] text-cyan-100/80">
								{meta.label}
							</p>
							<p className="mt-1 text-xs text-slate-300/75">{meta.subtitle}</p>
						</div>
						<SelectInput
							label="Choice"
							value={selectedKey}
							onChange={(value) => onApplyPreset(group, value)}
							options={presetCatalog[group].map((preset) => ({
								label: preset.label,
								value: preset.key,
							}))}
						/>
						<p className="mt-2 text-xs text-slate-300/75">
							{selected?.description ?? 'Choose an option.'}
						</p>
					</div>
				);
			})}

			<div className="grid grid-cols-2 gap-2 pt-1">
				<button
					type="button"
					onClick={onApplyAll}
					className="cursor-pointer rounded-xl border border-cyan-300/30 bg-cyan-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-500/25"
				>
					Apply Choices
				</button>
				<button
					type="button"
					onClick={onReset}
					className="cursor-pointer rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
				>
					Reset
				</button>
			</div>
		</div>
	);
}
