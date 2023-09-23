import * as THREE from "three";
import { FrameCallbackParams } from "../../renderer";
import { Tool } from "../tool";
import { smoothPaint } from "../utils";

export abstract class DrawTool extends Tool {
  public readonly size: number;
  public readonly cursorOverlayTexture: THREE.DataTexture;
  protected readonly color: THREE.Color;
  protected readonly alpha: number;

  constructor(size: number, color: THREE.Color, alpha: number) {
    super();
    this.size = size;
    this.color = color;
    this.alpha = alpha;
    const data = new Uint8Array(this.size * this.size * 4);
    this.paintCursorOverlay(data);
    this.cursorOverlayTexture = new THREE.DataTexture(
      data,
      this.size,
      this.size
    );
    this.cursorOverlayTexture.needsUpdate = true;
  }

  protected abstract paintCursorOverlay(data: Uint8Array): void;

  protected abstract paint(
    drawPoint: (pos: THREE.Vector2) => void,
    pos: THREE.Vector2,
    size: number,
    resolution: THREE.Vector2
  ): void;

  public cursorOverlay(): THREE.Texture {
    return this.cursorOverlayTexture;
  }

  public frameHandler(params: FrameCallbackParams): void {
    smoothPaint({ ...params }, (pos) => {
      this.paint(
        (pos) => params.drawPoint(pos, this.color, this.alpha),
        pos,
        this.size,
        params.resolution
      );
    });
  }
}