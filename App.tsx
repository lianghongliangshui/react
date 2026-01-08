import React, { useState, useRef, useEffect, useCallback } from 'react';
import AudioPlayer, { RHAP_UI } from 'react-h5-audio-player';
import { Upload, Music, FileText, Play, SkipBack, SkipForward, AlertCircle } from 'lucide-react';

import { Subtitle } from './types';
import { parseSRT } from './utils/srtParser';
import SubtitleList from './components/SubtitleList';

// We need to extend the type because the library ref type doesn't expose the audio element directly in the typedef sometimes
interface AudioPlayerRef {
  audio: {
    current: HTMLAudioElement | null;
  };
}

const App: React.FC = () => {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string>('');
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [subtitleName, setSubtitleName] = useState<string>('');
  
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [segmentEndTime, setSegmentEndTime] = useState<number | null>(null);
  
  const playerRef = useRef<AudioPlayer>(null);

  // Handle File Uploads
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioSrc(url);
      setAudioName(file.name);
      // Reset state
      setActiveIndex(-1);
      setSegmentEndTime(null);
    }
  };

  const handleSrtUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSubtitleName(file.name);
      const text = await file.text();
      try {
        const parsed = parseSRT(text);
        setSubtitles(parsed);
      } catch (err) {
        console.error("Failed to parse SRT", err);
        alert("Failed to parse subtitle file.");
      }
    }
  };

  // Play a specific subtitle segment
  const playSegment = useCallback((index: number) => {
    if (!audioSrc || index < 0 || index >= subtitles.length) return;
    
    const sub = subtitles[index];
    setActiveIndex(index);
    setSegmentEndTime(sub.end);

    const player = playerRef.current;
    if (player && player.audio.current) {
      player.audio.current.currentTime = sub.start;
      player.audio.current.play();
    }
  }, [audioSrc, subtitles]);

  // Handle Playback Loop (Stop at end of segment)
  const handleListen = (e: Event) => {
    const target = e.target as HTMLAudioElement;
    const currentTime = target.currentTime;

    // Check if we need to stop at the end of a segment
    if (segmentEndTime !== null && currentTime >= segmentEndTime) {
        target.pause();
        setSegmentEndTime(null); // Clear segment mode so user can play freely if they want
        // Optionally: reset currentTime to start of segment or leave it at end
    }

    // Update active index if playing manually (not via segment click)
    // This allows the highlight to follow along if the user just presses "Play"
    if (segmentEndTime === null) {
      const currentSubIndex = subtitles.findIndex(
        s => currentTime >= s.start && currentTime < s.end
      );
      if (currentSubIndex !== -1 && currentSubIndex !== activeIndex) {
        setActiveIndex(currentSubIndex);
      }
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) playSegment(activeIndex - 1);
  };

  const handleNext = () => {
    if (activeIndex < subtitles.length - 1) playSegment(activeIndex + 1);
  };

  const handleReplay = () => {
    if (activeIndex !== -1) playSegment(activeIndex);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-10">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Music size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">React Audio Player</h1>
              <p className="text-xs text-gray-500">MP3 + SRT Synchronizer</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            {/* Audio Input */}
            <div className="relative group">
              <input
                type="file"
                id="audioInput"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
              <div className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
                ${audioName 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}
              `}>
                <Music size={16} />
                <span className="max-w-[150px] truncate">
                  {audioName || "Select Audio"}
                </span>
                <Upload size={14} className="ml-1 opacity-50" />
              </div>
            </div>

            {/* Subtitle Input */}
            <div className="relative group">
              <input
                type="file"
                id="srtInput"
                accept=".srt,.txt"
                onChange={handleSrtUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
              <div className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
                ${subtitleName 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}
              `}>
                <FileText size={16} />
                <span className="max-w-[150px] truncate">
                  {subtitleName || "Select Subtitles"}
                </span>
                <Upload size={14} className="ml-1 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
        
        {/* Left Col: Controls & Status */}
        <div className="md:col-span-1 flex flex-col gap-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Current Segment</h3>
            <div className="text-3xl font-mono text-blue-600 font-bold mb-2">
              {activeIndex !== -1 && subtitles[activeIndex] 
                ? `#${activeIndex + 1}` 
                : "--"}
            </div>
            <p className="text-sm text-gray-500 h-10 line-clamp-2">
              {activeIndex !== -1 && subtitles[activeIndex] 
                ? subtitles[activeIndex].text 
                : "Select a line to play"}
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
             <div className="grid grid-cols-3 gap-2 mb-4">
                <button 
                  onClick={handlePrev} 
                  disabled={!audioSrc || activeIndex <= 0}
                  className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700"
                >
                  <SkipBack size={20} />
                  <span className="text-xs mt-1 font-medium">Prev</span>
                </button>
                <button 
                   onClick={handleReplay}
                   disabled={!audioSrc || activeIndex === -1}
                   className="flex flex-col items-center justify-center p-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Play size={20} />
                  <span className="text-xs mt-1 font-medium">Replay</span>
                </button>
                <button 
                  onClick={handleNext}
                  disabled={!audioSrc || activeIndex >= subtitles.length - 1}
                  className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700"
                >
                  <SkipForward size={20} />
                  <span className="text-xs mt-1 font-medium">Next</span>
                </button>
             </div>
             
             {/* Audio Player Component */}
             <div className="pt-4 border-t border-gray-100">
                {!audioSrc ? (
                    <div className="flex items-center justify-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg text-sm">
                        <AlertCircle size={16} />
                        <span>Please load audio first</span>
                    </div>
                ) : (
                    <AudioPlayer
                        ref={playerRef}
                        src={audioSrc}
                        onListen={handleListen}
                        listenInterval={100} // Check every 100ms for segment end
                        customProgressBarSection={[
                          RHAP_UI.CURRENT_TIME,
                          RHAP_UI.PROGRESS_BAR,
                          RHAP_UI.DURATION,
                        ]}
                        customControlsSection={[
                            RHAP_UI.MAIN_CONTROLS,
                            RHAP_UI.VOLUME_CONTROLS,
                        ]}
                        showJumpControls={false}
                        autoPlayAfterSrcChange={false}
                        layout="stacked-reverse"
                    />
                )}
             </div>
          </div>
        </div>

        {/* Right Col: Transcript */}
        <div className="md:col-span-2 h-[500px] md:h-auto">
          <SubtitleList 
            subtitles={subtitles} 
            activeIndex={activeIndex} 
            onSubtitleClick={playSegment} 
          />
        </div>
      </main>
    </div>
  );
};

export default App;