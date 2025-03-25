"use client"; // Ensure this runs only on the client side

import { useEffect, useRef } from "react";
import * as fabric from "fabric"; // v6

export default function FabricCanvas() {
  const canvasEl = useRef(null);

  useEffect(() => {
    const options = {
      backgroundColor: "lightgray", // Optional background color
    };

    const canvas = new fabric.Canvas(canvasEl.current, options);

    // Create a red rectangle
    const rect = new fabric.Rect({
      left: 50,
      top: 50,
      width: 100,
      height: 100,
      fill: "red",
    });

    // Create a white circle
    const circle = new fabric.Circle({
      left: 200,
      top: 100,
      radius: 50,
      fill: "white",
    });

    // Add shapes to the canvas
    canvas.add(rect, circle);

    return () => {
      canvas.dispose(); // Cleanup on component unmount
    };
  }, []);

  return <canvas width="300" height="300" ref={canvasEl} />;
}
