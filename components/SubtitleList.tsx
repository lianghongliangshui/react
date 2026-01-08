import React, { useEffect, useRef } from 'react';
import { Subtitle } from '../types';
import { formatTime } from '../utils/srtParser';
import { Play, Clock } from 'lucide-react';

interface SubtitleListProps {
  subtitles: Subtitle[];
  activeIndex: number;
  onSubtitleClick: (index: number) => void;
}

const SubtitleList: React.FC<SubtitleListProps> = ({ subtitles, activeIndex, onSubtitleClick }) => {
  const activeRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active subtitle
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  if (subtitles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
        <p className="text-lg font-medium">No subtitles loaded</p>
        <p className="text-sm">Upload an .srt file to see the transcript.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-700">Transcript</h3>
        <span className="text-xs font-medium px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
          {subtitles.length} lines
        </span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {subtitles.map((sub, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={sub.id}
              ref={isActive ? activeRef : null}
              onClick={() => onSubtitleClick(index)}
              className={`
                group flex gap-3 p-3 rounded-md cursor-pointer transition-all duration-200 border-l-4
                ${isActive 
                  ? 'bg-blue-50 border-blue-500 shadow-sm' 
                  : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'}
              `}
            >
              <div className="flex flex-col items-center gap-1 min-w-[60px] pt-1">
                <span className={`text-xs font-mono font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                  {formatTime(sub.start)}
                </span>
                {isActive && <Play size={12} className="text-blue-500 animate-pulse" />}
              </div>
              <p className={`text-sm leading-relaxed ${isActive ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                {sub.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubtitleList;