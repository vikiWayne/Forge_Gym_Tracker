type Point = [number, number];
// Side-view joint positions: head, shoulder, hip, knee, ankle, elbow, wrist.
type Pose = [Point, Point, Point, Point, Point, Point, Point];
type Demo = {
  poses: [Pose, Pose];
  labels: [string, string];
  counter?: boolean;
  dumbbell?: boolean;
};
export const demos: Record<string, Demo> = {
  squat: {
    labels: ["Stand tall", "Lower with control"],
    poses: [
      [
        [128, 29],
        [128, 51],
        [129, 91],
        [130, 125],
        [129, 160],
        [144, 66],
        [162, 62],
      ],
      [
        [138, 57],
        [126, 75],
        [106, 111],
        [147, 125],
        [129, 160],
        [153, 84],
        [173, 79],
      ],
    ],
  },
  "incline-push-up": {
    labels: ["Arms extended", "Chest approaches counter"],
    counter: true,
    poses: [
      [
        [174, 56],
        [156, 69],
        [120, 100],
        [94, 126],
        [68, 160],
        [177, 82],
        [199, 96],
      ],
      [
        [198, 72],
        [174, 87],
        [132, 112],
        [100, 133],
        [68, 160],
        [172, 107],
        [199, 96],
      ],
    ],
  },
  bridge: {
    labels: ["Hips down", "Hips lifted"],
    poses: [
      [
        [76, 149],
        [101, 151],
        [145, 154],
        [174, 122],
        [199, 160],
        [124, 157],
        [148, 159],
      ],
      [
        [76, 149],
        [101, 151],
        [143, 126],
        [175, 107],
        [199, 160],
        [124, 157],
        [148, 159],
      ],
    ],
  },
  row: {
    labels: ["Weights hanging", "Elbows toward ribs"],
    dumbbell: true,
    poses: [
      [
        [173, 56],
        [151, 69],
        [111, 90],
        [129, 123],
        [123, 160],
        [152, 98],
        [153, 128],
      ],
      [
        [173, 56],
        [151, 69],
        [111, 90],
        [129, 123],
        [123, 160],
        [122, 65],
        [138, 90],
      ],
    ],
  },
  hinge: {
    labels: ["Stand tall", "Hips back"],
    dumbbell: true,
    poses: [
      [
        [124, 27],
        [124, 49],
        [124, 91],
        [128, 124],
        [125, 160],
        [135, 72],
        [141, 99],
      ],
      [
        [165, 58],
        [148, 76],
        [106, 93],
        [123, 125],
        [125, 160],
        [143, 101],
        [139, 126],
      ],
    ],
  },
  "floor-press": {
    labels: ["Weights over chest", "Upper arms touch floor"],
    dumbbell: true,
    poses: [
      [
        [67, 149],
        [95, 151],
        [141, 154],
        [171, 121],
        [196, 160],
        [97, 124],
        [98, 96],
      ],
      [
        [67, 149],
        [95, 151],
        [141, 154],
        [171, 121],
        [196, 160],
        [122, 153],
        [124, 126],
      ],
    ],
  },
};

export function drawPose(canvas: HTMLCanvasElement, demo: Demo, phase: 0 | 1) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const [head, shoulder, hip, knee, ankle, elbow, wrist] = demo.poses[phase];
  const styles = getComputedStyle(canvas);
  const ink = styles.getPropertyValue("--text").trim() || "#e8ede5";
  const accent = styles.getPropertyValue("--primary").trim() || "#87bd56";
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineCap = "round";
  context.lineJoin = "round";
  function line(color: string, width: number, ...points: Point[]) {
    context!.strokeStyle = color;
    context!.lineWidth = width;
    context!.beginPath();
    context!.moveTo(...points[0]);
    points.slice(1).forEach((point) => context!.lineTo(...point));
    context!.stroke();
  }
  line(ink, 1, [38, 165], [243, 165]);
  if (demo.counter) line(ink, 4, [194, 99], [234, 99], [234, 164]);
  line(ink, 6, shoulder, hip, knee, ankle, [ankle[0] + 12, 162]);
  line(accent, 6, shoulder, elbow, wrist);
  context.fillStyle = ink;
  context.beginPath();
  context.arc(...head, 10, 0, Math.PI * 2);
  context.fill();
  if (demo.dumbbell) {
    const [x, y] = wrist;
    line(ink, 4, [x - 11, y], [x + 11, y]);
    line(ink, 5, [x - 11, y - 5], [x - 11, y + 5]);
    line(ink, 5, [x + 11, y - 5], [x + 11, y + 5]);
  }
}
