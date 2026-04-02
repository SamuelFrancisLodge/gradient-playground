import type { PaletteSwatch } from '@/components/gradient-studio/types';

type MenuTone = 'dark' | 'light';

type PaletteEditorProps = {
	palette: PaletteSwatch[];
	onAdd: () => void;
	onRemove: (id: string) => void;
	onToggle: (id: string, enabled: boolean) => void;
	onToggleLock: (id: string, locked: boolean) => void;
	onHexChange: (id: string, hex: string) => void;
	onWeightChange: (id: string, weight: number) => void;
	onRebalance: () => void;
	onSaveCustom: () => void;
	tone?: MenuTone;
};

export function PaletteEditor({
	palette,
	onAdd,
	onRemove,
	onToggle,
	onToggleLock,
	onHexChange,
	onWeightChange,
	onRebalance,
	onSaveCustom,
	tone = 'dark',
}: PaletteEditorProps) {
	const isLight = tone === 'light';
	const cardClass = isLight
		? 'rounded-xl border border-slate-300 bg-white/85 p-3'
		: 'rounded-xl border border-white/20 bg-slate-950/55 p-3';
	const mutedTextClass = isLight ? 'text-slate-600' : 'text-slate-300';
	const valueTextClass = isLight ? 'text-slate-900' : 'text-white/95';
	const actionButtonBase =
		'cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition';

	return (
		<div className="space-y-4">
			<div className="space-y-3">
				{palette.map((swatch) => (
					<div
						key={swatch.id}
						className={`${cardClass} ${swatch.enabled ? '' : 'opacity-70'}`}
					>
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<input
									type="color"
									value={swatch.hex}
									onChange={(event) =>
										onHexChange(swatch.id, event.target.value)
									}
									className={`h-9 w-9 cursor-pointer rounded-md border p-0 ${
										isLight
											? 'border-slate-300 bg-white'
											: 'border-white/25 bg-transparent'
									}`}
								/>
								<p className={`font-mono text-xs ${valueTextClass}`}>
									{swatch.hex}
								</p>
							</div>
							<div className="flex items-center gap-1.5">
								<label
									className={`inline-flex cursor-pointer items-center gap-1 text-xs ${mutedTextClass}`}
								>
									<input
										type="checkbox"
										checked={swatch.enabled}
										onChange={(event) =>
											onToggle(swatch.id, event.target.checked)
										}
										className="h-4 w-4 cursor-pointer accent-cyan-400"
									/>
									Active
								</label>
								<button
									type="button"
									onClick={() => onToggleLock(swatch.id, !swatch.locked)}
									className={`cursor-pointer rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
										swatch.locked
											? isLight
												? 'border-indigo-400 bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/15'
												: 'border-indigo-300/40 bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/25'
											: isLight
												? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
												: 'border-white/20 bg-white/5 text-slate-200 hover:bg-white/10'
									}`}
								>
									{swatch.locked ? 'Locked' : 'Lock'}
								</button>
								<button
									type="button"
									onClick={() => onRemove(swatch.id)}
									className={`cursor-pointer rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
										isLight
											? 'border-rose-300 bg-rose-100/80 text-rose-700 hover:bg-rose-200/90'
											: 'border-rose-300/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20'
									}`}
								>
									Remove
								</button>
							</div>
						</div>

						<div className="mt-3">
							<div
								className={`mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] ${
									isLight ? 'text-slate-600' : 'text-slate-300/75'
								}`}
							>
								<span>Weight</span>
								<span
									className={`font-mono text-[12px] normal-case tracking-normal ${valueTextClass}`}
								>
									{(swatch.weight * 100).toFixed(1)}%
								</span>
							</div>
							<div className="grid grid-cols-[minmax(0,1fr)_5.5rem] items-center gap-2">
								<input
									type="range"
									min={0}
									max={1}
									step={0.01}
									value={swatch.weight}
									onChange={(event) =>
										onWeightChange(swatch.id, Number(event.target.value))
									}
									className="w-full cursor-pointer accent-cyan-400"
								/>
								<label
									className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${
										isLight
											? 'border-slate-300 bg-white text-slate-700'
											: 'border-white/20 bg-slate-900/70 text-slate-200'
									}`}
								>
									<input
										type="number"
										min={0}
										max={100}
										step={0.1}
										value={(swatch.weight * 100).toFixed(1)}
										onChange={(event) =>
											onWeightChange(
												swatch.id,
												Number(event.target.value) / 100,
											)
										}
										className="w-full bg-transparent text-right text-xs font-semibold outline-none"
									/>
									<span className="text-[11px]">%</span>
								</label>
							</div>
						</div>
					</div>
				))}
			</div>

			<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
				<button
					type="button"
					onClick={onAdd}
					className={`${actionButtonBase} ${
						isLight
							? 'border border-emerald-300 bg-emerald-100/80 text-emerald-700 hover:bg-emerald-200/80'
							: 'border border-emerald-300/30 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25'
					}`}
				>
					Add Gradient
				</button>
				<button
					type="button"
					onClick={onRebalance}
					className={`${actionButtonBase} ${
						isLight
							? 'border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
							: 'border border-white/20 bg-white/5 text-white hover:bg-white/10'
					}`}
				>
					Rebalance
				</button>
				<button
					type="button"
					onClick={onSaveCustom}
					className={`${actionButtonBase} ${
						isLight
							? 'border border-cyan-300 bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
							: 'border border-cyan-300/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25'
					}`}
				>
					Save Custom
				</button>
			</div>
		</div>
	);
}
