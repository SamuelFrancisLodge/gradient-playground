export type GlowBlendMode = 'screen' | 'overlay' | 'color-dodge' | 'soft-light';

export type ShapeMode = 'normal' | 'abstract' | 'both';

export type ShapeSelection =
	| 'circle'
	| 'square'
	| 'rect'
	| 'abstract-sharp'
	| 'abstract-curved';

export type ShapeKind =
	| 'circle'
	| 'square'
	| 'rect'
	| 'path-sharp'
	| 'path-curved';

export type RandomFn = () => number;

export type ShapeConfig = {
	id: number;
	kind: ShapeKind;
	x: number;
	y: number;
	radius: number;
	width: number;
	height: number;
	pathData?: string;
	fill: string;
	altFill: string;
	driftX: number;
	driftY: number;
	duration: number;
	delay: number;
	opacity: number;
	maxScale: number;
	depthLayer: number;
	baseRotation: number;
	rotationDrift: number;
};

export type OrbGradientFieldProps = {
	circleCount?: number;
	minRadius?: number;
	maxRadius?: number;
	allowCrop?: boolean;
	colors?: string[];
	colorRatios?: number[];
	seed?: string | number;
	animate?: boolean;
	animationSpeed?: number;
	movementIntensity?: number;
	scaleIntensity?: number;
	blurEnabled?: boolean;
	blurStdDeviation?: number;
	glowEnabled?: boolean;
	glowStdDeviation?: number;
	glowIntensity?: number;
	glowBlendMode?: GlowBlendMode;
	noiseEnabled?: boolean;
	noiseOpacity?: number;
	noiseFrequency?: number;
	coarseNoiseOpacity?: number;
	coarseNoiseFrequency?: number;
	warpEnabled?: boolean;
	warpAmount?: number;
	warpSpeed?: number;
	warpBaseFrequency?: number;
	metaballEnabled?: boolean;
	metaballBlur?: number;
	metaballThreshold?: number;
	bloomEnabled?: boolean;
	bloomThreshold?: number;
	bloomRadius?: number;
	bloomIntensity?: number;
	posterizeEnabled?: boolean;
	posterizeLevels?: number;
	posterizeOpacity?: number;
	causticEnabled?: boolean;
	causticIntensity?: number;
	causticScale?: number;
	causticSpeed?: number;
	depthEnabled?: boolean;
	depthLayers?: number;
	depthStrength?: number;
	vignetteEnabled?: boolean;
	vignetteAmount?: number;
	vignetteColor?: string;
	fringeEnabled?: boolean;
	fringeAmount?: number;
	sweepEnabled?: boolean;
	sweepIntensity?: number;
	sweepWidth?: number;
	sweepSpeed?: number;
	sweepAngle?: number;
	paletteDriftEnabled?: boolean;
	paletteDriftSpeed?: number;
	hueRotateEnabled?: boolean;
	hueRotateDegrees?: number;
	hueRotateSpeed?: number;
	shapeMode?: ShapeMode;
	shapeSelections?: ShapeSelection[];
	shapeSpeedMin?: number;
	shapeSpeedMax?: number;
	className?: string;
};

export type OrbFilterIds = {
	blurFilterId: string;
	metaballFilterId: string;
	glowFilterId: string;
	fineNoiseFilterId: string;
	coarseNoiseFilterId: string;
	warpFilterId: string;
	bloomFilterId: string;
	posterizeFilterId: string;
	causticFilterId: string;
	fringeFilterId: string;
	hueRotateFilterId: string;
	sweepGradientId: string;
	vignetteGradientId: string;
	shapeGroupId: string;
};
