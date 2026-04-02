import type {
	RandomFn,
	ShapeConfig,
	ShapeKind,
	ShapeMode,
	ShapeSelection,
} from '@/components/orb-field/types';
import {
	buildColorPool,
	clamp,
	randomBetween,
} from '@/components/orb-field/utils';

type BuildShapesInput = {
	circleCount: number;
	width: number;
	height: number;
	minRadius: number;
	maxRadius: number;
	allowCrop: boolean;
	palette: string[];
	ratios: number[];
	random: RandomFn;
	animationSpeed: number;
	movementIntensity: number;
	scaleIntensity: number;
	depthEnabled: boolean;
	depthLayers: number;
	depthStrength: number;
	shapeMode: ShapeMode;
	shapeSelections?: ShapeSelection[];
	shapeSpeedMin: number;
	shapeSpeedMax: number;
};

function resolveShapeSelections(
	shapeMode: ShapeMode,
	shapeSelections?: ShapeSelection[],
): ShapeSelection[] {
	if (shapeSelections && shapeSelections.length > 0) {
		return shapeSelections;
	}

	if (shapeMode === 'normal') {
		return ['circle', 'square', 'rect'];
	}

	if (shapeMode === 'abstract') {
		return ['abstract-sharp', 'abstract-curved'];
	}

	return ['circle', 'square', 'rect', 'abstract-sharp', 'abstract-curved'];
}

function pickShapeKind(
	shapeMode: ShapeMode,
	shapeSelections: ShapeSelection[] | undefined,
	random: RandomFn,
): ShapeKind {
	const pool = resolveShapeSelections(shapeMode, shapeSelections);
	const pick = pool[Math.floor(random() * pool.length)] ?? 'circle';

	if (pick === 'abstract-sharp') {
		return 'path-sharp';
	}

	if (pick === 'abstract-curved') {
		return 'path-curved';
	}

	return pick;
}

function buildSharpAbstractPath(radius: number, random: RandomFn): string {
	const points = Math.floor(randomBetween(5, 10, random));
	const coords: Array<{ x: number; y: number }> = [];

	for (let index = 0; index < points; index += 1) {
		const angle =
			(Math.PI * 2 * index) / points + randomBetween(-0.2, 0.2, random);
		const localRadius = radius * randomBetween(0.52, 1.22, random);
		coords.push({
			x: Math.cos(angle) * localRadius,
			y: Math.sin(angle) * localRadius,
		});
	}

	const [first, ...rest] = coords;
	if (!first) {
		return 'M 0 0 Z';
	}

	return `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} ${rest
		.map((coord) => `L ${coord.x.toFixed(2)} ${coord.y.toFixed(2)}`)
		.join(' ')} Z`;
}

function buildCurvedAbstractPath(radius: number, random: RandomFn): string {
	const points = Math.floor(randomBetween(5, 9, random));
	const coords: Array<{ x: number; y: number }> = [];

	for (let index = 0; index < points; index += 1) {
		const angle =
			(Math.PI * 2 * index) / points + randomBetween(-0.28, 0.28, random);
		const localRadius = radius * randomBetween(0.5, 1.18, random);
		coords.push({
			x: Math.cos(angle) * localRadius,
			y: Math.sin(angle) * localRadius,
		});
	}

	if (coords.length < 3) {
		return buildSharpAbstractPath(radius, random);
	}

	const first = coords[0];
	if (!first) {
		return 'M 0 0 Z';
	}

	let path = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} `;

	for (let index = 0; index < coords.length; index += 1) {
		const current = coords[index];
		const next = coords[(index + 1) % coords.length];
		if (!current || !next) {
			continue;
		}

		const midX = (current.x + next.x) / 2;
		const midY = (current.y + next.y) / 2;
		path += `Q ${current.x.toFixed(2)} ${current.y.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)} `;
	}

	return `${path}Z`;
}

export function buildShapes({
	circleCount,
	width,
	height,
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
}: BuildShapesInput): ShapeConfig[] {
	const safeCount = Math.max(1, Math.floor(circleCount));
	const sortedMin = Math.max(8, Math.min(minRadius, maxRadius));
	const sortedMax = Math.max(sortedMin, Math.max(minRadius, maxRadius));
	const colorPool = buildColorPool(safeCount, palette, ratios, random);
	const safeMovement = Math.max(0, movementIntensity);
	const safeScale = Math.max(0, scaleIntensity);
	const safeSpeed = Math.max(0.1, animationSpeed);
	const layerCount = Math.max(1, Math.floor(depthLayers));
	const safeDepthStrength = Math.max(0, depthStrength);
	const speedMin = clamp(Math.min(shapeSpeedMin, shapeSpeedMax), 0.15, 3);
	const speedMax = clamp(Math.max(shapeSpeedMin, shapeSpeedMax), speedMin, 3);
	const aspectRatio = width / Math.max(height, 1);
	const columnCount = Math.max(
		1,
		Math.round(Math.sqrt(safeCount * aspectRatio)),
	);
	const rowCount = Math.max(1, Math.ceil(safeCount / columnCount));
	const totalCells = rowCount * columnCount;
	const cellWidth = width / columnCount;
	const cellHeight = height / rowCount;
	const shuffledCells = Array.from({ length: totalCells }, (_, index) => index);

	for (let i = shuffledCells.length - 1; i > 0; i -= 1) {
		const j = Math.floor(random() * (i + 1));
		const current = shuffledCells[i];
		shuffledCells[i] = shuffledCells[j];
		shuffledCells[j] = current;
	}

	return Array.from({ length: safeCount }, (_, index) => {
		const layer = depthEnabled ? Math.floor(random() * layerCount) : 0;
		const layerWeight =
			layerCount > 1 ? layer / (layerCount - 1) : depthEnabled ? 0.5 : 0;

		const baseRadius = randomBetween(sortedMin, sortedMax, random);
		const radiusScale = depthEnabled
			? 0.9 + layerWeight * (0.28 * safeDepthStrength + 0.15)
			: 1;
		const radius = baseRadius * radiusScale;
		const kind = pickShapeKind(shapeMode, shapeSelections, random);

		let widthScale = 1;
		let heightScale = 1;
		let pathData: string | undefined;

		if (kind === 'square') {
			widthScale = randomBetween(1.5, 2.35, random);
			heightScale = widthScale;
		} else if (kind === 'rect') {
			widthScale = randomBetween(1.7, 3.2, random);
			heightScale = randomBetween(0.8, 1.7, random);
		} else if (kind === 'path-sharp' || kind === 'path-curved') {
			widthScale = randomBetween(1.8, 2.8, random);
			heightScale = widthScale;
			pathData =
				kind === 'path-curved'
					? buildCurvedAbstractPath(radius, random)
					: buildSharpAbstractPath(radius, random);
		}

		const shapeWidth = radius * widthScale;
		const shapeHeight = radius * heightScale;
		const shapeExtent = Math.max(radius, shapeWidth / 2, shapeHeight / 2);

		const minX = allowCrop ? 0 : shapeExtent;
		const maxX = allowCrop ? width : Math.max(shapeExtent, width - shapeExtent);
		const minY = allowCrop ? 0 : shapeExtent;
		const maxY = allowCrop
			? height
			: Math.max(shapeExtent, height - shapeExtent);

		const cellIndex = shuffledCells[index % totalCells] ?? index;
		const cellColumn = cellIndex % columnCount;
		const cellRow = Math.floor(cellIndex / columnCount);
		const cellCenterX = (cellColumn + 0.5) * cellWidth;
		const cellCenterY = (cellRow + 0.5) * cellHeight;
		const jitterX = randomBetween(-cellWidth * 0.38, cellWidth * 0.38, random);
		const jitterY = randomBetween(
			-cellHeight * 0.38,
			cellHeight * 0.38,
			random,
		);
		const x = clamp(cellCenterX + jitterX, minX, maxX);
		const y = clamp(cellCenterY + jitterY, minY, maxY);

		const depthMotionBoost = depthEnabled
			? 1 + safeDepthStrength * (0.35 + layerWeight * 0.85)
			: 1;
		const driftRangeX = width * 0.22 * safeMovement * depthMotionBoost;
		const driftRangeY = height * 0.22 * safeMovement * depthMotionBoost;

		const fill = colorPool[index];
		const fillIndex = Math.max(0, palette.indexOf(fill));
		let altIndex = Math.floor(random() * palette.length);
		if (altIndex === fillIndex) {
			altIndex = (altIndex + 1) % palette.length;
		}
		const altFill = palette[altIndex] ?? fill;

		const baseScale = randomBetween(1.03, 1.34, random);
		const opacityBase = randomBetween(0.46, 0.84, random);
		const opacityDepthBoost = depthEnabled ? layerWeight * 0.08 : 0;
		const speedFactor = randomBetween(speedMin, speedMax, random);
		const baseRotation = kind === 'circle' ? 0 : randomBetween(-30, 30, random);
		const rotationDrift =
			kind === 'circle'
				? randomBetween(-4, 4, random)
				: randomBetween(-22, 22, random) * Math.max(0.35, safeMovement);

		return {
			id: index,
			kind,
			x,
			y,
			radius,
			width: shapeWidth,
			height: shapeHeight,
			pathData,
			fill,
			altFill,
			driftX: randomBetween(-driftRangeX, driftRangeX, random),
			driftY: randomBetween(-driftRangeY, driftRangeY, random),
			duration:
				randomBetween(18, 40, random) /
				(safeSpeed *
					speedFactor *
					(depthEnabled ? 0.9 + layerWeight * 0.4 : 1)),
			delay: randomBetween(0, 6, random),
			opacity: clamp(opacityBase + opacityDepthBoost, 0.32, 0.96),
			maxScale: 1 + (baseScale - 1) * safeScale,
			depthLayer: layer,
			baseRotation,
			rotationDrift,
		};
	});
}
