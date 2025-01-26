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
    <aside className="w-64 border-l bg-background p-4 flex flex-col gap-4">
      <div className="flex justify-center">
        <Button className="w-full" asChild>
          <label className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            Upload Image
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={onUpload}
              multiple
            />
          </label>
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid gap-2">
          {images.map((image) => (
            <div
              key={image.id}
              className={cn(
                "p-2 rounded-md flex items-center gap-2 group cursor-pointer hover:bg-accent transition-colors",
                selectedImage?.id === image.id && "bg-accent"
              )}
              onClick={() => onSelect(image)}
            >
              <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{image.name}</p>
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
    </aside>
  );
};