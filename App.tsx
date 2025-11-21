
import React, { useState, useRef } from 'react';
import { Upload, Download, Wand2, AlertCircle, CheckCircle2, Minus, Plus, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from './components/Button';
import { CanvasEditor } from './components/CanvasEditor';
import { Spinner } from './components/Spinner';
import { generateFill } from './services/geminiService';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [maskedImageBase64, setMaskedImageBase64] = useState<string | null>(null);
  
  const [prompt, setPrompt] = useState('');
  const [brushSize, setBrushSize] = useState<number>(40);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setOriginalImage(event.target.result);
        setGeneratedImage(null);
        setMaskedImageBase64(null);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    if (!originalImage || !maskedImageBase64) {
      setError("Please upload an image and paint a mask over the area to change.");
      return;
    }
    if (!prompt.trim()) {
      setError("Please describe what you want to add in the prompt box.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateFill(maskedImageBase64, prompt);
      setGeneratedImage(result);
    } catch (err: any) {
      setError(err.message || "Something went wrong during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'donky-generated-fill.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetApp = () => {
    setOriginalImage(null);
    setGeneratedImage(null);
    setMaskedImageBase64(null);
    setPrompt('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleContinueEditing = () => {
    if (generatedImage) {
      setOriginalImage(generatedImage);
      setGeneratedImage(null);
      setMaskedImageBase64(null); // CanvasEditor will re-init
      setPrompt(''); // Optional: clear prompt for new action
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const adjustBrushSize = (delta: number) => {
    setBrushSize(prev => Math.max(5, Math.min(150, prev + delta)));
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col font-sans text-gray-200">
      
      {/* Header */}
      <header className="w-full border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Donky Generative Fill
            </h1>
          </div>
          {originalImage && (
             <Button variant="ghost" onClick={resetApp} className="text-xs" icon={<RefreshCw className="w-3 h-3"/>}>
               Start Over
             </Button>
          )}
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center p-4 md:p-8 max-w-5xl mx-auto w-full gap-8">

        {/* ERROR BANNER */}
        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3 text-red-200 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto hover:text-white">✕</button>
          </div>
        )}

        {/* STATE: NO IMAGE UPLOADED */}
        {!originalImage && (
          <div className="flex flex-col items-center justify-center flex-grow w-full min-h-[400px] border-2 border-dashed border-gray-800 rounded-3xl bg-gray-900/30 hover:bg-gray-900/50 hover:border-indigo-500/50 transition-all group cursor-pointer" onClick={triggerFileInput}>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/png, image/jpeg, image/webp" 
              className="hidden" 
            />
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-black">
              <Upload className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Upload an Image</h2>
            <p className="text-gray-400 text-center max-w-md">
              Drag and drop or click to upload. Supported formats: JPG, PNG, WEBP.
            </p>
          </div>
        )}

        {/* STATE: IMAGE UPLOADED & EDITING */}
        {originalImage && !generatedImage && !isGenerating && (
          <div className="w-full flex flex-col gap-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
            
            {/* EDITOR WORKSPACE */}
            <div className="flex flex-col items-center justify-center bg-gray-900/50 p-6 rounded-3xl border border-gray-800">
              <CanvasEditor 
                imageSrc={originalImage}
                brushSize={brushSize}
                onExportImageForAI={setMaskedImageBase64}
              />
            </div>

            {/* CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full bg-gray-900 p-6 rounded-2xl border border-gray-800">
              
              {/* Left: Brush Config */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Brush Size</label>
                <div className="flex items-center gap-4 bg-gray-800 p-3 rounded-xl">
                  <button 
                    onClick={() => adjustBrushSize(-5)}
                    className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  
                  <div className="flex-grow flex flex-col gap-1">
                      <input 
                        type="range" 
                        min="5" 
                        max="150" 
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className="text-center text-xs text-gray-500 font-mono">{brushSize}px</div>
                  </div>

                  <button 
                    onClick={() => adjustBrushSize(5)}
                    className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Right: Prompt & Action */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">What to generate</label>
                <div className="flex flex-col gap-4">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to add in the painted area..."
                    className="w-full bg-gray-800 border-gray-700 rounded-xl p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-24"
                  />
                  <Button 
                    onClick={handleGenerate} 
                    className="w-full py-4 text-lg shadow-indigo-500/25"
                    icon={<Wand2 className="w-5 h-5" />}
                  >
                    Generate Fill
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STATE: GENERATING */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center h-[50vh] w-full">
            <Spinner />
          </div>
        )}

        {/* STATE: RESULT */}
        {generatedImage && (
           <div className="w-full flex flex-col gap-8 animate-in zoom-in-95 duration-500">
              <div className="bg-gray-900/50 p-1 rounded-3xl border border-indigo-500/30 relative overflow-hidden group">
                <img 
                  src={generatedImage} 
                  alt="Generated result" 
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium border border-white/10 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-400" /> Generated
                </div>
              </div>

              <div className="flex flex-col gap-6 p-6 bg-gray-900 rounded-2xl border border-gray-800">
                <div className="text-gray-400 text-sm border-b border-gray-800 pb-4">
                   <span className="font-semibold text-gray-300">Prompt used:</span> "{prompt}"
                </div>
                
                <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
                    <div className="flex gap-3 w-full md:w-auto">
                         <Button variant="secondary" onClick={resetApp} icon={<ArrowLeft className="w-4 h-4"/>}>
                            Start Over
                        </Button>
                        <Button variant="primary" onClick={handleContinueEditing} icon={<Wand2 className="w-4 h-4"/>}>
                            Continue Editing
                        </Button>
                    </div>
                    <Button onClick={handleDownload} icon={<Download className="w-4 h-4" />} className="w-full md:w-auto bg-green-600 hover:bg-green-500 focus:ring-green-500 shadow-green-500/20">
                        Download
                    </Button>
                </div>
              </div>
           </div>
        )}

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-800 text-center text-gray-600 text-sm">
        <p>&copy; {new Date().getFullYear()} Donky AI. Powered by Gemini 2.5 Flash.</p>
      </footer>
    </div>
  );
};

export default App;
