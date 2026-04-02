import type { ReactNode } from 'react';

export function PanelSection({
	title,
	subtitle,
	children,
	defaultOpen = true,
}: {
	title: string;
	subtitle?: string;
	children: ReactNode;
	defaultOpen?: boolean;
}) {
	return (
		<details
			open={defaultOpen}
			className="group rounded-2xl border border-white/15 bg-slate-900/55 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
		>
			<summary className="flex cursor-pointer list-none items-center justify-between gap-3">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/85">
						{title}
					</p>
					{subtitle ? (
						<p className="mt-1 text-xs text-slate-300/75">{subtitle}</p>
					) : null}
				</div>
				<span className="text-slate-300 transition group-open:rotate-90">
					▸
				</span>
			</summary>
			<div className="mt-4 space-y-3">{children}</div>
		</details>
	);
}

export function LabelValue({
	label,
	value,
}: {
	label: string;
	value: string | number;
}) {
	return (
		<div className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-slate-300/80">
			<span>{label}</span>
			<span className="font-mono text-[12px] normal-case tracking-normal text-white/95">
				{value}
			</span>
		</div>
	);
}

export function RangeInput({
	label,
	value,
	min,
	max,
	step = 1,
	disabled,
	onChange,
	formatValue,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step?: number;
	disabled?: boolean;
	onChange: (value: number) => void;
	formatValue?: (value: number) => string;
}) {
	return (
		<label className="block">
			<LabelValue
				label={label}
				value={formatValue ? formatValue(value) : value}
			/>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				disabled={disabled}
				onChange={(event) => onChange(Number(event.target.value))}
				className="w-full cursor-pointer accent-cyan-400 disabled:cursor-not-allowed disabled:opacity-45"
			/>
		</label>
	);
}

export function ToggleInput({
	label,
	checked,
	onChange,
}: {
	label: string;
	checked: boolean;
	onChange: (value: boolean) => void;
}) {
	return (
		<label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-slate-100/95">
			<span>{label}</span>
			<input
				type="checkbox"
				checked={checked}
				onChange={(event) => onChange(event.target.checked)}
				className="h-4 w-4 cursor-pointer accent-cyan-400"
			/>
		</label>
	);
}

export function SelectInput<T extends string>({
	label,
	value,
	onChange,
	options,
	hideLabel = false,
}: {
	label?: string;
	value: T;
	onChange: (value: T) => void;
	options: Array<{ label: string; value: T }>;
	hideLabel?: boolean;
}) {
	const select = (
		<select
			value={value}
			onChange={(event) => onChange(event.target.value as T)}
			style={{ colorScheme: 'dark' }}
			className={`w-full cursor-pointer rounded-xl border border-white/20 bg-slate-950/80 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none transition focus:border-cyan-300/80 ${hideLabel ? '' : 'mt-1.5'}`}
		>
			{options.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	);

	if (hideLabel) {
		return select;
	}

	return (
		<label className="block text-[11px] uppercase tracking-[0.16em] text-slate-300/80">
			{label ? <span>{label}</span> : null}
			{select}
		</label>
	);
}

export function TinyStat({
	label,
	value,
	colorClass,
}: {
	label: string;
	value: string;
	colorClass?: string;
}) {
	return (
		<div className="rounded-xl border border-white/15 bg-slate-900/65 px-3 py-2">
			<p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
				{label}
			</p>
			<p
				className={`mt-1 text-sm font-semibold ${colorClass ?? 'text-white/95'}`}
			>
				{value}
			</p>
		</div>
	);
}
