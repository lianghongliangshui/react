import { Subtitle } from '../types';

function parseTime(t: string): number {
  const [hms, ms] = t.split(',');
  const parts = hms.split(':').map(Number);
  
  let h = 0, m = 0, s = 0;
  if (parts.length === 3) {
    [h, m, s] = parts;
  } else if (parts.length === 2) {
    [m, s] = parts;
  }
  
  return (h * 3600) + (m * 60) + s + (parseInt(ms || '0', 10) / 1000);
}

export function parseSRT(data: string): Subtitle[] {
  const normalizedData = data.replace(/\r/g, '');
  const items: Subtitle[] = [];
  const blocks = normalizedData.split('\n\n');
  
  let idCounter = 0;

  blocks.forEach(block => {
    const lines = block.split('\n');
    if (lines.length >= 2) {
      // Find the timestamp line (contains -->)
      const timeLineIndex = lines.findIndex(l => l.includes('-->'));
      
      if (timeLineIndex !== -1) {
        const times = lines[timeLineIndex].split(' --> ');
        if (times.length === 2) {
          const start = parseTime(times[0].trim());
          const end = parseTime(times[1].trim());
          // Text is everything after timestamp
          const text = lines.slice(timeLineIndex + 1).join('\n').trim();
          
          if (text) {
             items.push({ 
              id: idCounter++, 
              start, 
              end, 
              text 
            });
          }
        }
      }
    }
  });
  
  return items;
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}