export type DrawEvent = {
  from: readonly [number, number];
  to: readonly [number, number];
  size: number;
};

export type DrawResponse = DrawEvent & {
  segment: number;
  historyIndex: number;
};

export type FloodFillResponse = {
  segment: number;
  startingPoint: readonly [number, number];
};

export type FloodFillEvent = {
  segment: number;
  points: Set<string>;
};

export type StateResponse = {
  draws: DrawResponse[];
  fills: FloodFillResponse[];
};

export type State = {
  segmentBuffer: { id: number; inSegmentNeighbors: 0 | 1 | 2 | 3 | 4 }[];
  resolution: readonly [number, number];
  imageIndex: number;
  nextSegmentIndex: number;
};
