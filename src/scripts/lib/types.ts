// Basic types for local image processing workflow
export interface ImageSize {
  width: number;
  height: number;
}

export interface ImageReference {
  filePath: string;
  imageName: string;
  altText: string;
  className?: string;
}