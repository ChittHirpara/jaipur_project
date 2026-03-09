import { History } from 'lucide-react';
import { motion } from 'motion/react';

interface RecentCapsulesProps {
  snapshots: any[];
  onSelectSnapshot: (snapshot: any) => void;
}

export function RecentCapsules({ snapshots, onSelectSnapshot }: RecentCapsulesProps) {
  return (
    <section className="flex-1 overflow-hidden flex flex-col">
      <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        <History className="w-3 h-3" />
        Recent Capsules
      </h3>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {snapshots.map((s) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            key={s.id} 
            onClick={() => onSelectSnapshot(s)}
            className="p-3 rounded-lg border border-cos-border bg-cos-bg/50 hover:border-cos-accent/30 transition-colors group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-mono text-cos-accent">{s.app_title}</span>
              <span className="text-[9px] text-gray-600">{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p className="text-xs font-bold text-gray-200 line-clamp-1 mb-1">{s.intent}</p>
            <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">{s.content}</p>
          </motion.div>
        ))}
        {snapshots.length === 0 && (
          <div className="text-center py-8 text-gray-600 italic text-xs">
            No snapshots captured yet.
          </div>
        )}
      </div>
    </section>
  );
}
