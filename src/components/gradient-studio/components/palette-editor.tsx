import type { PaletteSwatch } from '@/components/gradient-studio/types';

type PaletteEditorProps = {
	palette: PaletteSwatch[];
	onAdd: () => void;
	onRemove: (id: string) => void;
	onToggle: (id: string, enabled: boolean) => void;
	onHexChange: (id: string, hex: string) => void;
	onWeightChange: (id: string, weight: number) => void;
	onRebalance: () => void;
};

export function PaletteEditor({
	palette,
	onAdd,
	onRemove,
	onToggle,
	onHexChange,
	onWeightChange,
	onRebalance,
}: PaletteEditorProps) {
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				<button
					type="button"
					onClick={onAdd}
					className="cursor-pointer rounded-xl border border-emerald-300/30 bg-emerald-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100 transition hover:bg-emerald-500/25"
				>
					Add Color
				</button>
				<button
					type="button"
					onClick={onRebalance}
					className="cursor-pointer rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
				>
					Rebalance
				</button>
			</div>

			<div className="space-y-2">
				{palette.map((swatch) => (
					<div
						key={swatch.id}
						className={`rounded-xl border p-3 ${swatch.enabled ? 'border-white/20 bg-slate-950/55' : 'border-white/10 bg-slate-950/30 opacity-70'}`}
					>
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-2">
								<input
									type="color"
									value={swatch.hex}
									onChange={(event) =>
										onHexChange(swatch.id, event.target.value)
									}
									className="h-9 w-9 cursor-pointer rounded-md border border-white/25 bg-transparent p-0"
								/>
								<p className="font-mono text-xs text-white/90">{swatch.hex}</p>
							</div>
							<div className="flex items-center gap-2">
								<label className="inline-flex cursor-pointer items-center gap-1 text-xs text-slate-300">
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
									onClick={() => onRemove(swatch.id)}
									className="cursor-pointer rounded-lg border border-rose-300/30 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-100 transition hover:bg-rose-500/20"
								>
									Remove
								</button>
							</div>
						</div>

						<div className="mt-2">
							<div className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-slate-300/75">
								<span>Weight</span>
								<span className="font-mono text-[12px] normal-case tracking-normal text-white/95">
									{(swatch.weight * 100).toFixed(1)}%
								</span>
							</div>
							<input
								type="range"
								min={0.01}
								max={1}
								step={0.01}
								value={swatch.weight}
								onChange={(event) =>
									onWeightChange(swatch.id, Number(event.target.value))
								}
								className="w-full cursor-pointer accent-cyan-400"
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
