import QRCode from 'qrcode';

// Since we can't directly upload to FTP from the browser due to security restrictions,
// we'll use multiple methods for image hosting depending on the environment

export interface UploadResult {
  imageUrl: string;
  qrCodeUrl: string;
  thumbnailUrl?: string; // Add thumbnail URL
}

// Function to dynamically load QRCode library with fallbacks
const loadQRCodeLibrary = async (): Promise<any> => {
  // First check if QRCode is already available (from import)
  if (typeof QRCode !== 'undefined') {
    console.log('QRCode library already available from import');
    return QRCode;
  }
  
  // If not available, try to load it dynamically with fallbacks
  console.log('QRCode library not available from import, trying dynamic loading...');
  
  const cdnUrls = [
    'https://unpkg.com/qrcode@1.5.4/build/qrcode.min.js',
    'https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js',
    'https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js'
  ];
  
  for (const url of cdnUrls) {
    try {
      console.log(`Trying to load QRCode from: ${url}`);
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      
      // Check if QRCode is now available
      if (typeof (window as any).QRCode !== 'undefined') {
        console.log('QRCode library loaded successfully from CDN');
        return (window as any).QRCode;
      }
    } catch (error) {
      console.warn(`Failed to load QRCode from ${url}:`, error);
    }
  }
  
  throw new Error('Failed to load QRCode library from all CDN sources');
};

/**
 * Uploads an image using the PHP API on the same server
 * This works well with Vercel deployments as it doesn't require a separate backend service
 * 
 * @param base64Image The base64 encoded image to upload
 * @param filename The filename to use for the uploaded image
 * @returns Promise resolving to the upload result with image URL and QR code
 */
export const uploadViaPHP = async (base64Image: string, filename: string): Promise<UploadResult> => {
  try {
    console.log('Starting PHP API upload for:', filename);
    console.log('Image data size:', base64Image.length, 'characters');
    
    // Load QRCode library with fallbacks
    const QRCodeLib = await loadQRCodeLibrary();
    
    // Generate QR code for the image URL before uploading
    console.log('Generating QR code...');
    const qrCodeUrl = await QRCodeLib.toDataURL(`https://ebeesnet.com/project/wynn-mif/img/${filename}`, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    console.log('QR code generated successfully');
    console.log('PHP API endpoint:', 'https://ebeesnet.com/project/wynn-mif/upload.php');
    
    // Log the first 100 characters of the image data for debugging (avoid logging too much)
    console.log('Image data (first 100 chars):', base64Image.substring(0, 100));
    
    // Use the PHP API endpoint at the correct location
    console.log('Sending request to PHP API...');
    const response = await fetch('https://ebeesnet.com/project/wynn-mif/upload.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        filename: filename,
        qrCodeImage: qrCodeUrl
      }),
    });
    
    console.log('PHP API response status:', response.status);
    console.log('PHP API response headers:', [...response.headers.entries()]);
    
    // Log response headers for debugging
    for (const [key, value] of response.headers.entries()) {
      console.log(`Response header: ${key} = ${value}`);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('PHP API error response text:', errorText);
      
      // Try to parse as JSON
      try {
        const errorData = JSON.parse(errorText);
        console.error('PHP API error response JSON:', errorData);
        throw new Error(`Failed to upload image via PHP API: ${errorData.error || response.statusText}`);
      } catch (parseError) {
        // If parsing fails, use the raw text
        throw new Error(`Failed to upload image via PHP API: ${response.status} ${response.statusText} - ${errorText}`);
      }
    }
    
    const result = await response.json();
    console.log('PHP API success response:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Upload was not successful');
    }
    
    const imageUrl = result.url;
    const thumbnailUrl = result.thumbnailUrl; // Get thumbnail URL from response
    
    return {
      imageUrl,
      qrCodeUrl, // This is the QR code we generated
      thumbnailUrl // This is the thumbnail URL from the PHP API
    };
  } catch (error) {
    console.error('PHP API upload failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw new Error(`Failed to upload image via PHP API: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Uploads an image to Cloudinary and generates a QR code for the final URL.
 * This is our new primary method for image hosting that works well with Vercel.
 * 
 * @param base64Image The base64 encoded image to upload
 * @param filename The filename to use (will be used as public ID on Cloudinary)
 * @returns Promise resolving to the upload result with image URL and QR code
 */
export const uploadToCloudinary = async (base64Image: string, filename: string): Promise<UploadResult> => {
  try {
    // Load QRCode library with fallbacks
    const QRCodeLib = await loadQRCodeLibrary();
    
    // Extract the base64 data part (remove the data:image/png;base64, prefix)
    const base64Data = base64Image.split(',')[1];
    
    // Create FormData for Cloudinary upload
    const formData = new FormData();
    formData.append('file', `data:image/png;base64,${base64Data}`);
    formData.append('upload_preset', 'ai_changecloth'); // You'll need to create this in your Cloudinary account
    formData.append('public_id', filename.replace('.png', ''));
    
    // Try to upload to Cloudinary
    // Note: This uses a unsigned upload which is less secure but works without backend
    const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name'}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to upload image to Cloudinary: ${errorData.error?.message || response.statusText}`);
    }
    
    const result = await response.json();
    const imageUrl = result.secure_url;
    
    // Generate thumbnail URL (Cloudinary can generate thumbnails on-the-fly)
    const thumbnailUrl = result.secure_url.replace('/upload/', '/upload/c_limit,h_800,w_800/q_auto:low/');
    
    // Generate QR code for the image URL
    const qrCodeUrl = await QRCodeLib.toDataURL(imageUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    return {
      imageUrl,
      qrCodeUrl,
      thumbnailUrl
    };
  } catch (error) {
    throw new Error(`Failed to upload image or generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Primary implementation using FTP via our backend service
 * This is used when a backend URL is configured
 * 
 * @param base64Image The base64 encoded image to upload
 * @param filename The filename to use for the uploaded image
 * @returns Promise resolving to the upload result with image URL and QR code
 */
export const uploadToFTP = async (base64Image: string, filename: string): Promise<UploadResult> => {
  try {
    // Load QRCode library with fallbacks
    const QRCodeLib = await loadQRCodeLibrary();
    
    // Generate QR code for the image URL before uploading
    const qrCodeUrl = await QRCodeLib.toDataURL(`https://ebeesnet.com/project/wynn-mif/img/${filename}`, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    // Use absolute URL for backend API to work in both development and production
    // In production, this should point to your deployed backend server
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001' // Fallback to localhost in dev
      : 'http://localhost:3001';
    
    // Check if we're in production but backend URL is not configured
    if (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_BACKEND_URL) {
      // In production (Vercel), we can't use FTP upload without a backend service
      throw new Error('FTP_UPLOAD_NOT_SUPPORTED_IN_VERCEL_DEPLOYMENT');
    }
    
    // Call our backend service to handle the FTP upload through the proxy
    const response = await fetch(`${backendUrl}/upload`, {
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
      // Check if this is a deployment issue
      if (process.env.NODE_ENV === 'production' && response.status === 500) {
        throw new Error('FTP_UPLOAD_NOT_SUPPORTED_IN_VERCEL_DEPLOYMENT');
      }
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
    // Special handling for Vercel deployment issues
    if (error.message === 'FTP_UPLOAD_NOT_SUPPORTED_IN_VERCEL_DEPLOYMENT') {
      throw new Error('FTP uploads are not supported in this deployment. Please download the image to your device.');
    }
    throw new Error(`Failed to upload image or generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Fallback method that generates a QR code with a helpful message
 * This is used when all other upload methods fail
 * 
 * @param base64Image The base64 encoded image
 * @returns Promise resolving to the upload result with a helpful message and QR code
 */
export const generateQRCodeFromDataUrl = async (base64Image: string): Promise<UploadResult> => {
  try {
    // Load QRCode library with fallbacks
    const QRCodeLib = await loadQRCodeLibrary();
    
    // For the fallback, we'll generate a QR code with a helpful message
    // instead of trying to encode the entire image data
    const message = "Image upload failed. Please try again later or contact support.";
    
    // Generate QR code for the message
    const qrCodeUrl = await QRCodeLib.toDataURL(message, {
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