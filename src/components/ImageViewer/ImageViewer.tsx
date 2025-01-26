import React, { useState } from 'react';
import { ImageSidebar } from './ImageSidebar';
import { ImageCanvas } from './ImageCanvas';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PanelRight } from 'lucide-react';

export interface ImageItem {
  id: string;
  url: string;
  name: string;
}

export const ImageViewer = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const processFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: ImageItem = {
          id: Math.random().toString(36).substr(2, 9),
          url: e.target?.result as string,
          name: file.name
        };
        setImages(prev => [...prev, newImage]);
        toast.success('Image uploaded successfully!');
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    processFiles(files);
  };

  const handleImageDelete = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    if (selectedImage?.id === imageId) {
      setSelectedImage(null);
    }
    toast.success('Image deleted successfully!');
  };

  const handleImageSelect = (image: ImageItem) => {
    setSelectedImage(image);
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      <main className="flex-1 p-6 relative">
        <Button 
          variant="outline" 
          size="icon" 
          className="absolute right-4 top-4 z-50"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <PanelRight className="h-4 w-4" />
        </Button>
        <ImageCanvas selectedImage={selectedImage} onImageUpload={processFiles} />
      </main>
      {isSidebarOpen && (
        <ImageSidebar
          images={images}
          onUpload={handleImageUpload}
          onDelete={handleImageDelete}
          onSelect={handleImageSelect}
          selectedImage={selectedImage}
        />
      )}
    </div>
  );
};