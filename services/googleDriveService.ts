import { base64ToBlob } from '../utils/imageUtils';

export const uploadToGoogleDrive = async (base64Image: string, accessToken: string): Promise<string> => {
  const imageBlob = base64ToBlob(base64Image);
  const GOOGLE_DRIVE_FOLDER_ID = '1OMd67EpSPCVBdm7Z860uChd4KlDjXVS7';

  const metadata = {
    name: `ai-artwork-${Date.now()}.png`,
    mimeType: 'image/png',
    // Directly upload to the specified shared folder.
    parents: [GOOGLE_DRIVE_FOLDER_ID],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', imageBlob);

  // 1. Upload the file
  const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!uploadResponse.ok) {
    const errorData = await uploadResponse.json();
    throw new Error(`Google Drive upload failed: ${errorData.error.message}`);
  }

  const fileData = await uploadResponse.json();
  const fileId = fileData.id;

  if (!fileId) {
    throw new Error('Could not get file ID from Google Drive upload response.');
  }

  // 2. Make the file public so anyone with the link can view it
  const permissionsResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone',
    }),
  });

  if (!permissionsResponse.ok) {
    const errorData = await permissionsResponse.json();
    // It's not critical if this fails, the user can still access it if the folder is shared.
    console.warn(`Could not set public permissions for file ${fileId}:`, errorData);
  }

  // 3. Return the web view link for the file
  return `https://drive.google.com/file/d/${fileId}/view`;
};
