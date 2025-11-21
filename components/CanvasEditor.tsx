
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DrawPath, Point } from '../types';
import { Undo, Eraser, MousePointer2 } from 'lucide-react';

interface CanvasEditorProps {
  imageSrc: string;
  brushSize: number;
  onExportImageForAI: (base64: string) => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  imageSrc,
  brushSize,
  onExportImageForAI,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  // Load and measure image. Reset paths when imageSrc changes (e.g. Continue Editing).
  useEffect(() => {
    setPaths([]);
    setCurrentPath([]);
    
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const maxWidth = Math.min(window.innerWidth - 32, 800); 
      const maxHeight = 600; 
      
      let w = img.width;
      let h = img.height;
      
      const scaleW = maxWidth / w;
      const scaleH = maxHeight / h;
      const scaleFactor = Math.min(scaleW, scaleH, 1); 
      
      setImageDimensions({ width: w, height: h });
      setScale(scaleFactor);
    };
  }, [imageSrc]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  };

  // Handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); 
    const coords = getCoordinates(e);
    if (coords) {
      setIsDrawing(true);
      setCurrentPath([coords]);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    // Update cursor position for brush preview
    if (!('touches' in e)) {
       const rect = canvasRef.current?.getBoundingClientRect();
       if (rect) {
         setCursorPos({
            x: (e as React.MouseEvent).clientX - rect.left,
            y: (e as React.MouseEvent).clientY - rect.top
         });
       }
    }

    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    if (coords) {
      setCurrentPath((prev) => [...prev, coords]);
    }
  };

  const stopDrawing = () => {
    if (isDrawing && currentPath.length > 0) {
      setPaths((prev) => [...prev, { points: currentPath, brushSize: brushSize }]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
      setIsHovering(false);
      stopDrawing();
  };

  const handleUndo = () => setPaths((prev) => prev.slice(0, -1));
  const handleClear = () => setPaths([]);

  // Render Canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = imageDimensions.width;
    canvas.height = imageDimensions.height;

    const img = new Image();
    img.src = imageSrc;
    
    if (img.complete) {
      ctx.drawImage(img, 0, 0, imageDimensions.width, imageDimensions.height);
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw existing paths
    paths.forEach(path => {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Transparent Red
      ctx.lineWidth = path.brushSize;
      if (path.points.length > 0) {
        ctx.moveTo(path.points[0].x, path.points[0].y);
        path.points.forEach(p => ctx.lineTo(p.x, p.y));
      }
      ctx.stroke();
    });

    // Draw active path
    if (currentPath.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = brushSize;
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      currentPath.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }

  }, [imageSrc, paths, currentPath, imageDimensions, brushSize]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Export Logic
  useEffect(() => {
    const generateMaskedImage = () => {
      const canvas = document.createElement('canvas');
      canvas.width = imageDimensions.width;
      canvas.height = imageDimensions.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      const img = new Image();
      img.src = imageSrc;
      ctx.drawImage(img, 0, 0, imageDimensions.width, imageDimensions.height);

      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      paths.forEach(path => {
        ctx.beginPath();
        ctx.lineWidth = path.brushSize;
        if (path.points.length > 0) {
          ctx.moveTo(path.points[0].x, path.points[0].y);
          path.points.forEach(p => ctx.lineTo(p.x, p.y));
        }
        ctx.stroke();
      });

      ctx.globalCompositeOperation = 'source-over';
      return canvas.toDataURL('image/png');
    };
    
    if (imageDimensions.width > 0) {
        onExportImageForAI(generateMaskedImage());
    }
  }, [paths, imageSrc, imageDimensions, onExportImageForAI]);

  return (
    <div className="flex flex-col items-center w-full">
      
      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-4 bg-gray-800/80 backdrop-blur-sm p-2 rounded-xl border border-gray-700 z-10">
        <div className="flex items-center gap-2 border-r border-gray-600 pr-4">
          <MousePointer2 className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-300 uppercase">Masking</span>
        </div>

        <button 
            onClick={handleUndo} 
            disabled={paths.length === 0}
            className="p-2 hover:bg-gray-700 rounded-lg disabled:opacity-30 text-white transition-colors"
            title="Undo last stroke"
        >
            <Undo className="w-5 h-5" />
        </button>

        <button 
            onClick={handleClear} 
            disabled={paths.length === 0}
            className="p-2 hover:bg-red-900/30 text-red-400 rounded-lg disabled:opacity-30 transition-colors"
            title="Clear all masks"
        >
            <Eraser className="w-5 h-5" />
        </button>
      </div>

      {/* Canvas Wrapper */}
      <div 
        ref={containerRef}
        className="relative shadow-2xl shadow-black/50 rounded-lg overflow-hidden bg-[url('https://bg.siteorigin.com/blog/wp-content/uploads/2015/06/p6.png')] bg-repeat cursor-none"
        style={{ 
            width: imageDimensions.width * scale, 
            height: imageDimensions.height * scale,
            maxWidth: '100%',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="absolute top-0 left-0 touch-none"
            style={{ width: '100%', height: '100%' }}
        />
        
        {/* Brush Cursor */}
        {isHovering && cursorPos && (
          <div 
            className="pointer-events-none absolute rounded-full border-2 border-white shadow-sm bg-red-500/30 transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: cursorPos.x,
              top: cursorPos.y,
              width: brushSize * scale,
              height: brushSize * scale,
            }}
          />
        )}
      </div>
    </div>
  );
};
