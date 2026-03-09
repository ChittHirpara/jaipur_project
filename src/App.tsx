import React, { useState, useEffect, useRef } from 'react';
import { Cpu } from 'lucide-react';
import { geminiService } from './services/geminiService';
import { CognitiveGraph } from './components/CognitiveGraph';
import { Header } from './components/Header';
import { LiveMonitor } from './components/LiveMonitor';
import { AutomationSettings } from './components/AutomationSettings';
import { RecentCapsules } from './components/RecentCapsules';
import { SmartRecall } from './components/SmartRecall';
import { PredictiveResume } from './components/PredictiveResume';
import { ProactiveNotification } from './components/ProactiveNotification';
import { TimeTravelScrubber } from './components/TimeTravelScrubber';
import { SnapshotModal } from './components/SnapshotModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [isCapturing, setIsCapturing] = useState(false);
  const [query, setQuery] = useState('');
  const [recallResponse, setRecallResponse] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(false);
  const [captureInterval, setCaptureInterval] = useState(30); // seconds
  const [isScreenShared, setIsScreenShared] = useState(false);
  const [timeFilter, setTimeFilter] = useState<number | null>(null);
  const [spokenContext, setSpokenContext] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isVoiceQuerying, setIsVoiceQuerying] = useState(false);
  const [proactiveNotification, setProactiveNotification] = useState<{title: string, message: string} | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for voice commands in continuous spoken context
    const lowerContext = spokenContext.toLowerCase();
    if (lowerContext.includes("what was i doing") || 
        lowerContext.includes("what was i working on") || 
        lowerContext.includes("recall context")) {
      
      // Extract the relevant part or just use the whole context
      setQuery(spokenContext);
      handleRecall(spokenContext);
      
      // Clear to prevent repeated triggers
      setSpokenContext('');
    }
  }, [spokenContext]);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = Math.max(0, event.results.length - 3); i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        setSpokenContext(transcript.trim());
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
      };
    }
    fetchData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoCaptureEnabled && isScreenShared) {
      interval = setInterval(() => {
        handleCapture();
      }, captureInterval * 1000);
    }
    return () => clearInterval(interval);
  }, [autoCaptureEnabled, captureInterval, isScreenShared]);

  const startScreenCapture = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error("Screen sharing is not supported in this browser or context. Please try opening the app in a new tab.");
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScreenShared(true);
        setAutoCaptureEnabled(true);
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch (e) {}
        }
      }
      stream.getVideoTracks()[0].onended = () => {
        setIsScreenShared(false);
        setAutoCaptureEnabled(false);
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          setIsListening(false);
        }
      };
    } catch (err: any) {
      console.error("Error sharing screen:", err);
      if (err.message && err.message.includes("not allowed by the user agent")) {
        alert("Screen sharing is restricted inside this preview iframe. Please click the 'Open in New Tab' button (the square icon with an arrow in the top right of the preview window) to use this feature.");
      } else {
        alert("Failed to share screen: " + err.message);
      }
    }
  };

  const stopScreenCapture = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsScreenShared(false);
      setAutoCaptureEnabled(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  };

  const fetchData = async () => {
    try {
      const [snapRes, graphRes] = await Promise.all([
        fetch('/api/snapshots'),
        fetch('/api/graph')
      ]);
      const snaps = await snapRes.json();
      const graph = await graphRes.json();
      setSnapshots(snaps);
      setGraphData(graph);
      
      if (snaps.length > 0 && timeFilter === null) {
        setTimeFilter(new Date(snaps[0].timestamp).getTime());
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  const handleCapture = async () => {
    if (!isScreenShared || !videoRef.current || !canvasRef.current) {
      alert("Please connect a screen first.");
      return;
    }
    setIsCapturing(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.5);

      const analysis = await geminiService.analyzeScreenshot(base64Image, spokenContext);
      const embeddingText = `${analysis.intent} ${analysis.content}`;
      const embedding = await geminiService.generateEmbedding(embeddingText);

      // Proactive Context Injection Logic
      if (snapshots.length > 0) {
        const lastSnapshot = snapshots[0];
        if (lastSnapshot.app_title !== analysis.app_title) {
          // Context switch detected! Find similar past contexts (excluding recent ones)
          const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
          const olderSnapshots = snapshots.filter(s => new Date(s.timestamp).getTime() < fiveMinsAgo);
          
          if (olderSnapshots.length > 0) {
            const cosineSimilarity = (vecA: number[], vecB: number[]) => {
              if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
              let dotProduct = 0, normA = 0, normB = 0;
              for (let i = 0; i < vecA.length; i++) {
                dotProduct += vecA[i] * vecB[i];
                normA += vecA[i] * vecA[i];
                normB += vecB[i] * vecB[i];
              }
              if (normA === 0 || normB === 0) return 0;
              return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
            };

            let bestMatch = null;
            let highestScore = 0;

            for (const s of olderSnapshots) {
              if (s.embedding) {
                const score = cosineSimilarity(embedding, s.embedding);
                if (score > highestScore) {
                  highestScore = score;
                  bestMatch = s;
                }
              }
            }

            if (bestMatch && highestScore > 0.85) {
              setProactiveNotification({
                title: `Welcome back to ${analysis.app_title}`,
                message: `You were working on "${bestMatch.intent}" previously. Want me to restore that context?`
              });
              // Auto-hide after 10 seconds
              setTimeout(() => setProactiveNotification(null), 10000);
            }
          }
        }
      }

      await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_title: analysis.app_title || 'Unknown App',
          content: analysis.content || 'No content detected',
          summary: analysis.summary || analysis.content,
          intent: analysis.intent || 'Unknown intent',
          cluster_id: analysis.cluster_id || 5,
          embedding: embedding
        })
      });

      await fetchData();
    } catch (err) {
      console.error("Capture failed", err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRecall = async (overrideQuery?: string) => {
    const q = typeof overrideQuery === 'string' ? overrideQuery : query;
    if (!q.trim()) return;
    setIsQuerying(true);
    try {
      // 1. Generate embedding for query
      const queryEmbedding = await geminiService.generateEmbedding(q);
      
      // 2. Compute cosine similarity
      const cosineSimilarity = (vecA: number[], vecB: number[]) => {
        if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
          dotProduct += vecA[i] * vecB[i];
          normA += vecA[i] * vecA[i];
          normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
      };

      const scoredSnapshots = snapshots.map(s => {
        const score = s.embedding ? cosineSimilarity(queryEmbedding, s.embedding) : 0;
        return { ...s, score };
      }).sort((a, b) => b.score - a.score);

      // 3. Take top 5 most relevant
      const topContext = scoredSnapshots.slice(0, 5);

      const response = await geminiService.getRecall(q, topContext);
      setRecallResponse(response || '');
    } catch (err) {
      console.error("Recall failed", err);
    } finally {
      setIsQuerying(false);
    }
  };

  const startVoiceRecall = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    setIsVoiceQuerying(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      handleRecall(transcript);
    };
    
    recognition.onerror = (event: any) => {
      console.error("Voice query error", event.error);
      setIsVoiceQuerying(false);
    };
    
    recognition.onend = () => {
      setIsVoiceQuerying(false);
    };
    
    recognition.start();
  };

  const clearData = async () => {
    if (confirm("Clear all cognitive history?")) {
      await fetch('/api/snapshots', { method: 'DELETE' });
      fetchData();
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify({ snapshots, graphData }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `cos-context-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.snapshots && Array.isArray(data.snapshots)) {
          // In a real app, we'd send these to the backend to save them
          // For now, we'll just update the local state to demonstrate
          setSnapshots(data.snapshots);
          if (data.graphData) {
            setGraphData(data.graphData);
          }
          alert("Data imported successfully!");
        } else {
          alert("Invalid backup file format.");
        }
      } catch (err) {
        console.error("Failed to parse backup file", err);
        alert("Failed to parse backup file.");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const [selectedSnapshot, setSelectedSnapshot] = useState<any | null>(null);

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <Header 
        onClearData={clearData} 
        onExportData={exportData} 
        onImportData={importData} 
      />

      <main className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        {/* Left Sidebar: Live Monitor */}
        <aside className="col-span-12 lg:col-span-3 border-r border-cos-border p-6 flex flex-col gap-6 glass">
          <LiveMonitor 
            videoRef={videoRef}
            canvasRef={canvasRef}
            isScreenShared={isScreenShared}
            isListening={isListening}
            spokenContext={spokenContext}
            isCapturing={isCapturing}
            startScreenCapture={startScreenCapture}
            stopScreenCapture={stopScreenCapture}
            handleCapture={handleCapture}
          />

          <AutomationSettings 
            autoCaptureEnabled={autoCaptureEnabled}
            setAutoCaptureEnabled={setAutoCaptureEnabled}
            captureInterval={captureInterval}
            setCaptureInterval={setCaptureInterval}
            isScreenShared={isScreenShared}
          />

          <RecentCapsules 
            snapshots={snapshots} 
            onSelectSnapshot={setSelectedSnapshot} 
          />
        </aside>

        {/* Center: Graph Visualization */}
        <section className="col-span-12 lg:col-span-6 relative bg-cos-bg">
          <div className="absolute top-6 left-6 z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border-cos-accent/20">
              <Cpu className="w-3 h-3 text-cos-accent" />
              <span className="text-[10px] font-mono text-cos-accent uppercase tracking-widest">Cognitive State Graph</span>
            </div>
          </div>

          <div className="w-full h-full">
            <CognitiveGraph data={{
              nodes: graphData.nodes.filter(n => new Date(n.timestamp).getTime() <= (timeFilter || Date.now())),
              links: graphData.links.filter(l => {
                const sourceNode = graphData.nodes.find(n => n.id === l.source);
                const targetNode = graphData.nodes.find(n => n.id === l.target);
                if (!sourceNode || !targetNode) return false;
                return new Date(sourceNode.timestamp).getTime() <= (timeFilter || Date.now()) && 
                       new Date(targetNode.timestamp).getTime() <= (timeFilter || Date.now());
              })
            }} />
          </div>

          {/* Legend */}
          <div className="absolute top-6 right-6 flex gap-4 text-[9px] font-mono text-gray-500 uppercase tracking-wider glass px-4 py-2 rounded-full border-cos-border flex-wrap max-w-md justify-end">
            {Array.from(new Set(graphData.nodes.map(n => n.cluster_id))).sort((a, b) => a - b).map(clusterId => {
              const hue = (clusterId * 137.508) % 360;
              const color = `hsl(${hue}, 80%, 60%)`;
              const names = ["Dev", "Business", "Research", "Comms", "Other"];
              const name = names[(clusterId - 1) % names.length] || `Cluster ${clusterId}`;
              return (
                <div key={clusterId} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} /> {name}
                </div>
              );
            })}
          </div>

          <TimeTravelScrubber 
            snapshots={snapshots} 
            timeFilter={timeFilter} 
            setTimeFilter={setTimeFilter} 
          />
        </section>

        {/* Right Sidebar: Recall & Resume */}
        <aside className="col-span-12 lg:col-span-3 border-l border-cos-border p-6 flex flex-col gap-6 glass relative">
          <ProactiveNotification notification={proactiveNotification} />

          <SmartRecall 
            query={query}
            setQuery={setQuery}
            handleRecall={handleRecall}
            isQuerying={isQuerying}
            recallResponse={recallResponse}
            isVoiceQuerying={isVoiceQuerying}
            startVoiceRecall={startVoiceRecall}
          />

          <PredictiveResume 
            snapshots={snapshots} 
            onSelectSnapshot={setSelectedSnapshot} 
          />
        </aside>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-8 border-t border-cos-border glass flex items-center justify-between px-6 text-[9px] font-mono text-gray-500 uppercase tracking-widest">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cos-accent" />
            System: Nominal
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cos-accent" />
            Memory: {snapshots.length} Capsules
          </div>
        </div>
        <div>
          v1.0.4-BETA // COGNITIVE_OS_CORE
        </div>
      </footer>

      <SnapshotModal 
        snapshot={selectedSnapshot} 
        onClose={() => setSelectedSnapshot(null)} 
      />
    </div>
  );
}
