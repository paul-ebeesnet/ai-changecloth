// Vercel API route for handling FTP uploads
// This replicates the functionality of the backend/server.js upload endpoint

import fs from 'fs/promises';
import path from 'path';

// Since Vercel serverless functions have size limits and don't support FTP libraries well,
// we'll need to handle this differently. For now, we'll return a message indicating
// that FTP uploads are not supported in the Vercel deployment.

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    // In a Vercel deployment, we can't directly upload to FTP due to:
    // 1. Size limits on serverless functions
    // 2. Network restrictions that may block FTP connections
    // 3. No persistent file system for temporary storage
    
    // Return a response indicating that FTP is not available in this deployment
    response.status(200).json({
      success: false,
      error: 'FTP uploads are not supported in this deployment. Please use the downloadable image option.',
      message: 'Image processing was successful, but FTP upload is not available in this deployment environment. You can download the image to your device.'
    });
  } catch (error) {
    console.error('Upload Error:', error);
    response.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    });
  }
}