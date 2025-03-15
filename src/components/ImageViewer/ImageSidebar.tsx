import { Button } from "@/components/ui/button";
import { Upload, Trash2 } from "lucide-react";
import { ImageItem } from "./ImageViewer";
import { cn } from "@/lib/utils";

interface ImageSidebarProps {
  images: ImageItem[];
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: (imageId: string) => void;
  onSelect: (image: ImageItem) => void;
  selectedImage: ImageItem | null;
}

export const ImageSidebar = ({
  images,
  onUpload,
  onDelete,
  onSelect,
  selectedImage,
}: ImageSidebarProps) => {
  return (
    <aside className="w-72 border-l bg-background p-4 flex flex-col gap-4 relative">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search images..."
            className="w-full px-3 py-2 rounded-md border bg-background"
            onChange={(e) => {
              const searchTerm = e.target.value.toLowerCase();
              const filteredImages = images.filter(image => 
                image.name.toLowerCase().includes(searchTerm)
              );
              // You'll need to add state management for filtered images
            }}
          />
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="grid gap-2">
            {images.map((image) => (
              <div
                key={image.id}
                className={cn(
                  "rounded-md flex items-center gap-2 group cursor-pointer border border-gray-200 hover:bg-accent transition-colors",
                  selectedImage?.id === image.id && "bg-accent ring-2 ring-primary ring-offset-2"
                )}
                onClick={() => onSelect(image)}
              >
                <div className="w-12 h-12 p-1 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate max-w-[120px]" title={image.name}>
                    {image.name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(image.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4">
        <Button 
          size="lg"
          className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
          asChild
        >
          <label className="cursor-pointer flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={onUpload}
              multiple
            />
            Upload
          </label>
        </Button>
      </div>
    </aside>
  );
};