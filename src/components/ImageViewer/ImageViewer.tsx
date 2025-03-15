import React, { useState } from 'react';
import { ImageSidebar } from './ImageSidebar';
import { ImageCanvas } from './ImageCanvas';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PanelRight, Github, Download } from 'lucide-react';

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
    Array.from(files).forEach((file, index) => {
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
        setImages(prev => {
          const updatedImages = [...prev, newImage];
          // Select first image if no image is currently selected
          if (index === 0 && !selectedImage) {
            setSelectedImage(newImage);
          }
          return updatedImages;
        });
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
    setImages(prev => {
      const updatedImages = prev.filter(img => img.id !== imageId);
      if (selectedImage?.id === imageId) {
        // Select the first remaining image after deletion
        setSelectedImage(updatedImages.length > 0 ? updatedImages[0] : null);
      }
      return updatedImages;
    });
    toast.success('Image deleted successfully!');
  };

  const handleImageSelect = (image: ImageItem) => {
    setSelectedImage(image);
  };

  const handleDownload = async () => {
    if (!selectedImage) {
      toast.error('No image selected to download');
      return;
    }

    try {
      // For data URLs
      if (selectedImage.url.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = selectedImage.url;
        link.download = selectedImage.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For regular URLs
        const response = await fetch(selectedImage.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = selectedImage.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      toast.success('Image downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download image');
      console.error('Download error:', error);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground relative">
      <main className="flex-1 relative">
        <div className="absolute right-4 top-4 z-50 flex gap-2">
          {selectedImage && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleDownload}
              title="Download Image"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <PanelRight className="h-4 w-4" />
          </Button>
        </div>
        <ImageCanvas 
          selectedImage={selectedImage} 
          onImageUpload={processFiles}
          setSelectedImage={setSelectedImage}
        />
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
      <footer className="absolute bottom-0 left-20 py-2 px-4 bg-background/80 backdrop-blur-sm border-t z-50">
        <a 
          href="https://github.com/shubham-0819" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Github className="h-4 w-4" />
          <span>shubham-0819</span>
        </a>
      </footer>
    </div>
  );
};