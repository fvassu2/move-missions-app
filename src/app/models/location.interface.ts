export interface Location {
  id: string;
  name: string;
  x: number;
  y: number;
  zone?: string;
  type?: 'storage' | 'pickup' | 'dropoff' | 'charging' | 'staging';
}
