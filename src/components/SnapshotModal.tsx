import { X, Calendar, MessageSquare, Target, FileText, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SnapshotModalProps {
  snapshot: any;
  onClose: () => void;
}

export function SnapshotModal({ snapshot, onClose }: SnapshotModalProps) {
  if (!snapshot) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-cos-surface border border-cos-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-cos-border bg-cos-bg/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cos-accent/10 flex items-center justify-center border border-cos-accent/30">
                <Target className="text-cos-accent w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-white">{snapshot.app_title}</h2>
                <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                  <Calendar className="w-3 h-3" />
                  {new Date(snapshot.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
            <section>
              <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Activity className="w-3 h-3" />
                Detected Intent
              </h3>
              <div className="p-4 rounded-xl bg-cos-bg border border-cos-border">
                <p className="text-sm text-gray-200">{snapshot.intent}</p>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <FileText className="w-3 h-3" />
                Summary
              </h3>
              <div className="p-4 rounded-xl bg-cos-bg border border-cos-border">
                <p className="text-sm text-gray-300 leading-relaxed">{snapshot.summary}</p>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <MessageSquare className="w-3 h-3" />
                Raw Content
              </h3>
              <div className="p-4 rounded-xl bg-cos-bg border border-cos-border overflow-x-auto">
                <pre className="text-xs font-mono text-gray-400 whitespace-pre-wrap">{snapshot.content}</pre>
              </div>
            </section>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
