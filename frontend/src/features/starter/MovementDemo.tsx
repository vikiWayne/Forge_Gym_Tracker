import { useEffect, useRef, useState } from "react";
import { demos, drawPose } from "./movementPoses";
import type { CatalogMovement } from "./useStarterCatalog";

export function MovementDemo({ movement }: { movement: CatalogMovement }) {
  const [phase, setPhase] = useState<0 | 1>(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const demo = demos[movement.id];
  useEffect(() => {
    if (demo && canvas.current) drawPose(canvas.current, demo, phase);
  }, [demo, phase]);
  return (
    <div className="movement-demo">
      {demo && (
        <>
          <canvas
            ref={canvas}
            width={280}
            height={185}
            role="img"
            aria-label={`${movement.name}: ${demo.labels[phase]}`}
          />
          <div className="form-actions" aria-label="Demo position">
            {demo.labels.map((label, index) => (
              <button
                key={label}
                type="button"
                className={`button ${index === phase ? "primary" : "secondary"}`}
                aria-pressed={index === phase}
                onClick={() => setPhase(index === 0 ? 0 : 1)}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
      <ol>
        {movement.cues.map((cue) => (
          <li key={cue}>{cue}</li>
        ))}
      </ol>
    </div>
  );
}
