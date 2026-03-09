import { Camera, MonitorOff, MonitorPlay, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { RefObject } from 'react';

interface LiveMonitorProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isScreenShared: boolean;
  isListening: boolean;
  spokenContext: string;
  isCapturing: boolean;
  startScreenCapture: () => void;
  stopScreenCapture: () => void;
  handleCapture: () => void;
}

export function LiveMonitor({
  videoRef,
  canvasRef,
  isScreenShared,
  isListening,
  spokenContext,
  isCapturing,
  startScreenCapture,
  stopScreenCapture,
  handleCapture
}: LiveMonitorProps) {
  return (
    <section>
      <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Camera className="w-3 h-3" />
        Live Workspace Monitor
      </h3>
      <div className="space-y-4">
        <div className="relative w-full aspect-video bg-cos-bg border border-cos-border rounded-lg overflow-hidden flex items-center justify-center">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className={cn("w-full h-full object-cover", !isScreenShared && "hidden")}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {!isScreenShared && (
            <div className="text-center p-4">
              <MonitorOff className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No screen connected</p>
            </div>
          )}
          {isScreenShared && (
            <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 backdrop-blur-sm border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-mono text-white uppercase tracking-wider">Live</span>
              </div>
              {isListening && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 backdrop-blur-sm border border-white/10 max-w-[200px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-cos-accent animate-pulse shrink-0" />
                  <span className="text-[9px] font-mono text-white truncate" title={spokenContext}>
                    {spokenContext || "Listening..."}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {!isScreenShared ? (
          <button 
            onClick={startScreenCapture}
            className="w-full py-3 rounded-lg font-display font-bold text-sm flex items-center justify-center gap-2 transition-all bg-cos-accent text-black hover:scale-[1.02] active:scale-[0.98] neon-glow"
          >
            <MonitorPlay className="w-4 h-4" />
            Connect Screen
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={stopScreenCapture}
              className="py-3 rounded-lg font-display font-bold text-xs flex items-center justify-center gap-2 transition-all bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30"
            >
              Disconnect
            </button>
            <button 
              onClick={handleCapture}
              disabled={isCapturing}
              className={cn(
                "py-3 rounded-lg font-display font-bold text-xs flex items-center justify-center gap-2 transition-all",
                isCapturing 
                  ? "bg-cos-accent/20 text-cos-accent cursor-not-allowed" 
                  : "bg-cos-accent/10 text-cos-accent hover:bg-cos-accent/20 border border-cos-accent/30"
              )}
            >
              {isCapturing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {isCapturing ? "Scanning..." : "Snap Now"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
