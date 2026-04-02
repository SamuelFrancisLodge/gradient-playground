'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { buildShapes } from '@/components/orb-field/build-shapes';
import { OrbFilterDefs } from '@/components/orb-field/defs';
import type {
	OrbGradientFieldProps,
	ShapeMode,
	ShapeSelection,
} from '@/components/orb-field/types';
import {
	createFilterIds,
	getRandomizer,
	hashSeed,
} from '@/components/orb-field/utils';
import {
	clamp,
	normalizeRatios,
	sanitizeHexColor,
	sanitizePalette,
} from '@/components/orb-field/utils';

export type { OrbGradientFieldProps, ShapeMode, ShapeSelection };

export function OrbGradientField({
	circleCount = 15,
	minRadius = 92,
	maxRadius = 456,
	allowCrop = true,
	colors,
	colorRatios,
	seed,
	animate = true,
	animationSpeed = 1,
	movementIntensity = 1,
	scaleIntensity = 1,
	blurEnabled = true,
	blurStdDeviation = 72,
	glowEnabled = false,
	glowStdDeviation = 105,
	glowIntensity = 2.8,
	glowBlendMode = 'screen',
	noiseEnabled = true,
	noiseOpacity = 0.06,
	noiseFrequency = 0.95,
	coarseNoiseOpacity = 0.03,
	coarseNoiseFrequency = 0.08,
	warpEnabled = false,
	warpAmount = 14,
	warpSpeed = 0.45,
	warpBaseFrequency = 0.004,
	metaballEnabled = false,
	metaballBlur = 20,
	metaballThreshold = 0.62,
	bloomEnabled = true,
	bloomThreshold = 0.62,
	bloomRadius = 34,
	bloomIntensity = 0.58,
	posterizeEnabled = false,
	posterizeLevels = 5,
	posterizeOpacity = 0.26,
	causticEnabled = false,
	causticIntensity = 0.22,
	causticScale = 0.016,
	causticSpeed = 0.42,
	depthEnabled = true,
	depthLayers = 3,
	depthStrength = 0.5,
	vignetteEnabled = true,
	vignetteAmount = 0.22,
	vignetteColor = '#020611',
	fringeEnabled = false,
	fringeAmount = 1.1,
	sweepEnabled = true,
	sweepIntensity = 0.16,
	sweepWidth = 0.22,
	sweepSpeed = 0.45,
	sweepAngle = -24,
	paletteDriftEnabled = false,
	paletteDriftSpeed = 0.22,
	hueRotateEnabled = false,
	hueRotateDegrees = 22,
	hueRotateSpeed = 0.3,
	shapeMode = 'both',
	shapeSelections,
	shapeSpeedMin = 0.7,
	shapeSpeedMax = 1.35,
	className,
}: OrbGradientFieldProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [size, setSize] = useState({ width: 0, height: 0 });

	const palette = useMemo(() => sanitizePalette(colors), [colors]);
	const ratios = useMemo(
		() => normalizeRatios(palette.length, colorRatios),
		[palette.length, colorRatios],
	);
	const safeVignetteColor = useMemo(
		() => sanitizeHexColor(vignetteColor, '#020611'),
		[vignetteColor],
	);

	const noiseSeed = useMemo(
		() =>
			seed === undefined || seed === null || seed === ''
				? 9
				: (hashSeed(String(seed)) % 97) + 3,
		[seed],
	);

	const shapes = useMemo(() => {
		if (size.width < 2 || size.height < 2) {
			return [];
		}

		const random = getRandomizer(seed);

		return buildShapes({
			circleCount,
			width: size.width,
			height: size.height,
			minRadius,
			maxRadius,
			allowCrop,
			palette,
			ratios,
			random,
			animationSpeed,
			movementIntensity,
			scaleIntensity,
			depthEnabled,
			depthLayers,
			depthStrength,
			shapeMode,
			shapeSelections,
			shapeSpeedMin,
			shapeSpeedMax,
		});
	}, [
		allowCrop,
		animationSpeed,
		circleCount,
		depthEnabled,
		depthLayers,
		depthStrength,
		maxRadius,
		minRadius,
		movementIntensity,
		palette,
		ratios,
		scaleIntensity,
		seed,
		shapeMode,
		shapeSelections,
		shapeSpeedMax,
		shapeSpeedMin,
		size.height,
		size.width,
	]);

	const sortedShapes = useMemo(
		() => [...shapes].sort((a, b) => a.depthLayer - b.depthLayer),
		[shapes],
	);

	const rawId = useId();
	const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
	const ids = useMemo(() => createFilterIds(cleanId), [cleanId]);

	useEffect(() => {
		const node = containerRef.current;

		if (!node) {
			return;
		}

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) {
				return;
			}

			const width = Math.max(1, Math.round(entry.contentRect.width));
			const height = Math.max(1, Math.round(entry.contentRect.height));
			setSize((current) => {
				if (current.width === width && current.height === height) {
					return current;
				}

				return { width, height };
			});
		});

		observer.observe(node);
		return () => observer.disconnect();
	}, []);

	const containerClassName = [
		'pointer-events-none absolute inset-0 overflow-hidden',
		className ?? '',
	]
		.filter(Boolean)
		.join(' ');

	const blurStd = Math.max(0, blurStdDeviation);
	const glowStd = Math.max(0, glowStdDeviation);
	const glowAmp = Math.max(0, glowIntensity);

	const warpFreqX = clamp(warpBaseFrequency, 0.0005, 0.02);
	const warpFreqY = clamp(warpBaseFrequency * 1.35, 0.0005, 0.03);
	const warpDur = `${Math.max(10, 80 / Math.max(0.08, warpSpeed))}s`;

	const bloomThresholdSafe = clamp(bloomThreshold, 0, 1);
	const bloomRadiusSafe = Math.max(0, bloomRadius);
	const bloomStrengthSafe = Math.max(0, bloomIntensity);

	const posterizeLevelsSafe = Math.round(clamp(posterizeLevels, 2, 12));
	const posterizeOpacitySafe = clamp(posterizeOpacity, 0, 1);
	const posterizeTableValues = Array.from(
		{ length: posterizeLevelsSafe },
		(_, index) => (index / (posterizeLevelsSafe - 1)).toFixed(4),
	).join(' ');

	const metaBlurSafe = Math.max(0, metaballBlur);
	const metaThresholdSafe = clamp(metaballThreshold, 0.2, 1);
	const metaAlphaSlope = 12 + metaThresholdSafe * 12;
	const metaAlphaBias = -8.5 - metaThresholdSafe * 9;

	const causticIntensitySafe = clamp(causticIntensity, 0, 1);
	const causticScaleSafe = clamp(causticScale, 0.002, 0.04);
	const causticSpeedSafe = clamp(causticSpeed, 0.05, 2.5);
	const causticDuration = `${Math.max(10, 120 / Math.max(0.05, causticSpeedSafe))}s`;

	const fineNoiseOpacity = clamp(noiseOpacity, 0, 1);
	const coarseNoiseOpacitySafe = clamp(coarseNoiseOpacity, 0, 1);
	const fineNoiseFreqSafe = clamp(noiseFrequency, 0.08, 2.4);
	const coarseNoiseFreqSafe = clamp(coarseNoiseFrequency, 0.01, 0.8);

	const driftDur = `${Math.max(20, 140 / Math.max(0.05, paletteDriftSpeed))}s`;
	const hueRotateDegreesSafe = ((hueRotateDegrees % 360) + 360) % 360;
	const hueRotateDuration = `${Math.max(14, 140 / Math.max(0.05, hueRotateSpeed))}s`;
	const sweepBand = Math.max(
		120,
		Math.min(size.width, size.height) * clamp(sweepWidth, 0.08, 0.65),
	);
	const sweepDuration = Math.max(14, 90 / Math.max(0.08, sweepSpeed));
	const sweepStartX = -sweepBand * 1.6;
	const sweepEndX = size.width + sweepBand * 1.6;
	const sweepStaticX = (size.width - sweepBand) / 2;
	const safeVignetteAmount = clamp(vignetteAmount, 0, 1);
	const fringeAmountSafe = clamp(fringeAmount, 0, 8);

	const coreFilter = metaballEnabled
		? `url(#${ids.metaballFilterId})`
		: blurEnabled
			? `url(#${ids.blurFilterId})`
			: undefined;

	return (
		<div ref={containerRef} className={containerClassName}>
			<svg
				aria-hidden
				className="h-full w-full"
				viewBox={`0 0 ${Math.max(size.width, 1)} ${Math.max(size.height, 1)}`}
				preserveAspectRatio="xMidYMid slice"
			>
				<OrbFilterDefs
					ids={ids}
					sortedShapes={sortedShapes}
					animate={animate}
					paletteDriftEnabled={paletteDriftEnabled}
					driftDur={driftDur}
					blurStd={blurStd}
					metaBlurSafe={metaBlurSafe}
					metaAlphaSlope={metaAlphaSlope}
					metaAlphaBias={metaAlphaBias}
					glowStd={glowStd}
					glowAmp={glowAmp}
					warpFreqX={warpFreqX}
					warpFreqY={warpFreqY}
					warpDur={warpDur}
					warpEnabled={warpEnabled}
					warpAmount={warpAmount}
					noiseSeed={noiseSeed}
					bloomThresholdSafe={bloomThresholdSafe}
					bloomRadiusSafe={bloomRadiusSafe}
					bloomStrengthSafe={bloomStrengthSafe}
					posterizeTableValues={posterizeTableValues}
					causticScaleSafe={causticScaleSafe}
					causticDuration={causticDuration}
					causticEnabled={causticEnabled}
					fringeAmount={fringeAmountSafe}
					hueRotateEnabled={hueRotateEnabled}
					hueRotateDegrees={hueRotateDegreesSafe}
					hueRotateDuration={hueRotateDuration}
					fineNoiseFreqSafe={fineNoiseFreqSafe}
					coarseNoiseFreqSafe={coarseNoiseFreqSafe}
					safeVignetteColor={safeVignetteColor}
					safeVignetteAmount={safeVignetteAmount}
				/>

				<rect
					x="0"
					y="0"
					width={size.width}
					height={size.height}
					fill="#040a16"
				/>

				<g
					filter={
						hueRotateEnabled ? `url(#${ids.hueRotateFilterId})` : undefined
					}
				>
					<g filter={warpEnabled ? `url(#${ids.warpFilterId})` : undefined}>
						<g
							filter={fringeEnabled ? `url(#${ids.fringeFilterId})` : undefined}
						>
							<use href={`#${ids.shapeGroupId}`} filter={coreFilter} />

							{posterizeEnabled && posterizeOpacitySafe > 0 ? (
								<g
									style={{
										mixBlendMode: 'soft-light',
										opacity: posterizeOpacitySafe,
									}}
								>
									<use
										href={`#${ids.shapeGroupId}`}
										filter={`url(#${ids.posterizeFilterId})`}
									/>
								</g>
							) : null}

							{glowEnabled ? (
								<use
									href={`#${ids.shapeGroupId}`}
									filter={`url(#${ids.glowFilterId})`}
									opacity="0.78"
									style={{ mixBlendMode: glowBlendMode }}
								/>
							) : null}

							{bloomEnabled ? (
								<g
									style={{
										mixBlendMode: 'screen',
										opacity: Math.min(1, bloomStrengthSafe),
									}}
								>
									<use
										href={`#${ids.shapeGroupId}`}
										filter={`url(#${ids.bloomFilterId})`}
									/>
								</g>
							) : null}
						</g>

						{sweepEnabled &&
						sweepIntensity > 0 &&
						size.width > 2 &&
						size.height > 2 ? (
							<g
								transform={`rotate(${sweepAngle} ${size.width / 2} ${size.height / 2})`}
								style={{ mixBlendMode: 'screen' }}
							>
								<rect
									x={animate ? sweepStartX : sweepStaticX}
									y={-size.height * 0.4}
									width={sweepBand}
									height={size.height * 1.8}
									fill={`url(#${ids.sweepGradientId})`}
									opacity={clamp(sweepIntensity, 0, 1)}
								>
									{animate ? (
										<animate
											attributeName="x"
											values={`${sweepStartX};${sweepEndX}`}
											dur={`${sweepDuration.toFixed(2)}s`}
											repeatCount="indefinite"
										/>
									) : null}
								</rect>
							</g>
						) : null}
					</g>

					{causticEnabled && causticIntensitySafe > 0 ? (
						<rect
							x="0"
							y="0"
							width={size.width}
							height={size.height}
							fill="#d8ecff"
							filter={`url(#${ids.causticFilterId})`}
							opacity={causticIntensitySafe}
							style={{ mixBlendMode: 'screen' }}
						/>
					) : null}

					{noiseEnabled && fineNoiseOpacity > 0 ? (
						<rect
							x="0"
							y="0"
							width={size.width}
							height={size.height}
							fill="#ffffff"
							filter={`url(#${ids.fineNoiseFilterId})`}
							opacity={fineNoiseOpacity}
							style={{ mixBlendMode: 'soft-light' }}
						/>
					) : null}

					{noiseEnabled && coarseNoiseOpacitySafe > 0 ? (
						<rect
							x="0"
							y="0"
							width={size.width}
							height={size.height}
							fill="#ffffff"
							filter={`url(#${ids.coarseNoiseFilterId})`}
							opacity={coarseNoiseOpacitySafe}
							style={{ mixBlendMode: 'overlay' }}
						/>
					) : null}

					{vignetteEnabled ? (
						<rect
							x="0"
							y="0"
							width={size.width}
							height={size.height}
							fill={`url(#${ids.vignetteGradientId})`}
							style={{ mixBlendMode: 'multiply' }}
						/>
					) : null}
				</g>
			</svg>
		</div>
	);
}
