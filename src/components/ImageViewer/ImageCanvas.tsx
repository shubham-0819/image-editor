import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize, RotateCcw, FlipHorizontal, Crop, Filter, Pencil, Sticker, UploadIcon, ImageIcon, X, RotateCw } from 'lucide-react';
import { ImageItem } from './ImageViewer';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface ImageCanvasProps {
  selectedImage: ImageItem | null;
  onImageUpload?: (files: FileList) => void;
  setSelectedImage: (image: ImageItem | null) => void;
}

interface CropArea {
  startX: number;
  startY: number;
  width: number;
  height: number;
}

type DragHandle = 'top' | 'right' | 'bottom' | 'left' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | null;

export const ImageCanvas = ({ selectedImage, onImageUpload, setSelectedImage }: ImageCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedTool, setSelectedTool] = useState('');
  const [rotation, setRotation] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const [isCropping, setIsCropping] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [activeDragHandle, setActiveDragHandle] = useState<DragHandle>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialCropArea = useRef<CropArea | null>(null);

  const toolGroups = [
    {
      name: 'View',
      tools: [
        { id: 'zoom-in', icon: ZoomIn, label: 'Zoom In' },
        { id: 'zoom-out', icon: ZoomOut, label: 'Zoom Out' },
        { id: 'fit', icon: Maximize, label: 'Fit to Screen' },
      ]
    },
    {
      name: 'Transform',
      tools: [
        { id: 'rotate', icon: RotateCcw, label: 'Rotate' },
        { id: 'flip', icon: FlipHorizontal, label: 'Flip' },
        { id: 'crop', icon: Crop, label: 'Crop' },
      ]
    },
    {
      name: 'Annotate',
      tools: [
        { id: 'annotate', icon: Pencil, label: 'Annotate' },
        { id: 'sticker', icon: Sticker, label: 'Sticker' },
      ]
    }
  ];

  useEffect(() => {
    if (selectedImage) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      setIsFlipped(false);
    }
  }, [selectedImage]);

  const initializeCrop = () => {
    if (!containerRef.current || !imageRef.current || !selectedImage) return;

    const container = containerRef.current.getBoundingClientRect();
    const image = imageRef.current.getBoundingClientRect();

    // Calculate initial crop area (80% of the image size)
    const cropWidth = image.width * 0.8;
    const cropHeight = image.height * 0.8;
    const cropX = image.left - container.left + (image.width - cropWidth) / 2;
    const cropY = image.top - container.top + (image.height - cropHeight) / 2;

    const newCropArea = {
      startX: cropX,
      startY: cropY,
      width: cropWidth,
      height: cropHeight
    };

    setCropArea(newCropArea);
    initialCropArea.current = newCropArea;
  };

  const handleCropStart = () => {
    setIsCropping(true);
    setSelectedTool('crop');
    initializeCrop();
  };

  const handleDragHandleMouseDown = (e: React.MouseEvent, handle: DragHandle) => {
    e.stopPropagation();
    setActiveDragHandle(handle);
  };

  const handleCropDrag = (e: React.MouseEvent) => {
    if (!cropArea || !activeDragHandle || !containerRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const x = e.clientX - container.left;
    const y = e.clientY - container.top;

    const newCropArea = { ...cropArea };

    switch (activeDragHandle) {
      case 'top':
        newCropArea.height = cropArea.height + (cropArea.startY - y);
        newCropArea.startY = y;
        break;
      case 'right':
        newCropArea.width = x - cropArea.startX;
        break;
      case 'bottom':
        newCropArea.height = y - cropArea.startY;
        break;
      case 'left':
        newCropArea.width = cropArea.width + (cropArea.startX - x);
        newCropArea.startX = x;
        break;
      case 'topLeft':
        newCropArea.width = cropArea.width + (cropArea.startX - x);
        newCropArea.height = cropArea.height + (cropArea.startY - y);
        newCropArea.startX = x;
        newCropArea.startY = y;
        break;
      case 'topRight':
        newCropArea.width = x - cropArea.startX;
        newCropArea.height = cropArea.height + (cropArea.startY - y);
        newCropArea.startY = y;
        break;
      case 'bottomLeft':
        newCropArea.width = cropArea.width + (cropArea.startX - x);
        newCropArea.height = y - cropArea.startY;
        newCropArea.startX = x;
        break;
      case 'bottomRight':
        newCropArea.width = x - cropArea.startX;
        newCropArea.height = y - cropArea.startY;
        break;
    }

    // Ensure minimum dimensions
    if (newCropArea.width < 50) newCropArea.width = 50;
    if (newCropArea.height < 50) newCropArea.height = 50;

    setCropArea(newCropArea);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (activeDragHandle) {
      handleCropDrag(e);
    } else if (isPanning && !isCropping) {
      const deltaX = e.clientX - lastPosition.current.x;
      const deltaY = e.clientY - lastPosition.current.y;

      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));

      lastPosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setActiveDragHandle(null);
  };

  const handleCropReset = () => {
    if (initialCropArea.current) {
      setCropArea(initialCropArea.current);
    }
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

  const handleCropConfirm = () => {
    if (!selectedImage || !cropArea || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = selectedImage.url;
    img.onload = () => {
      const actualX = (cropArea.startX - position.x) / scale;
      const actualY = (cropArea.startY - position.y) / scale;
      const actualWidth = cropArea.width / scale;
      const actualHeight = cropArea.height / scale;

      canvas.width = actualWidth;
      canvas.height = actualHeight;

      ctx.drawImage(
        img,
        actualX,
        actualY,
        actualWidth,
        actualHeight,
        0,
        0,
        actualWidth,
        actualHeight
      );

      canvas.toBlob((blob) => {
        if (blob) {
          const newUrl = URL.createObjectURL(blob);
          if (onImageUpload) {
            const file = new File([blob], selectedImage.name, { type: 'image/png' });
            const fileList = new DataTransfer();
            fileList.items.add(file);
            
            // Create a new image object with same ID to maintain selection
            const croppedImage = {
              id: selectedImage.id,
              url: newUrl,
              name: selectedImage.name
            };
            
            // Pass both the file and cropped image data
            onImageUpload(fileList.files);
            
            // Update the selected image with cropped version
            setSelectedImage(croppedImage);
          }
        }
      }, 'image/png');
    };

    setIsCropping(false);
    setCropArea(null);
    setSelectedTool('');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isPanning && !isCropping) {
      setIsPanning(true);
      lastPosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  return (
    <div className="h-full flex relative bg-background rounded-lg">
      <div className="w-16 flex-shrink-0 flex flex-col gap-8 border-r p-2">
        {toolGroups.map((group) => (
          <div key={group.name} className="flex flex-col gap-2">
            
            {group.tools.map((tool) => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedTool === tool.id ? "secondary" : "ghost"}
                    size="icon"
                    className="w-12 h-12"
                    onClick={() => {
                      setSelectedTool(tool.id);
                      switch (tool.id) {
                        case 'zoom-in':
                          setScale(prev => Math.min(prev * 1.2, 5));
                          break;
                        case 'zoom-out':
                          setScale(prev => Math.max(prev * 0.8, 0.1));
                          break;
                        case 'fit':
                          handleFitToScreen();
                          break;
                        case 'rotate':
                          setRotation(prev => (prev + 90) % 360);
                          break;
                        case 'flip':
                          setIsFlipped(prev => !prev);
                          break;
                        case 'crop':
                          handleCropStart();
                          break;
                        case 'finetune':
                          toast.info('Finetune functionality coming soon');
                          break;
                        case 'filter':
                          toast.info('Filter functionality coming soon');
                          break;
                        case 'annotate':
                          toast.info('Annotate functionality coming soon');
                          break;
                        case 'sticker':
                          toast.info('Sticker functionality coming soon');
                          break;
                      }
                    }}
                  >
                    <tool.icon className="h-5 w-5" />
                    <span className="sr-only">{tool.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{tool.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            <div className="h-px bg-border my-2" />
          </div>
        ))}
      </div>

      <div
        ref={containerRef}
        className={`flex-1 relative overflow-hidden bg-center bg-gray-200 transition-colors ${
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
        {selectedImage ? (
          <div
            className="absolute inset-0 flex items-center justify-center transform-gpu transition-transform duration-100"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg) scaleX(${isFlipped ? -1 : 1})`,
              transformOrigin: 'center',
            }}
          >
            <img
              ref={imageRef}
              src={selectedImage.url}
              alt={selectedImage.name}
              className="max-h-full max-w-full object-contain"
              draggable={false}
            />
          </div>
        ) : (
          <div className="absolute bg-gray-100 inset-0 flex flex-col items-center justify-center gap-6 transition-all hover:bg-gray-200">
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-400 flex items-center justify-center animate-pulse">
                <ImageIcon className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-muted-foreground text-lg font-medium">No image selected</p>
              <p className="text-sm text-gray-500">Drag and drop images here or click to upload</p>
            </div>
            
            <Button 
              variant="outline"
              className="group relative overflow-hidden transition-all hover:border-primary"
              asChild
            >
              <label className="cursor-pointer flex items-center gap-2">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => e.target.files && onImageUpload?.(e.target.files)}
                  multiple
                />
                <UploadIcon className="w-4 h-4 transition-transform group-hover:-translate-y-1 group-hover:scale-110" />
                <span>Upload Images</span>
              </label>
            </Button>
          </div>
        )}
        {isCropping && cropArea && (
          <>
            <div
              className="absolute inset-0 bg-black/50"
              style={{
                clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, 
                  ${cropArea.startX}px ${cropArea.startY}px, 
                  ${cropArea.startX}px ${cropArea.startY + cropArea.height}px, 
                  ${cropArea.startX + cropArea.width}px ${cropArea.startY + cropArea.height}px, 
                  ${cropArea.startX + cropArea.width}px ${cropArea.startY}px, 
                  ${cropArea.startX}px ${cropArea.startY}px)`
              }}
            />
            <div
              className="absolute border-2 border-primary"
              style={{
                left: cropArea.startX,
                top: cropArea.startY,
                width: cropArea.width,
                height: cropArea.height,
              }}
            >
              {/* Crop handles */}
              <div
                className="absolute w-2 h-2 bg-primary border border-white -left-1 -top-1 cursor-nw-resize"
                onMouseDown={(e) => handleDragHandleMouseDown(e, 'topLeft')}
              />
              <div
                className="absolute w-2 h-2 bg-primary border border-white left-1/2 -top-1 -translate-x-1/2 cursor-n-resize"
                onMouseDown={(e) => handleDragHandleMouseDown(e, 'top')}
              />
              <div
                className="absolute w-2 h-2 bg-primary border border-white -right-1 -top-1 cursor-ne-resize"
                onMouseDown={(e) => handleDragHandleMouseDown(e, 'topRight')}
              />
              <div
                className="absolute w-2 h-2 bg-primary border border-white -right-1 top-1/2 -translate-y-1/2 cursor-e-resize"
                onMouseDown={(e) => handleDragHandleMouseDown(e, 'right')}
              />
              <div
                className="absolute w-2 h-2 bg-primary border border-white -right-1 -bottom-1 cursor-se-resize"
                onMouseDown={(e) => handleDragHandleMouseDown(e, 'bottomRight')}
              />
              <div
                className="absolute w-2 h-2 bg-primary border border-white left-1/2 -bottom-1 -translate-x-1/2 cursor-s-resize"
                onMouseDown={(e) => handleDragHandleMouseDown(e, 'bottom')}
              />
              <div
                className="absolute w-2 h-2 bg-primary border border-white -left-1 -bottom-1 cursor-sw-resize"
                onMouseDown={(e) => handleDragHandleMouseDown(e, 'bottomLeft')}
              />
              <div
                className="absolute w-2 h-2 bg-primary border border-white -left-1 top-1/2 -translate-y-1/2 cursor-w-resize"
                onMouseDown={(e) => handleDragHandleMouseDown(e, 'left')}
              />
            </div>
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCropReset}
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsCropping(false);
                  setCropArea(null);
                  setSelectedTool('');
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleCropConfirm}
              >
                Done
              </Button>
            </div>
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
