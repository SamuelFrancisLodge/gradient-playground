import type { ShapeConfig } from '@/components/orb-field/types';

function renderShapePrimitive(
	shape: ShapeConfig,
	key: string,
	enablePaletteDrift: boolean,
	driftDuration: string,
) {
	const colorDrift = enablePaletteDrift && shape.altFill !== shape.fill;

	const driftAnimation = colorDrift ? (
		<animate
			attributeName="fill"
			dur={driftDuration}
			repeatCount="indefinite"
			begin="0s"
			values={`${shape.fill};${shape.altFill};${shape.fill}`}
		/>
	) : null;

	if (shape.kind === 'square' || shape.kind === 'rect') {
		const corner = Math.max(0, Math.min(shape.width, shape.height) * 0.16);
		return (
			<rect
				key={key}
				x={-shape.width / 2}
				y={-shape.height / 2}
				width={shape.width}
				height={shape.height}
				rx={corner}
				fill={shape.fill}
			>
				{driftAnimation}
			</rect>
		);
	}

	if (shape.kind === 'path-sharp' || shape.kind === 'path-curved') {
		return (
			<path key={key} d={shape.pathData ?? 'M 0 0 Z'} fill={shape.fill}>
				{driftAnimation}
			</path>
		);
	}

	return (
		<circle key={key} cx={0} cy={0} r={shape.radius} fill={shape.fill}>
			{driftAnimation}
		</circle>
	);
}

export function renderAnimatedShapeInstance({
	shape,
	keyPrefix,
	enablePaletteDrift,
	driftDuration,
	animate,
	scaleTarget,
	opacity,
}: {
	shape: ShapeConfig;
	keyPrefix: string;
	enablePaletteDrift: boolean;
	driftDuration: string;
	animate: boolean;
	scaleTarget: number;
	opacity: number;
}) {
	const duration = Math.max(2, shape.duration);
	const durationText = `${duration.toFixed(2)}s`;
	const phaseOffset = (shape.delay % duration).toFixed(2);
	const begin = `-${phaseOffset}s`;
	const keyTimes = '0;0.5;1';
	const keySplines = '0.42 0 0.58 1;0.42 0 0.58 1';

	return (
		<g
			key={`${keyPrefix}-${shape.id}`}
			transform={`translate(${shape.x.toFixed(2)} ${shape.y.toFixed(2)}) rotate(${shape.baseRotation.toFixed(2)})`}
			opacity={opacity}
		>
			<g>
				{animate ? (
					<animateTransform
						attributeName="transform"
						type="translate"
						values={`0 0; ${shape.driftX.toFixed(2)} ${shape.driftY.toFixed(2)}; 0 0`}
						dur={durationText}
						begin={begin}
						repeatCount="indefinite"
						calcMode="spline"
						keyTimes={keyTimes}
						keySplines={keySplines}
					/>
				) : null}
				<g>
					{animate ? (
						<animateTransform
							attributeName="transform"
							type="rotate"
							values={`0; ${shape.rotationDrift.toFixed(2)}; 0`}
							dur={durationText}
							begin={begin}
							repeatCount="indefinite"
							calcMode="spline"
							keyTimes={keyTimes}
							keySplines={keySplines}
						/>
					) : null}
					<g>
						{animate ? (
							<animateTransform
								attributeName="transform"
								type="scale"
								values={`1; ${scaleTarget.toFixed(3)}; 1`}
								dur={durationText}
								begin={begin}
								repeatCount="indefinite"
								calcMode="spline"
								keyTimes={keyTimes}
								keySplines={keySplines}
							/>
						) : null}
						{renderShapePrimitive(
							shape,
							`${keyPrefix}-shape-${shape.id}`,
							enablePaletteDrift,
							driftDuration,
						)}
					</g>
				</g>
			</g>
		</g>
	);
}
