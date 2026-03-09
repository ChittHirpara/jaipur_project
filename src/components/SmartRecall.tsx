import { MessageSquare, Search, Mic, RefreshCw, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface SmartRecallProps {
  query: string;
  setQuery: (val: string) => void;
  handleRecall: () => void;
  isQuerying: boolean;
  recallResponse: string;
  isVoiceQuerying: boolean;
  startVoiceRecall: () => void;
}

export function SmartRecall({
  query,
  setQuery,
  handleRecall,
  isQuerying,
  recallResponse,
  isVoiceQuerying,
  startVoiceRecall
}: SmartRecallProps) {
  return (
    <section className="flex flex-col h-1/2">
      <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        <MessageSquare className="w-3 h-3" />
        Smart Recall
      </h3>
      <div className="flex-1 bg-cos-bg/50 border border-cos-border rounded-xl p-4 overflow-y-auto mb-4 custom-scrollbar">
        {recallResponse ? (
          <div className="prose prose-invert prose-xs">
            <ReactMarkdown>{recallResponse}</ReactMarkdown>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <Search className="w-8 h-8 text-gray-700 mb-3" />
            <p className="text-xs text-gray-500 italic">"What was I doing before the meeting?"</p>
          </div>
        )}
      </div>
      <div className="relative">
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRecall()}
          placeholder={isVoiceQuerying ? "Listening..." : "Ask COS..."}
          className="w-full bg-cos-bg border border-cos-border rounded-lg pl-4 pr-20 py-2.5 text-sm focus:outline-none focus:border-cos-accent transition-colors"
          disabled={isVoiceQuerying}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button 
            onClick={startVoiceRecall}
            disabled={isVoiceQuerying || isQuerying}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              isVoiceQuerying ? "text-red-500 bg-red-500/10 animate-pulse" : "text-gray-400 hover:text-cos-accent hover:bg-cos-accent/10"
            )}
            title="Voice Query"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleRecall()}
            disabled={isQuerying || isVoiceQuerying}
            className="p-1.5 text-cos-accent hover:bg-cos-accent/10 rounded-md transition-colors"
          >
            {isQuerying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </section>
  );
}
