import { useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string) => void;
  onRemove: () => void;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function ImageUpload({ value, onChange, onRemove }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, { upsert: true });

    if (error) {
      toast.error("Gagal upload: " + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    onChange(urlData.publicUrl);
    setUploading(false);
    toast.success("Gambar berhasil diupload");
  }, [onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  if (value) {
    return (
      <div className="relative inline-block group">
        <img
          src={value}
          alt="Preview"
          className="h-28 w-28 rounded-lg border border-border object-cover shadow-sm"
        />
        <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-background/70 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm"
            title="Ganti gambar"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
            title="Hapus gambar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "flex h-28 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/20 hover:border-accent hover:bg-accent/5",
          uploading && "pointer-events-none"
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-xs">Mengupload...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <Upload className="h-6 w-6" />
            <span className="text-xs font-medium">Klik atau drag gambar</span>
            <span className="text-[10px]">JPG, PNG, WebP · Max 5MB</span>
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
