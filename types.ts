export interface Subtitle {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}