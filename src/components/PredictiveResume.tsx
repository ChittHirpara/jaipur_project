import { Zap } from 'lucide-react';

interface PredictiveResumeProps {
  snapshots: any[];
  onSelectSnapshot: (snapshot: any) => void;
}

export function PredictiveResume({ snapshots, onSelectSnapshot }: PredictiveResumeProps) {
  return (
    <section className="flex-1">
      <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Zap className="w-3 h-3" />
        Predictive Resume
      </h3>
      <div className="space-y-3">
        {snapshots.slice(0, 3).map((s, idx) => (
          <div 
            key={s.id} 
            onClick={() => onSelectSnapshot(s)}
            className="p-4 rounded-xl border border-cos-border bg-gradient-to-br from-cos-surface to-cos-bg hover:border-cos-accent/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-gray-500">PROPOSAL {idx + 1}</span>
              <span className="text-[10px] font-mono text-cos-accent">{Math.floor(90 - idx * 15)}% Match</span>
            </div>
            <h4 className="text-sm font-display font-bold mb-1 group-hover:text-cos-accent transition-colors">Resume {s.intent}?</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">Last active in {s.app_title} about {Math.floor((Date.now() - new Date(s.timestamp).getTime()) / 60000)}m ago.</p>
          </div>
        ))}
        {snapshots.length === 0 && (
          <div className="text-center py-8 text-gray-600 italic text-xs">
            Awaiting data for predictions...
          </div>
        )}
      </div>
    </section>
  );
}
