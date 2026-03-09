import { Settings } from 'lucide-react';
import { cn } from '../lib/utils';

interface AutomationSettingsProps {
  autoCaptureEnabled: boolean;
  setAutoCaptureEnabled: (val: boolean) => void;
  captureInterval: number;
  setCaptureInterval: (val: number) => void;
  isScreenShared: boolean;
}

export function AutomationSettings({
  autoCaptureEnabled,
  setAutoCaptureEnabled,
  captureInterval,
  setCaptureInterval,
  isScreenShared
}: AutomationSettingsProps) {
  return (
    <section>
      <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Settings className="w-3 h-3" />
        Automation Settings
      </h3>
      <div className={cn(
        "space-y-4 p-4 rounded-xl border transition-colors",
        autoCaptureEnabled ? "border-cos-accent/50 bg-cos-accent/5" : "border-cos-border bg-cos-bg/30"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs font-medium transition-colors",
              autoCaptureEnabled ? "text-cos-accent" : "text-gray-300"
            )}>Auto-Capture</span>
            {autoCaptureEnabled && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cos-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cos-accent"></span>
              </span>
            )}
          </div>
          <button 
            onClick={() => {
              if (!isScreenShared && !autoCaptureEnabled) {
                alert("Please connect a screen first before enabling auto-capture.");
                return;
              }
              setAutoCaptureEnabled(!autoCaptureEnabled);
            }}
            className={cn(
              "w-10 h-5 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-cos-accent/50 focus:ring-offset-1 focus:ring-offset-cos-bg",
              autoCaptureEnabled ? "bg-cos-accent" : "bg-gray-700"
            )}
            aria-pressed={autoCaptureEnabled}
            aria-label="Toggle Auto-Capture"
          >
            <div className={cn(
              "absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm",
              autoCaptureEnabled ? "left-6" : "left-1"
            )} />
          </button>
        </div>
        <div className={cn("transition-opacity", autoCaptureEnabled ? "opacity-100" : "opacity-50")}>
          <div className="flex justify-between mb-1.5">
            <label className="text-[10px] text-gray-500 uppercase">Interval (sec)</label>
            <span className={cn(
              "text-[10px] font-mono",
              autoCaptureEnabled ? "text-cos-accent" : "text-gray-500"
            )}>{captureInterval}s</span>
          </div>
          <input 
            type="range"
            min="10"
            max="300"
            step="10"
            value={captureInterval}
            onChange={(e) => setCaptureInterval(parseInt(e.target.value))}
            disabled={!autoCaptureEnabled}
            className={cn(
              "w-full h-1 rounded-lg appearance-none cursor-pointer",
              autoCaptureEnabled ? "bg-gray-700 accent-cos-accent" : "bg-gray-800 accent-gray-600 cursor-not-allowed"
            )}
          />
        </div>
      </div>
    </section>
  );
}
