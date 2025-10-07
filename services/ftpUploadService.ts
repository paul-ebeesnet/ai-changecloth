import QRCode from 'qrcode';

// Since we can't directly upload to FTP from the browser due to security restrictions,
// we'll use our backend service as the primary method for image hosting

export interface UploadResult {
  imageUrl: string;
  qrCodeUrl: string;
  thumbnailUrl?: string; // Add thumbnail URL
}

/**
 * Primary implementation using FTP via our backend service
 * 
 * @param base64Image The base64 encoded image to upload
 * @param filename The filename to use for the uploaded image
 * @returns Promise resolving to the upload result with image URL and QR code
 */
export const uploadToFTP = async (base64Image: string, filename: string): Promise<UploadResult> => {
  try {
    // Generate QR code for the image URL before uploading
    const qrCodeUrl = await QRCode.toDataURL(`https://ebeesnet.com/project/wynn-mif/img/${filename}`, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    // Call our backend service to handle the FTP upload through the proxy
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        filename: filename,
        qrCodeImage: qrCodeUrl // Send the QR code image to the backend
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to upload image to server: ${errorData.error || response.statusText}`);
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Upload was not successful');
    }
    
    const imageUrl = result.url;
    const thumbnailUrl = result.thumbnailUrl; // Get thumbnail URL from response
    
    // Return the same QR code we generated (since it's now also uploaded to FTP)
    return {
      imageUrl,
      qrCodeUrl, // This is the QR code that was also uploaded to FTP
      thumbnailUrl // This is the thumbnail URL
    };
  } catch (error) {
    throw new Error(`Failed to upload image or generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Fallback method that generates a QR code with a helpful message
 * This is used when FTP upload fails
 * 
 * @param base64Image The base64 encoded image
 * @returns Promise resolving to the upload result with a helpful message and QR code
 */
export const generateQRCodeFromDataUrl = async (base64Image: string): Promise<UploadResult> => {
  try {
    // For the fallback, we'll generate a QR code with a helpful message
    // instead of trying to encode the entire image data
    const message = "Image upload failed. Please try again later or contact support.";
    
    // Generate QR code for the message
    const qrCodeUrl = await QRCode.toDataURL(message, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    // Return a data URL that explains the issue
    const imageUrl = "data:text/plain;base64," + btoa(message);
    
    return {
      imageUrl,
      qrCodeUrl
    };
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};