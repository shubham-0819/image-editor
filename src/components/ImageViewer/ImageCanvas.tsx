import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize, RotateCcw, FlipHorizontal, Crop, Filter, Pencil, Sticker } from 'lucide-react';
import { ImageItem } from './ImageViewer';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface ImageCanvasProps {
  selectedImage: ImageItem | null;
  onImageUpload?: (files: FileList) => void;
}

export const ImageCanvas = ({ selectedImage, onImageUpload }: ImageCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedTool, setSelectedTool] = useState('');
  const [rotation, setRotation] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const lastPosition = useRef({ x: 0, y: 0 });

  const tools = [
    { id: 'crop', icon: Crop, label: 'Crop' },
    { id: 'finetune', icon: RotateCcw, label: 'Finetune' },
    { id: 'filter', icon: Filter, label: 'Filter' },
    { id: 'annotate', icon: Pencil, label: 'Annotate' },
    { id: 'sticker', icon: Sticker, label: 'Sticker' }
  ];

  useEffect(() => {
    if (selectedImage) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      setIsFlipped(false);
    }
  }, [selectedImage]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;

    const deltaX = e.clientX - lastPosition.current.x;
    const deltaY = e.clientY - lastPosition.current.y;

    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));

    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleRotateLeft = () => {
    setRotation(prev => (prev - 90) % 360);
  };

  const handleFlipHorizontal = () => {
    setIsFlipped(prev => !prev);
  };

  const handleFitToScreen = () => {
    if (!containerRef.current || !selectedImage) return;

    const img = new Image();
    img.src = selectedImage.url;
    img.onload = () => {
      const containerWidth = containerRef.current!.clientWidth;
      const containerHeight = containerRef.current!.clientHeight;
      const scaleX = containerWidth / img.width;
      const scaleY = containerHeight / img.height;
      const newScale = Math.min(scaleX, scaleY) * 0.9;
      
      setScale(newScale);
      setPosition({ x: 0, y: 0 });
    };
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const validFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/')
      );

      if (validFiles.length === 0) {
        toast.error('Please drop image files only');
        return;
      }

      onImageUpload?.(files);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 relative bg-background rounded-lg p-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleFitToScreen}>
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRotateLeft}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Rotate left
          </Button>
          <Button variant="outline" onClick={handleFlipHorizontal}>
            <FlipHorizontal className="h-4 w-4 mr-2" />
            Flip horizontal
          </Button>
        </div>
      </div>

      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-lg border">
        {tools.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                variant={selectedTool === tool.id ? "secondary" : "ghost"}
                size="icon"
                className="w-12 h-12 rounded-lg"
                onClick={() => setSelectedTool(tool.id)}
              >
                <tool.icon className="h-5 w-5" />
                <span className="sr-only">{tool.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{tool.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div
        ref={containerRef}
        className={`flex-1 relative overflow-hidden bg-[url('/placeholder.svg')] bg-center bg-repeat rounded-lg transition-colors ${
          isDragging ? 'bg-blue-50 border-2 border-dashed border-blue-500' : ''
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 pointer-events-none">
            <p className="text-blue-500 text-lg font-medium">Drop images here</p>
          </div>
        )}
        {selectedImage && (
          <div
            className="absolute transform-gpu transition-transform duration-100"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg) scaleX(${isFlipped ? -1 : 1})`,
              transformOrigin: 'center',
            }}
          >
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              className="max-w-none"
              draggable={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};
