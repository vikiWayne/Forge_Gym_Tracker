export const measurementLabels = {
  waist: "Waist",
  chest: "Chest",
  hips: "Hips",
  "left-arm": "Left arm",
  "right-arm": "Right arm",
  "left-thigh": "Left thigh",
  "right-thigh": "Right thigh",
  "left-calf": "Left calf",
  "right-calf": "Right calf",
};
export type MeasurementType = keyof typeof measurementLabels;
export type Measurement = {
  id: string;
  type: MeasurementType;
  value: number;
  date: string;
  notes: string;
};
