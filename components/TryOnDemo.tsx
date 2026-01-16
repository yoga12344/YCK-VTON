
import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Camera, RefreshCw, CheckCircle, 
  Zap, User, Shirt, Terminal, Maximize2,
  Download, Sparkles, Footprints, Layers
} from 'lucide-react';
import { analyzeTryOn, generateVirtualTryOnImage } from '../services/geminiService';
import { GeminiResult, ImageUploads, Gender } from '../types';

// Custom Brush-Stroke Infinity Logo Component (re-defined locally for standalone use)
const BrushInfinity = ({ className = "w-4 h-4", color = "currentColor" }: { className?: string, color?: string }) => (
  <svg viewBox="0 0 100 50" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="brush-texture-demo" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
      </filter>
    </defs>
    <path 
      d="M25 15C15 15 10 25 25 35C40 45 60 5 75 15C90 25 85 35 75 35C65 35 45 15 25 15Z" 
      stroke={color} 
      strokeWidth="10" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      filter="url(#brush-texture-demo)"
    />
  </svg>
);

interface TryOnDemoProps {
  genderSelection: Gender;
}

const TryOnDemo: React.FC<TryOnDemoProps> = ({ genderSelection }) => {
  const [images, setImages] = useState<ImageUploads>({ person: null, top: null, bottom: null, dress: null });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'inputs' | 'result'>('inputs');
  const [result, setResult] = useState<GeminiResult>({
    garmentDescription: '',
    personDescription: '',
    technicalPrompt: '',
    status: 'idle'
  });

  const personInputRef = useRef<HTMLInputElement>(null);
  const topInputRef = useRef<HTMLInputElement>(null);
  const bottomInputRef = useRef<HTMLInputElement>(null);
  const dressInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setImages({ person: null, top: null, bottom: null, dress: null });
    setResult({
      garmentDescription: '',
      personDescription: '',
      technicalPrompt: '',
      status: 'idle'
    });
    setActiveTab('inputs');
    setIsCameraActive(false);
  }, [genderSelection]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isCameraActive && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 768 }, height: { ideal: 1024 } } 
      })
        .then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => {
          console.error("Camera access denied", err);
          setIsCameraActive(false);
        });
    }
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [isCameraActive]);

  const handleFileChange = (type: keyof ImageUploads) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImages(prev => ({ ...prev, person: dataUrl }));
        setIsCameraActive(false);
      }
    }
  };

  const handleProcess = async () => {
    if (!images.person || (!images.top && !images.bottom && !images.dress)) return;
    setResult(prev => ({ ...prev, status: 'processing', error: undefined }));
    setActiveTab('result');

    try {
      const analysis = await analyzeTryOn(images.person, images.top, images.bottom, images.dress, genderSelection);
      setResult(prev => ({ ...prev, ...analysis }));
      const finalImage = await generateVirtualTryOnImage(
        images.person, 
        images.top,
        images.bottom,
        images.dress,
        analysis.technicalPrompt,
        analysis.bodySize || 'M',
        genderSelection
      );
      if (!finalImage) throw new Error("Synthesis produced an empty result.");
      setResult(prev => ({ ...prev, resultImageUrl: finalImage || undefined, status: 'success' }));
    } catch (err: any) {
      setResult(prev => ({ ...prev, status: 'error', error: err.message || 'Processing failed.' }));
    }
  };

  const reset = () => {
    setImages({ person: null, top: null, bottom: null, dress: null });
    setResult({ garmentDescription: '', personDescription: '', technicalPrompt: '', status: 'idle' });
    setActiveTab('inputs');
  };

  const canProcess = images.person && (images.top || images.bottom || images.dress);

  return (
    <section id="demo" className="py-24 px-6 max-w-[1400px] mx-auto overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Centered Branding Section */}
      <div className="flex flex-col items-center text-center mb-24 gap-12 border-b border-white/5 pb-16">
        <div className="space-y-8 max-w-3xl flex flex-col items-center">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">
            <BrushInfinity className="w-5 h-5 text-blue-400" /> Neural Synthesis Engine v4.1
          </div>
          <h2 className="text-6xl sm:text-8xl font-black tracking-tighter uppercase leading-none">
            Pro <span className="text-blue-500/80 font-light italic">Studio</span>
          </h2>
          <p className="text-slate-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
            Professional virtual try-on using <span className="text-white font-medium">Parallel Conditioning Pipelines</span>. 
            Now supporting <span className="text-blue-400 font-bold">dresses</span> for seamless one-piece styling.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* Workspace: Left (Conditioning Inputs) */}
        <div className="lg:col-span-4 space-y-10">
          <div className="glass rounded-[2rem] p-10 border-white/10 space-y-12 shadow-2xl">
            <div className="space-y-6">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" /> 01 // Target Acquisition
              </label>
              <div className="relative aspect-[3/4] rounded-3xl border border-white/10 bg-black/60 overflow-hidden group shadow-inner">
                {isCameraActive ? (
                  <div className="relative w-full h-full">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                    <div className="absolute inset-x-0 bottom-8 flex justify-center">
                      <button onClick={capturePhoto} className="w-16 h-16 rounded-full bg-white border-8 border-white/20 hover:scale-110 active:scale-90 transition-all shadow-[0_0_50px_rgba(255,255,255,0.4)]" />
                    </div>
                  </div>
                ) : (
                  <div onClick={() => personInputRef.current?.click()} className="w-full h-full cursor-pointer transition-all hover:bg-white/[0.03]">
                    {images.person ? (
                      <img src={images.person} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 hover:text-blue-500/60 transition-colors">
                        <Upload className="w-12 h-12 mb-6 opacity-30" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Initialize Frame</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <input type="file" ref={personInputRef} className="hidden" accept="image/*" onChange={handleFileChange('person')} />
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <Shirt className="w-4 h-4 text-blue-500" /> 02 // Asset Injection
              </label>
              
              <div className={`grid ${genderSelection === 'WOMEN' ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                <div onClick={() => topInputRef.current?.click()} className="aspect-square rounded-2xl border border-white/10 bg-black/60 overflow-hidden cursor-pointer group hover:bg-white/[0.03] shadow-inner relative">
                  {images.top ? (
                    <img src={images.top} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center opacity-30 group-hover:opacity-100 transition-all text-slate-700">
                      <Upload className="w-6 h-6 mb-2" />
                      <span className="text-[7px] font-black uppercase tracking-widest">Top</span>
                    </div>
                  )}
                </div>

                {genderSelection === 'WOMEN' && (
                  <div onClick={() => dressInputRef.current?.click()} className="aspect-square rounded-2xl border border-white/10 bg-black/60 overflow-hidden cursor-pointer group hover:bg-white/[0.03] shadow-inner relative border-blue-500/20">
                    {images.dress ? (
                      <img src={images.dress} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center opacity-30 group-hover:opacity-100 transition-all text-slate-700">
                        <Layers className="w-6 h-6 mb-2 text-blue-400" />
                        <span className="text-[7px] font-black uppercase tracking-widest">Dress</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest">1-Piece</div>
                  </div>
                )}

                <div onClick={() => bottomInputRef.current?.click()} className="aspect-square rounded-2xl border border-white/10 bg-black/60 overflow-hidden cursor-pointer group hover:bg-white/[0.03] shadow-inner relative">
                  {images.bottom ? (
                    <img src={images.bottom} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center opacity-30 group-hover:opacity-100 transition-all text-slate-700">
                      <Upload className="w-6 h-6 mb-2" />
                      <span className="text-[7px] font-black uppercase tracking-widest">Bottom</span>
                    </div>
                  )}
                </div>
              </div>
              <input type="file" ref={topInputRef} className="hidden" accept="image/*" onChange={handleFileChange('top')} />
              <input type="file" ref={bottomInputRef} className="hidden" accept="image/*" onChange={handleFileChange('bottom')} />
              <input type="file" ref={dressInputRef} className="hidden" accept="image/*" onChange={handleFileChange('dress')} />
            </div>

            <button
              disabled={!canProcess || result.status === 'processing'}
              onClick={handleProcess}
              className="w-full py-6 rounded-2xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-10 transition-all font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-5 shadow-[0_20px_40px_rgba(37,99,235,0.2)]"
            >
              {result.status === 'processing' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {result.status === 'processing' ? 'Processing...' : 'Run Neural Synthesis'}
            </button>
          </div>
        </div>

        {/* Workspace: Right (Neural Output & Controls) */}
        <div className="lg:col-span-8 flex flex-col min-h-[850px]">
          <div className="flex items-center justify-between mb-8 border-b border-white/5">
            <div className="flex items-center gap-10">
               {['inputs', 'result'].map((tab) => (
                 <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`text-[11px] font-black uppercase tracking-[0.4em] py-5 relative transition-all ${activeTab === tab ? 'text-white' : 'text-slate-600 hover:text-slate-300'}`}
                 >
                   {tab === 'inputs' ? 'Telemetry' : 'Canvas'}
                   {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-500 rounded-full" />}
                 </button>
               ))}
            </div>
          </div>

          <div className="flex-1 rounded-[3rem] bg-black/40 border border-white/10 overflow-hidden relative shadow-2xl">
            {/* Studio Control Overlay Inside Canvas Container */}
            <div className="absolute top-8 right-8 z-50 flex items-center gap-3 bg-slate-900/60 p-2 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-2xl scale-90 sm:scale-100">
               <button onClick={() => setIsCameraActive(!isCameraActive)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isCameraActive ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
                 <Camera className="w-4 h-4" /> {isCameraActive ? 'Kill Feed' : 'Active Sensor'}
               </button>
               <button onClick={reset} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white/5 text-slate-400 hover:text-white transition-all">
                 <RefreshCw className="w-4 h-4" /> Reset Studio
               </button>
            </div>

            {activeTab === 'inputs' || result.status === 'idle' ? (
              <div className="p-16 pt-24 space-y-16 h-full overflow-y-auto custom-scrollbar">
                <div className="space-y-8">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-3">
                    <Terminal className="w-3.5 h-3.5" /> Pipeline Analytics
                  </h3>
                  <div className="grid gap-5">
                    <PipelineRow label="Spatial Mapping" active={result.status === 'processing' && !result.bodySize} done={!!result.bodySize} />
                    <PipelineRow label="Feature Alignment" active={result.status === 'processing' && !!result.bodySize && !result.garmentDescription} done={!!result.garmentDescription} />
                    <PipelineRow label="High-Fidelity Rendering" active={result.status === 'processing' && !!result.garmentDescription} done={result.status === 'success'} />
                  </div>
                </div>

                {result.status !== 'idle' && (
                  <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="space-y-6">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5" /> System Logic Logs
                      </h3>
                      <div className="bg-slate-900/40 rounded-3xl p-10 border border-white/10 font-mono text-[12px] text-slate-400 leading-relaxed">
                        {result.personDescription ? (
                           <div className="space-y-4">
                              <p className="text-blue-400/80 uppercase font-bold text-[10px]">> ANALYSIS_COMPLETE</p>
                              <p>{result.personDescription}</p>
                              <p className="text-blue-400/80 uppercase font-bold text-[10px]">> GARMENT_DATA_EXTRACTED</p>
                              <p>{result.garmentDescription}</p>
                           </div>
                        ) : "Awaiting acquisition data..."}
                      </div>
                    </div>

                    {result.stylingSuggestions && (
                      <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Styling Recommendations
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="glass p-8 rounded-3xl border border-blue-500/10 space-y-4">
                            <div className="flex items-center gap-3 text-blue-400">
                              <Layers className="w-4 h-4" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Coordinated Pieces</span>
                            </div>
                            <p className="text-[12px] text-slate-300 font-light leading-relaxed">
                              {images.dress ? (result.stylingSuggestions.suggestedShoes || "Evaluating shoe match...") : (result.stylingSuggestions.suggestedPants || result.stylingSuggestions.suggestedShirt || "Analyzing coordination...")}
                            </p>
                          </div>
                          <div className="glass p-8 rounded-3xl border border-blue-500/10 space-y-4">
                            <div className="flex items-center gap-3 text-blue-400">
                              <Footprints className="w-4 h-4" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Footwear Pairing</span>
                            </div>
                            <p className="text-[12px] text-slate-300 font-light leading-relaxed">
                              {result.stylingSuggestions.suggestedShoes || "Evaluating structural match..."}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {result.status === 'idle' && (
                  <div className="h-full flex flex-col items-center justify-center opacity-[0.03]">
                    <Maximize2 className="w-32 h-32 mb-8" />
                    <span className="text-[12px] font-black uppercase tracking-[1.5em]">System Standby</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 bg-[#050505] relative">
                {result.status === 'processing' && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl z-30 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-[3px] border-blue-500/10 border-t-blue-500 rounded-full animate-spin mb-8" />
                    <span className="text-[10px] font-black uppercase tracking-[0.8em] text-blue-500 animate-pulse">Computing Synthesis Frames</span>
                  </div>
                )}
                {result.resultImageUrl ? (
                  <>
                    <img src={result.resultImageUrl} className="w-full h-full object-contain rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-90 duration-1000" />
                    <a 
                      href={result.resultImageUrl} 
                      download="neural-try-on-asset.png"
                      className="absolute bottom-8 left-8 p-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-2xl flex items-center gap-3 font-bold text-[11px] uppercase tracking-widest z-40 group"
                    >
                      <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                      Download Asset
                    </a>
                  </>
                ) : images.person && (
                  <img src={images.person} className="w-full h-full object-contain opacity-10 grayscale blur-3xl" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const PipelineRow = ({ label, active, done }: { label: string, active: boolean, done: boolean }) => (
  <div className={`flex items-center gap-8 p-6 rounded-[1.25rem] border transition-all duration-700 ${done ? 'bg-blue-500/5 border-blue-500/10' : active ? 'bg-white/[0.05] border-white/20 animate-pulse' : 'bg-transparent border-transparent opacity-20'}`}>
    <div className={`w-4 h-4 rounded-full ${done ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]' : active ? 'bg-blue-400 animate-ping' : 'bg-slate-800'}`} />
    <span className={`text-[12px] font-bold uppercase tracking-widest ${done ? 'text-blue-400' : 'text-slate-500'}`}>{label}</span>
    {done && <CheckCircle className="w-5 h-5 ml-auto text-blue-500" />}
  </div>
);

export default TryOnDemo;
