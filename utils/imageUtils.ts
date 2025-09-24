
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const base64ToImageData = (base64String: string): { mimeType: string; data: string } => {
  const [header, data] = base64String.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
  return { mimeType, data };
};

export const base64ToBlob = (base64: string): Blob => {
    const [header, data] = base64.split(',');
    const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(data);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

/**
 * Takes a base64 image string, loads it onto a canvas, and makes all white (or near-white) pixels transparent.
 * @param base64Image The source image with a white background.
 * @param tolerance A value from 0-255 to account for off-white colors. Higher is more aggressive.
 * @returns A new base64 encoded PNG image with a transparent background.
 */
export const removeWhiteBackground = (base64Image: string, tolerance: number = 30): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return reject(new Error('Could not get canvas context'));

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const r_target = 255;
      const g_target = 255;
      const b_target = 255;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const distance = Math.sqrt(
          Math.pow(r - r_target, 2) +
          Math.pow(g - g_target, 2) +
          Math.pow(b - b_target, 2)
        );

        if (distance <= tolerance) {
          data[i + 3] = 0; // Set alpha to 0 for transparent
        }
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image for background removal.'));
    img.src = base64Image;
  });
};

/**
 * Takes a base64 image string and makes green pixels transparent using a robust chroma keying algorithm.
 * This is effective against gradients and variations in green, unlike simple color matching.
 * @param base64Image The source image with a green screen background.
 * @returns A new base64 encoded PNG image with a transparent background.
 */
export const removeGreenBackground = (base64Image: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return reject(new Error('Could not get canvas context'));

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Advanced chroma keying: if the green component is dominant over red and blue,
        // and has a reasonable brightness, consider it part of the background.
        // This is more robust against gradients than checking distance from a single pure color.
        if (g > 70 && g > r * 1.1 && g > b * 1.1) {
          data[i + 3] = 0; // Set alpha to 0 for transparent
        }
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image for background removal.'));
    img.src = base64Image;
  });
};


/**
 * Composites a character image (with transparent background) onto a background image.
 * The final canvas will have the dimensions of the background.
 * The character will be scaled to fit within the specified vertical bounds (380px from top, 200px from bottom).
 * The character will also be constrained to fit within the horizontal bounds of the background.
 * @param backgroundSrc URL or base64 string for the background image.
 * @param characterSrc URL or base64 string for the character image.
 * @returns A new base64 encoded image of the composite.
 */
export const compositeWithBackground = async (backgroundSrc: string, characterSrc: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const backgroundImage = new Image();
    backgroundImage.crossOrigin = 'Anonymous';
    backgroundImage.onload = () => {
      const characterImage = new Image();
      characterImage.crossOrigin = 'Anonymous';
      characterImage.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = backgroundImage.width;
        canvas.height = backgroundImage.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not get canvas context'));

        // 1. Draw background to fill the canvas
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        // 2. Calculate the available vertical space for the character
        // From 380px from the top to 200px from the bottom
        const topMargin = 380;
        const bottomMargin = 200;
        const availableHeight = canvas.height - topMargin - bottomMargin;
        
        // 3. Calculate the available horizontal space (full width)
        const availableWidth = canvas.width;

        // 4. Calculate scale factor to fit the character within the available height
        let scaleFactor = availableHeight / characterImage.height;
        
        // 5. Calculate the scaled dimensions
        let scaledCharWidth = characterImage.width * scaleFactor;
        let scaledCharHeight = characterImage.height * scaleFactor;
        
        // 6. If the scaled width exceeds the available width, rescale based on width instead
        if (scaledCharWidth > availableWidth) {
          scaleFactor = availableWidth / characterImage.width;
          scaledCharWidth = characterImage.width * scaleFactor;
          scaledCharHeight = characterImage.height * scaleFactor;
        }

        // 7. Calculate position to center the character both horizontally and place it within the vertical bounds
        const charX = (canvas.width - scaledCharWidth) / 2;
        const charY = topMargin;

        // 8. Draw the character image on top, scaled and positioned
        ctx.drawImage(characterImage, charX, charY, scaledCharWidth, scaledCharHeight);

        resolve(canvas.toDataURL('image/png'));
      };
      characterImage.onerror = () => reject(new Error('Failed to load character image for compositing.'));
      characterImage.src = characterSrc;
    };
    backgroundImage.onerror = () => reject(new Error('Failed to load background image for compositing.'));
    backgroundImage.src = backgroundSrc;
  });
};

/**
 * Overlays a frame image onto a base image.
 * The final canvas will have the dimensions of the base image.
 * The frame will be positioned to fit properly without distorting the frame design.
 * @param baseImageSrc URL or base64 string for the base image.
 * @param frameImageSrc URL or base64 string for the frame image.
 * @returns A new base64 encoded image of the composite.
 */
export const compositeWithFrame = async (baseImageSrc: string, frameImageSrc: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const baseImage = new Image();
    baseImage.crossOrigin = 'Anonymous';
    baseImage.onload = () => {
      const frameImage = new Image();
      frameImage.crossOrigin = 'Anonymous';
      frameImage.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = baseImage.width;
        canvas.height = baseImage.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }

        // 1. Draw the base image
        ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
        
        // 2. Draw the frame over it, maintaining its aspect ratio
        // Calculate the scale to fit the frame within the canvas
        const scaleX = canvas.width / frameImage.width;
        const scaleY = canvas.height / frameImage.height;
        const scale = Math.min(scaleX, scaleY);
        
        // Calculate the dimensions of the frame after scaling
        const frameWidth = frameImage.width * scale;
        const frameHeight = frameImage.height * scale;
        
        // Calculate the position to center the frame
        const frameX = (canvas.width - frameWidth) / 2;
        const frameY = (canvas.height - frameHeight) / 2;
        
        // Draw the frame, scaled and centered
        ctx.drawImage(frameImage, frameX, frameY, frameWidth, frameHeight);

        resolve(canvas.toDataURL('image/png'));
      };
      frameImage.onerror = () => reject(new Error('Failed to load frame image for compositing.'));
      frameImage.src = frameImageSrc;
    };
    baseImage.onerror = () => reject(new Error('Failed to load base image for compositing.'));
    baseImage.src = baseImageSrc;
  });
};