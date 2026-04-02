import { renderAnimatedShapeInstance } from '@/components/orb-field/render-shapes';
import type { OrbFilterIds, ShapeConfig } from '@/components/orb-field/types';

type OrbDefsProps = {
	ids: OrbFilterIds;
	sortedShapes: ShapeConfig[];
	animate: boolean;
	paletteDriftEnabled: boolean;
	driftDur: string;
	blurStd: number;
	metaBlurSafe: number;
	metaAlphaSlope: number;
	metaAlphaBias: number;
	glowStd: number;
	glowAmp: number;
	warpFreqX: number;
	warpFreqY: number;
	warpDur: string;
	warpEnabled: boolean;
	warpAmount: number;
	noiseSeed: number;
	bloomThresholdSafe: number;
	bloomRadiusSafe: number;
	bloomStrengthSafe: number;
	posterizeTableValues: string;
	causticScaleSafe: number;
	causticDuration: string;
	causticEnabled: boolean;
	fringeAmount: number;
	hueRotateEnabled: boolean;
	hueRotateDegrees: number;
	hueRotateDuration: string;
	fineNoiseFreqSafe: number;
	coarseNoiseFreqSafe: number;
	safeVignetteColor: string;
	safeVignetteAmount: number;
};

export function OrbFilterDefs({
	ids,
	sortedShapes,
	animate,
	paletteDriftEnabled,
	driftDur,
	blurStd,
	metaBlurSafe,
	metaAlphaSlope,
	metaAlphaBias,
	glowStd,
	glowAmp,
	warpFreqX,
	warpFreqY,
	warpDur,
	warpEnabled,
	warpAmount,
	noiseSeed,
	bloomThresholdSafe,
	bloomRadiusSafe,
	bloomStrengthSafe,
	posterizeTableValues,
	causticScaleSafe,
	causticDuration,
	causticEnabled,
	fringeAmount,
	hueRotateEnabled,
	hueRotateDegrees,
	hueRotateDuration,
	fineNoiseFreqSafe,
	coarseNoiseFreqSafe,
	safeVignetteColor,
	safeVignetteAmount,
}: OrbDefsProps) {
	return (
		<defs>
			<filter
				id={ids.blurFilterId}
				x="-85%"
				y="-85%"
				width="270%"
				height="270%"
				colorInterpolationFilters="sRGB"
			>
				<feGaussianBlur in="SourceGraphic" stdDeviation={blurStd} />
			</filter>

			<filter
				id={ids.metaballFilterId}
				x="-95%"
				y="-95%"
				width="290%"
				height="290%"
				colorInterpolationFilters="sRGB"
			>
				<feGaussianBlur
					in="SourceGraphic"
					stdDeviation={metaBlurSafe}
					result="goo"
				/>
				<feColorMatrix
					in="goo"
					type="matrix"
					values={`1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ${metaAlphaSlope} ${metaAlphaBias}`}
				/>
			</filter>

			<filter
				id={ids.glowFilterId}
				x="-110%"
				y="-110%"
				width="320%"
				height="320%"
				colorInterpolationFilters="sRGB"
			>
				<feGaussianBlur
					in="SourceGraphic"
					stdDeviation={glowStd}
					result="glowBlur"
				/>
				<feColorMatrix
					in="glowBlur"
					type="matrix"
					values={`1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ${glowAmp} 0`}
				/>
			</filter>

			<filter
				id={ids.warpFilterId}
				x="-40%"
				y="-40%"
				width="180%"
				height="180%"
			>
				<feTurbulence
					type="fractalNoise"
					baseFrequency={`${warpFreqX} ${warpFreqY}`}
					numOctaves={2}
					seed={noiseSeed + 17}
					result="warpNoise"
				>
					{warpEnabled && animate ? (
						<animate
							attributeName="baseFrequency"
							dur={warpDur}
							repeatCount="indefinite"
							values={`${warpFreqX} ${warpFreqY};${warpFreqX * 1.8} ${warpFreqY * 1.4};${warpFreqX} ${warpFreqY}`}
						/>
					) : null}
				</feTurbulence>
				<feDisplacementMap
					in="SourceGraphic"
					in2="warpNoise"
					scale={warpEnabled ? Math.max(0, warpAmount) : 0}
					xChannelSelector="R"
					yChannelSelector="G"
				/>
			</filter>

			<filter
				id={ids.bloomFilterId}
				x="-100%"
				y="-100%"
				width="300%"
				height="300%"
				colorInterpolationFilters="sRGB"
			>
				<feColorMatrix
					in="SourceGraphic"
					type="matrix"
					values={`0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2126 0.7152 0.0722 0 ${-bloomThresholdSafe}`}
					result="lumMask"
				/>
				<feComposite
					in="SourceGraphic"
					in2="lumMask"
					operator="in"
					result="bloomMask"
				/>
				<feGaussianBlur
					in="bloomMask"
					stdDeviation={bloomRadiusSafe}
					result="bloomBlur"
				/>
				<feComponentTransfer in="bloomBlur">
					<feFuncA type="linear" slope={Math.max(0, bloomStrengthSafe)} />
				</feComponentTransfer>
			</filter>

			<filter
				id={ids.posterizeFilterId}
				x="-95%"
				y="-95%"
				width="290%"
				height="290%"
				colorInterpolationFilters="sRGB"
			>
				<feGaussianBlur
					in="SourceGraphic"
					stdDeviation={Math.max(1.5, blurStd * 0.35)}
					result="smooth"
				/>
				<feComponentTransfer in="smooth">
					<feFuncR type="discrete" tableValues={posterizeTableValues} />
					<feFuncG type="discrete" tableValues={posterizeTableValues} />
					<feFuncB type="discrete" tableValues={posterizeTableValues} />
					<feFuncA type="linear" slope="1" />
				</feComponentTransfer>
			</filter>

			<filter
				id={ids.causticFilterId}
				x="0%"
				y="0%"
				width="100%"
				height="100%"
				colorInterpolationFilters="sRGB"
			>
				<feTurbulence
					type="fractalNoise"
					baseFrequency={`${causticScaleSafe} ${(causticScaleSafe * 1.5).toFixed(5)}`}
					numOctaves={3}
					seed={noiseSeed + 41}
					stitchTiles="stitch"
					result="causticNoise"
				>
					{causticEnabled && animate ? (
						<animate
							attributeName="baseFrequency"
							dur={causticDuration}
							repeatCount="indefinite"
							values={`${causticScaleSafe} ${(causticScaleSafe * 1.5).toFixed(5)};${(causticScaleSafe * 1.75).toFixed(5)} ${(causticScaleSafe * 2.05).toFixed(5)};${causticScaleSafe} ${(causticScaleSafe * 1.5).toFixed(5)}`}
						/>
					) : null}
				</feTurbulence>
				<feColorMatrix
					in="causticNoise"
					type="matrix"
					values="1.45 0 0 0 0 0 1.26 0 0 0 0 0 0.95 0 0 0 0 0 1.6 -0.55"
					result="causticColor"
				/>
				<feComponentTransfer in="causticColor">
					<feFuncA type="gamma" amplitude="1" exponent="1.3" offset="0" />
				</feComponentTransfer>
			</filter>

			<filter
				id={ids.fringeFilterId}
				x="-90%"
				y="-90%"
				width="280%"
				height="280%"
			>
				<feColorMatrix
					in="SourceGraphic"
					type="matrix"
					values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"
					result="red"
				/>
				<feOffset in="red" dx={fringeAmount} dy="0" result="redShift" />
				<feColorMatrix
					in="SourceGraphic"
					type="matrix"
					values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"
					result="green"
				/>
				<feColorMatrix
					in="SourceGraphic"
					type="matrix"
					values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"
					result="blue"
				/>
				<feOffset in="blue" dx={-fringeAmount} dy="0" result="blueShift" />
				<feBlend in="redShift" in2="green" mode="screen" result="rg" />
				<feBlend in="rg" in2="blueShift" mode="screen" />
			</filter>

			<filter
				id={ids.hueRotateFilterId}
				x="-20%"
				y="-20%"
				width="140%"
				height="140%"
				colorInterpolationFilters="sRGB"
			>
				<feColorMatrix
					type="hueRotate"
					values={`${hueRotateEnabled ? hueRotateDegrees : 0}`}
				>
					{hueRotateEnabled && animate ? (
						<animate
							attributeName="values"
							dur={hueRotateDuration}
							repeatCount="indefinite"
							values={`${hueRotateDegrees};${hueRotateDegrees + 360}`}
						/>
					) : null}
				</feColorMatrix>
			</filter>

			<filter
				id={ids.fineNoiseFilterId}
				x="0%"
				y="0%"
				width="100%"
				height="100%"
			>
				<feTurbulence
					type="fractalNoise"
					baseFrequency={fineNoiseFreqSafe}
					numOctaves={4}
					seed={noiseSeed}
					stitchTiles="stitch"
					result="fineNoise"
				>
					{animate ? (
						<animate
							attributeName="baseFrequency"
							dur="90s"
							repeatCount="indefinite"
							values={`${fineNoiseFreqSafe};${fineNoiseFreqSafe * 1.14};${fineNoiseFreqSafe}`}
						/>
					) : null}
				</feTurbulence>
				<feColorMatrix in="fineNoise" type="saturate" values="0" />
			</filter>

			<filter
				id={ids.coarseNoiseFilterId}
				x="0%"
				y="0%"
				width="100%"
				height="100%"
			>
				<feTurbulence
					type="fractalNoise"
					baseFrequency={coarseNoiseFreqSafe}
					numOctaves={2}
					seed={noiseSeed + 27}
					stitchTiles="stitch"
					result="coarseNoise"
				>
					{animate ? (
						<animate
							attributeName="baseFrequency"
							dur="140s"
							repeatCount="indefinite"
							values={`${coarseNoiseFreqSafe};${coarseNoiseFreqSafe * 1.22};${coarseNoiseFreqSafe}`}
						/>
					) : null}
				</feTurbulence>
				<feColorMatrix in="coarseNoise" type="saturate" values="0" />
			</filter>

			<linearGradient
				id={ids.sweepGradientId}
				x1="0%"
				y1="0%"
				x2="100%"
				y2="0%"
			>
				<stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
				<stop offset="44%" stopColor="#ffffff" stopOpacity="0" />
				<stop offset="50%" stopColor="#ffffff" stopOpacity="0.65" />
				<stop offset="56%" stopColor="#ffffff" stopOpacity="0" />
				<stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
			</linearGradient>

			<radialGradient id={ids.vignetteGradientId} cx="50%" cy="50%" r="70%">
				<stop offset="38%" stopColor={safeVignetteColor} stopOpacity="0" />
				<stop
					offset="100%"
					stopColor={safeVignetteColor}
					stopOpacity={safeVignetteAmount}
				/>
			</radialGradient>

			<g id={ids.shapeGroupId}>
				{sortedShapes.map((shape) =>
					renderAnimatedShapeInstance({
						shape,
						keyPrefix: 'base',
						enablePaletteDrift: paletteDriftEnabled && animate,
						driftDuration: driftDur,
						animate,
						scaleTarget: shape.maxScale,
						opacity: shape.opacity,
					}),
				)}
			</g>
		</defs>
	);
}
