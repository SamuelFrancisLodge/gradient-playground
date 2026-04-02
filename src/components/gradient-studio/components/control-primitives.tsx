import { createContext, useContext, type ReactNode } from 'react';

type MenuTone = 'dark' | 'light';

const ToneContext = createContext<MenuTone>('dark');

function useResolvedTone(tone?: MenuTone) {
	const inheritedTone = useContext(ToneContext);
	return tone ?? inheritedTone;
}

function HintDot({ hint, tone }: { hint?: string; tone?: MenuTone }) {
	const isLight = useResolvedTone(tone) === 'light';

	if (!hint) {
		return null;
	}

	return (
		<span
			title={hint}
			aria-label={hint}
			className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold leading-none transition-colors ${
				isLight
					? 'border border-amber-300 bg-amber-100 text-amber-800'
					: 'border border-cyan-300/35 bg-cyan-500/15 text-cyan-100'
			}`}
		>
			?
		</span>
	);
}

export function PanelSection({
	title,
	subtitle,
	children,
	defaultOpen = true,
	tone = 'dark',
	titleHint,
}: {
	title: string;
	subtitle?: string;
	children: ReactNode;
	defaultOpen?: boolean;
	tone?: MenuTone;
	titleHint?: string;
}) {
	const isLight = useResolvedTone(tone) === 'light';

	return (
		<ToneContext.Provider value={tone}>
			<details
				open={defaultOpen}
				className={`group rounded-2xl border p-5 shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-colors duration-500 ${
					isLight
						? 'border-amber-200/80 bg-[#fff7ea]/90 shadow-[0_8px_24px_rgba(109,66,17,0.12)]'
						: 'border-white/15 bg-slate-900/55'
				}`}
			>
				<summary className="flex cursor-pointer list-none items-center justify-between gap-4">
					<div>
						<div className="flex items-center gap-2">
							<p
								className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
									isLight ? 'text-cyan-700' : 'text-cyan-100/85'
								}`}
							>
								{title}
							</p>
							<HintDot hint={titleHint} tone={tone} />
						</div>
						{subtitle ? (
							<p
								className={`mt-1.5 text-xs ${
									isLight ? 'text-amber-800/80' : 'text-slate-300/75'
								}`}
							>
								{subtitle}
							</p>
						) : null}
					</div>
					<span
						className={`transition group-open:rotate-90 ${
							isLight ? 'text-amber-700/80' : 'text-slate-300'
						}`}
					>
						▸
					</span>
				</summary>
				<div className="mt-5 space-y-4">{children}</div>
			</details>
		</ToneContext.Provider>
	);
}

export function LabelValue({
	label,
	value,
	tone,
	hint,
}: {
	label: string;
	value: string | number;
	tone?: MenuTone;
	hint?: string;
}) {
	const resolvedTone = useResolvedTone(tone);
	const isLight = resolvedTone === 'light';

	return (
		<div
			className={`mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] ${
				isLight ? 'text-amber-800/85' : 'text-slate-300/80'
			}`}
		>
			<span className="inline-flex items-center gap-2">
				{label}
				<HintDot hint={hint} tone={resolvedTone} />
			</span>
			<span
				className={`font-mono text-[12px] normal-case tracking-normal ${
					isLight ? 'text-amber-950' : 'text-white/95'
				}`}
			>
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
	tone,
	hint,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step?: number;
	disabled?: boolean;
	onChange: (value: number) => void;
	formatValue?: (value: number) => string;
	tone?: MenuTone;
	hint?: string;
}) {
	const resolvedTone = useResolvedTone(tone);

	return (
		<label className="block">
			<LabelValue
				label={label}
				value={formatValue ? formatValue(value) : value}
				tone={resolvedTone}
				hint={hint}
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
	tone,
	hint,
}: {
	label: string;
	checked: boolean;
	onChange: (value: boolean) => void;
	tone?: MenuTone;
	hint?: string;
}) {
	const resolvedTone = useResolvedTone(tone);
	const isLight = resolvedTone === 'light';

	return (
		<label
			className={`flex cursor-pointer items-center justify-between gap-3 text-sm ${
				isLight ? 'text-amber-950' : 'text-slate-100/95'
			}`}
		>
			<span className="inline-flex items-center gap-2">
				{label}
				<HintDot hint={hint} tone={resolvedTone} />
			</span>
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
	tone,
	hint,
}: {
	label?: string;
	value: T;
	onChange: (value: T) => void;
	options: Array<{ label: string; value: T }>;
	hideLabel?: boolean;
	tone?: MenuTone;
	hint?: string;
}) {
	const resolvedTone = useResolvedTone(tone);
	const isLight = resolvedTone === 'light';

	const select = (
		<select
			value={value}
			onChange={(event) => onChange(event.target.value as T)}
			style={{ colorScheme: isLight ? 'light' : 'dark' }}
			className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-sm normal-case tracking-normal outline-none transition ${
				isLight
					? 'border-amber-200 bg-[#fffaf2] text-amber-950 focus:border-cyan-500'
					: 'border-white/20 bg-slate-950/80 text-white focus:border-cyan-300/80'
			} ${hideLabel ? '' : 'mt-1.5'}`}
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
		<label
			className={`block text-[11px] uppercase tracking-[0.16em] ${
				isLight ? 'text-amber-800/85' : 'text-slate-300/80'
			}`}
		>
			{label ? (
				<span className="inline-flex items-center gap-2">
					{label}
					<HintDot hint={hint} tone={resolvedTone} />
				</span>
			) : null}
			{select}
		</label>
	);
}

export function TinyStat({
	label,
	value,
	colorClass,
	tone,
}: {
	label: string;
	value: string;
	colorClass?: string;
	tone?: 'dark' | 'light';
}) {
	const isLight = useResolvedTone(tone) === 'light';

	return (
		<div
			className={`rounded-xl border px-3 py-2 transition-colors duration-500 ${
				isLight
					? 'border-amber-200 bg-[#fffaf2]/90'
					: 'border-white/15 bg-slate-900/65'
			}`}
		>
			<p
				className={`text-[10px] uppercase tracking-[0.14em] ${
					isLight ? 'text-amber-700/90' : 'text-slate-400'
				}`}
			>
				{label}
			</p>
			<p
				className={`mt-1 text-sm font-semibold ${
					colorClass ?? (isLight ? 'text-amber-950' : 'text-white/95')
				}`}
			>
				{value}
			</p>
		</div>
	);
}
