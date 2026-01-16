
import React, { useState } from 'react';
import { 
  Menu,
  Zap
} from 'lucide-react';
import TryOnDemo from './components/TryOnDemo';
import { Gender } from './types';

// Custom Brush-Stroke Infinity Logo Component
const BrushInfinity = ({ className = "w-10 h-10", color = "currentColor" }: { className?: string, color?: string }) => (
  <svg viewBox="0 0 100 50" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="brush-texture" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
      </filter>
    </defs>
    <path 
      d="M25 15C15 15 10 25 25 35C40 45 60 5 75 15C90 25 85 35 75 35C65 35 45 15 25 15Z" 
      stroke={color} 
      strokeWidth="8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      filter="url(#brush-texture)"
      style={{ opacity: 0.9 }}
    />
    <path 
      d="M25 15.5C18 15.5 13 22 25 32C37 42 63 8 75 18C87 28 82 34.5 75 34.5C68 34.5 37 15.5 25 15.5Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
      style={{ opacity: 0.5 }}
    />
  </svg>
);

function App() {
  const [currentGender, setCurrentGender] = useState<Gender>('MEN');

  return (
    <div className="min-h-screen selection:bg-white/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-10 h-10 bg-blue-600/5 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-blue-500/30 transition-all shadow-lg overflow-hidden">
                <BrushInfinity className="w-12 h-12 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:inline-block">Fashion <span className="font-light text-slate-400">Unlimited</span></span>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <div className="flex items-center gap-8">
              <button 
                onClick={() => setCurrentGender('MEN')}
                className={`text-sm font-black tracking-widest transition-all relative py-1 ${currentGender === 'MEN' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                MEN
                {currentGender === 'MEN' && <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full"></div>}
              </button>
              <button 
                onClick={() => setCurrentGender('WOMEN')}
                className={`text-sm font-black tracking-widest transition-all relative py-1 ${currentGender === 'WOMEN' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                WOMEN
                {currentGender === 'WOMEN' && <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full"></div>}
              </button>
            </div>
            <button className="text-slate-400 hover:text-white transition-colors p-2">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-48 pb-16 px-6">
        <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
          <h1 className="text-7xl md:text-9xl font-black mb-10 tracking-tighter leading-[0.9]">
            Neural <span className="gradient-text">Try-On.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 mb-14 leading-relaxed font-light max-w-3xl">
            See how outfits fit you instantly with AI-powered virtual try-on.
            Realistic draping. Real proportions. Real confidence.
          </p>
          <div className="flex items-center justify-center">
            <button 
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-14 py-5 rounded-full bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-4 hover:scale-105 hover:bg-blue-500 transition-all active:scale-95 shadow-[0_20px_50px_rgba(37,99,235,0.3)] group"
            >
              <Zap className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              Open Studio
            </button>
          </div>
        </div>
      </header>

      <main className="bg-slate-950/20">
        <TryOnDemo genderSelection={currentGender} />
      </main>

      {/* Footer */}
      <footer className="py-24 border-t border-white/5 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
             <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 overflow-hidden">
                <BrushInfinity className="w-14 h-14 text-white" />
              </div>
            <span className="font-bold text-xl">Fashion Unlimited</span>
          </div>
          <p className="text-slate-500 text-sm max-w-xl mx-auto mb-10 leading-relaxed">
            The next generation of digital fashion. High-performance virtual fitting for professional boutiques.
          </p>
          <div className="text-[10px] text-slate-700 uppercase tracking-[0.4em] font-medium">
            © 2025 Fashion Unlimited • Advanced Neural Systems Cluster
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
