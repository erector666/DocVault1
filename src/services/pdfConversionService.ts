import { supabase } from './supabase';

export interface PDFConversionResult {
  success: boolean;
  pdfUrl?: string;
  error?: string;
}

export class PDFConversionService {
  /**
   * Convert an image to PDF using canvas and jsPDF
   */
  static async convertImageToPDF(
    imageUrl: string,
    fileName: string,
    userId: string
  ): Promise<PDFConversionResult> {
    try {
      // Check if jsPDF is available
      if (typeof window === 'undefined') {
        throw new Error('PDF conversion only available in browser');
      }

      // Dynamically import jsPDF to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;
      
      // Create a canvas to load the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Load the image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        img.onload = async () => {
          try {
            // Set canvas dimensions to match image
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw image on canvas
            ctx.drawImage(img, 0, 0);
            
            // Convert canvas to blob
            canvas.toBlob(async (blob) => {
              if (!blob) {
                reject(new Error('Failed to convert image to blob'));
                return;
              }

              try {
                // Convert blob to PDF
                const pdf = new jsPDF({
                  orientation: img.width > img.height ? 'landscape' : 'portrait',
                  unit: 'mm',
                  format: 'a4'
                });

                // Calculate dimensions to fit image on page
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                
                const imgWidth = img.width;
                const imgHeight = img.height;
                
                // Calculate scaling to fit image on page
                const scaleX = pageWidth / imgWidth;
                const scaleY = pageHeight / imgHeight;
                const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
                
                const scaledWidth = imgWidth * scale;
                const scaledHeight = imgHeight * scale;
                
                // Center image on page
                const x = (pageWidth - scaledWidth) / 2;
                const y = (pageHeight - scaledHeight) / 2;

                // Add image to PDF
                const imgData = canvas.toDataURL('image/jpeg', 0.8);
                pdf.addImage(imgData, 'JPEG', x, y, scaledWidth, scaledHeight);

                // Generate PDF blob
                const pdfBlob = pdf.output('blob');
                
                // Upload PDF to Supabase storage
                const pdfFileName = fileName.replace(/\.[^/.]+$/, '.pdf');
                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from('documents')
                  .upload(`${userId}/${Date.now()}_${pdfFileName}`, pdfBlob, {
                    contentType: 'application/pdf',
                    cacheControl: '3600'
                  });

                if (uploadError) {
                  throw new Error(`Upload failed: ${uploadError.message}`);
                }

                // Get public URL
                const { data: urlData } = supabase.storage
                  .from('documents')
                  .getPublicUrl(uploadData.path);

                resolve({
                  success: true,
                  pdfUrl: urlData.publicUrl
                });

              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                reject(new Error(`PDF conversion failed: ${errorMessage}`));
              }
            }, 'image/jpeg', 0.8);

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            reject(new Error(`Image processing failed: ${errorMessage}`));
          }
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.src = imageUrl;
      });

    } catch (error) {
      console.error('PDF conversion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Convert multiple images to a single PDF
   */
  static async convertImagesToPDF(
    imageUrls: string[],
    fileName: string,
    userId: string
  ): Promise<PDFConversionResult> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('PDF conversion only available in browser');
      }

      const jsPDF = (await import('jspdf')).default;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        
        // Load image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            try {
              // Create canvas for this image
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
              }

              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);

              // Calculate scaling
              const imgWidth = img.width;
              const imgHeight = img.height;
              
              const scaleX = pageWidth / imgWidth;
              const scaleY = pageHeight / imgHeight;
              const scale = Math.min(scaleX, scaleY, 1);
              
              const scaledWidth = imgWidth * scale;
              const scaledHeight = imgHeight * scale;
              
              // Center image
              const x = (pageWidth - scaledWidth) / 2;
              const y = (pageHeight - scaledHeight) / 2;

              // Add image to PDF
              const imgData = canvas.toDataURL('image/jpeg', 0.8);
              pdf.addImage(imgData, 'JPEG', x, y, scaledWidth, scaledHeight);

              // Add new page if not the last image
              if (i < imageUrls.length - 1) {
                pdf.addPage();
              }

              resolve();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              reject(new Error(`Failed to process image ${i + 1}: ${errorMessage}`));
            }
          };

          img.onerror = () => {
            reject(new Error(`Failed to load image ${i + 1}`));
          };

          img.src = imageUrl;
        });
      }

      // Generate PDF blob
      const pdfBlob = pdf.output('blob');
      
      // Upload PDF
      const pdfFileName = fileName.replace(/\.[^/.]+$/, '.pdf');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`${userId}/${Date.now()}_${pdfFileName}`, pdfBlob, {
          contentType: 'application/pdf',
          cacheControl: '3600'
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(uploadData.path);

      return {
        success: true,
        pdfUrl: urlData.publicUrl
      };

    } catch (error) {
      console.error('Multi-image PDF conversion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
