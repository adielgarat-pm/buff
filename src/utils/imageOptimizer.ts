/**
 * Client-side image optimization utility
 * Resizes and compresses images before OCR upload to reduce processing time
 */

const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.8;

interface OptimizedImage {
  base64: string;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
}

/**
 * Resize and compress an image file using Canvas API
 * @param file - The original image file
 * @returns Promise with optimized base64 data and metadata
 */
export async function optimizeImage(file: File): Promise<OptimizedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate new dimensions maintaining aspect ratio
          let { width, height } = img;
          const originalSize = file.size;
          
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            } else {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }
          
          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw the image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to JPEG with compression
          const base64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
          
          // Extract just the base64 data (remove data:image/jpeg;base64, prefix)
          const base64Data = base64.split(',')[1];
          
          // Calculate optimized size (approximate)
          const optimizedSize = Math.round((base64Data.length * 3) / 4);
          
          console.log(`[Image Optimizer] Resized from ${img.naturalWidth}x${img.naturalHeight} to ${width}x${height}`);
          console.log(`[Image Optimizer] Size reduced from ${(originalSize / 1024).toFixed(1)}KB to ${(optimizedSize / 1024).toFixed(1)}KB (${Math.round((1 - optimizedSize / originalSize) * 100)}% reduction)`);
          
          resolve({
            base64: base64Data,
            originalSize,
            optimizedSize,
            width,
            height,
          });
        } catch (err) {
          reject(err);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for optimization'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}
