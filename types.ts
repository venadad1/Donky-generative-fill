
export interface Point {
  x: number;
  y: number;
}

export interface DrawPath {
  points: Point[];
  brushSize: number;
}

export interface GenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}
