import { Brain, Activity, Shield, Trash2, Download, Upload } from 'lucide-react';

interface HeaderProps {
  onClearData: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Header({ onClearData, onExportData, onImportData }: HeaderProps) {
  return (
    <header className="h-16 border-b border-cos-border flex items-center justify-between px-6 glass z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-cos-accent/10 flex items-center justify-center border border-cos-accent/30">
          <Brain className="text-cos-accent w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg tracking-tight">COS <span className="text-cos-accent">CONTEXT KEEPER</span></h1>
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-cos-accent animate-pulse" />
            Cognitive Persistence Layer Active
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-6 text-xs font-mono text-gray-400 mr-4">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-cos-accent" />
            <span>Drift: 0.04</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-cos-accent" />
            <span>Local-Only</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 border-l border-cos-border pl-4">
          <label className="p-2 hover:bg-cos-accent/10 rounded-lg transition-colors text-gray-500 hover:text-cos-accent cursor-pointer" title="Import Data">
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" className="hidden" onChange={onImportData} />
          </label>
          <button 
            onClick={onExportData}
            className="p-2 hover:bg-cos-accent/10 rounded-lg transition-colors text-gray-500 hover:text-cos-accent"
            title="Export Data"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={onClearData}
            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-500 hover:text-red-500"
            title="Clear Data"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
