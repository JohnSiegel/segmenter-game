"use client";

import * as THREE from "three";
import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, ShaderPass } from "three-stdlib";
import { useBackground } from "./background-loader";
import {
  backgroundFragmentShader,
  buildFragmentShader,
  vertexShader,
} from "./shaders";
import { useDrawingLayer } from "./drawing-layer";
import { usePan, useZoom } from "./controls";

export const kSubdivisionSize = 256;

export function PainterRenderer(): null {
  const { gl } = useThree();

  const [background] = useBackground();

  if (!background) {
    throw new Error("Background not loaded");
  }

  const [currentZoom] = useZoom();
  const [currentPan] = usePan();

  const drawingLayer = useDrawingLayer();

  const [backgroundComposer, drawingComposers, zoomUniform, panUniform] =
    useMemo(() => {
      const zoom = new THREE.Uniform(currentZoom);
      const pan = new THREE.Uniform(currentPan);

      const bgComposer = new EffectComposer(gl);
      bgComposer.addPass(
        new ShaderPass(
          new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader: backgroundFragmentShader,
            uniforms: {
              pan,
              zoom,
              background: new THREE.Uniform(background),
            },
          })
        )
      );

      const drawingComps: EffectComposer[] = [];
      for (let i = 0; i < drawingLayer.numSections().y + 1; i++) {
        for (let j = 0; j < drawingLayer.numSections().x + 1; j++) {
          const sectionSize = drawingLayer.sectionSize(j, i);
          if (sectionSize.x > 0 && sectionSize.y > 0) {
            const drawing = new THREE.WebGLRenderTarget(
              sectionSize.x,
              sectionSize.y,
              {
                stencilBuffer: true,
              }
            );

            const drawingComposer = new EffectComposer(gl, drawing);

            const drawingShader = buildFragmentShader(
              sectionSize.clone().divide(drawingLayer.pixelSize),
              new THREE.Vector2(j, i)
                .multiplyScalar(kSubdivisionSize)
                .divide(drawingLayer.pixelSize)
            );

            drawingComposer.addPass(
              new ShaderPass(
                new THREE.ShaderMaterial({
                  vertexShader,
                  fragmentShader: drawingShader,
                  uniforms: {
                    inputDiffuse: drawingLayer.uniform(j, i),
                    pan,
                    zoom,
                  },
                  transparent: true,
                })
              )
            );

            drawingComps.push(drawingComposer);
          } else {
            drawingComps.push(new EffectComposer(gl));
          }
        }
      }
      return [bgComposer, drawingComps, zoom, pan];
    }, [background]);

  useEffect(() => {
    panUniform.value = currentPan;
  }, [currentPan]);

  useEffect(() => {
    zoomUniform.value = currentZoom;
  }, [currentZoom]);

  return useFrame(() => {
    gl.clear();
    gl.autoClear = false;

    backgroundComposer.render();

    for (let i = 0; i < drawingLayer.numSections().y + 1; i++) {
      for (let j = 0; j < drawingLayer.numSections().x + 1; j++) {
        if (
          drawingLayer.sectionSize(j, i).x !== 0 &&
          drawingLayer.sectionSize(j, i).y !== 0
        ) {
          drawingComposers[i * (drawingLayer.numSections().x + 1) + j].render();
        }
      }
    }
  });
}
