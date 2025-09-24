
import { base64ToImageData } from '../utils/imageUtils';

export const uploadToImgBB = async (base64Image: string): Promise<string> => {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error("IMGBB_API_KEY is not set in environment variables.");
  }

  const { data } = base64ToImageData(base64Image);
  
  const formData = new FormData();
  formData.append('image', data);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to upload image: ${errorData.error.message}`);
  }

  const result = await response.json();
  if (result.success) {
    return result.data.url;
  } else {
    throw new Error('ImgBB upload was not successful.');
  }
};
