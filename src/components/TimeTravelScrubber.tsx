interface TimeTravelScrubberProps {
  snapshots: any[];
  timeFilter: number | null;
  setTimeFilter: (val: number) => void;
}

export function TimeTravelScrubber({ snapshots, timeFilter, setTimeFilter }: TimeTravelScrubberProps) {
  if (snapshots.length === 0 || timeFilter === null) return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-3/4 max-w-md glass px-6 py-4 rounded-2xl border-cos-border flex flex-col gap-2">
      <div className="flex justify-between items-center text-[10px] font-mono text-cos-accent uppercase tracking-widest">
        <span>Time Travel</span>
        <span>{new Date(timeFilter).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <input 
        type="range"
        min={new Date(snapshots[snapshots.length - 1]?.timestamp || Date.now()).getTime()}
        max={new Date(snapshots[0]?.timestamp || Date.now()).getTime()}
        step="1000"
        value={timeFilter}
        onChange={(e) => setTimeFilter(parseInt(e.target.value))}
        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cos-accent"
      />
    </div>
  );
}
