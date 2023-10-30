import {
  DrawEvent,
  FillBoundaryType,
  applyDrawEvent,
  breadthFirstTraversal,
  getColor,
  recomputeSegments,
  smoothPaint,
} from "@/common";
import { ClientState } from "./state";

/**
 * The alpha value to use when drawing.
 */
const kDrawAlpha = 0.5;

/**
 * The alpha value to add to kDrawAlpha when drawing the border of a segment.
 */
const kBorderAlphaBoost = 0.5;

export function getSegment(
  segmentBuffer: Int32Array,
  width: number,
  pos: readonly [number, number]
): number {
  return segmentBuffer[pos[1] * width + pos[0]];
}

function setSegment(
  segmentBuffer: Int32Array,
  width: number,
  pos: readonly [number, number],
  segment: number
): void {
  segmentBuffer[pos[1] * width + pos[0]] = segment;
}

function fill(
  segmentBuffer: Int32Array,
  drawing: THREE.DataTexture,
  pos: readonly [number, number],
  type: FillBoundaryType
): void {
  fillPixel(
    drawing,
    pos,
    [drawing.image.width, drawing.image.height],
    type === FillBoundaryType.boundary
      ? kDrawAlpha + kBorderAlphaBoost
      : type === FillBoundaryType.notBoundary
      ? kDrawAlpha
      : drawing.image.data[(pos[1] * drawing.image.width + pos[0]) * 4 + 3] /
        255,
    getColor(getSegment(segmentBuffer, drawing.image.width, pos))
  );
}

export function fillUpdatedSegment(
  state: ClientState,
  event: {
    boundary: [number, number][];
    fillStart: [number, number] | undefined;
  },
  segment: number,
  dimensions: readonly [number, number]
): void {
  const initialSegment = event.fillStart
    ? state.segmentBuffer[
        event.fillStart[1] * dimensions[0] + event.fillStart[0]
      ]
    : null;
  for (const point of event.boundary as [number, number][]) {
    state.segmentBuffer[point[1] * dimensions[0] + point[0]] = segment;
    fillPixel(
      state.drawing,
      point,
      dimensions,
      kDrawAlpha + kBorderAlphaBoost,
      getColor(segment)
    );
  }
  if (initialSegment !== null) {
    breadthFirstTraversal(event.fillStart!, (pos) => {
      if (
        pos[0] < 0 ||
        pos[1] < 0 ||
        pos[0] >= dimensions[0] ||
        pos[1] >= dimensions[1]
      ) {
        return false;
      }
      if (state.segmentBuffer[pos[1] * dimensions[0] + pos[0]] === segment) {
        return true;
      }
      if (
        state.segmentBuffer[pos[1] * dimensions[0] + pos[0]] === initialSegment
      ) {
        state.segmentBuffer[pos[1] * dimensions[0] + pos[0]] = segment;
        fillPixel(
          state.drawing,
          pos,
          dimensions,
          kDrawAlpha,
          getColor(segment)
        );
        return true;
      } else {
        return false;
      }
    });
  }
}

export function smoothPaintClient(
  state: ClientState,
  event: DrawEvent
): Map<number, { newBoundaryPoints: Set<string> }> {
  return smoothPaint(
    (pos) => getSegment(state.segmentBuffer, state.drawing.image.width, pos),
    (pos, segment) =>
      setSegment(state.segmentBuffer, state.drawing.image.width, pos, segment),
    (pos, type) => fill(state.segmentBuffer, state.drawing, pos, type),
    state,
    event,
    [state.drawing.image.width, state.drawing.image.height]
  );
}

export function applyDrawEventClient(
  state: ClientState,
  event: DrawEvent,
  segment: number
): void {
  applyDrawEvent(
    (pos) => getSegment(state.segmentBuffer, state.drawing.image.width, pos),
    (pos) =>
      setSegment(state.segmentBuffer, state.drawing.image.width, pos, segment),
    (pos, type) => fill(state.segmentBuffer, state.drawing, pos, type),
    segment,
    event,
    [state.drawing.image.width, state.drawing.image.height]
  );
}

export function recomputeSegmentsClient(
  state: ClientState,
  effectedSegments: Map<number, { newBoundaryPoints: Set<string> }>
): void {
  recomputeSegments(
    (pos) => getSegment(state.segmentBuffer, state.drawing.image.width, pos),
    (pos, segment) =>
      setSegment(state.segmentBuffer, state.drawing.image.width, pos, segment),
    (pos, type) => fill(state.segmentBuffer, state.drawing, pos, type),
    (pos) =>
      state.drawing.image.data[
        (pos[1] * state.drawing.image.width + pos[0]) * 4 + 3
      ] === 255,
    state,
    [state.drawing.image.width, state.drawing.image.height],
    effectedSegments
  );
}

/**
 * fills a pixel in the drawing uniform.
 */
export function fillPixel(
  drawing: THREE.DataTexture,
  pos: readonly [number, number],
  resolution: readonly [number, number],
  alpha: number,
  color: THREE.Color
): void {
  const pixelIndex = (pos[1] * resolution[0] + pos[0]) * 4;
  const data = drawing.image.data;
  data[pixelIndex] = color.r * 255;
  data[pixelIndex + 1] = color.g * 255;
  data[pixelIndex + 2] = color.b * 255;
  data[pixelIndex + 3] = alpha * 255;
  drawing.needsUpdate = true;
}