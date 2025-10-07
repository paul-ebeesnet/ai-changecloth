require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ftp = require('basic-ftp');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp'); // Add Sharp for image processing

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from the frontend
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// FTP configuration from environment variables
const FTP_CONFIG = {
  host: process.env.FTP_HOST || 'ebeesnet.com',
  port: parseInt(process.env.FTP_PORT) || 21,
  user: process.env.FTP_USER || 'tfunso', // Use just 'tfunso' instead of 'tfunso@minds-marketing.com'
  password: process.env.FTP_PASSWORD || 'PIppen33',
  secure: false // Set to true if using FTPS
};

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(console.error);

// Upload endpoint
app.post('/upload', async (req, res) => {
  try {
    const { image, filename, qrCodeImage } = req.body;
    
    if (!image || !filename) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing image data or filename' 
      });
    }
    
    // Validate filename
    if (!filename.match(/^[a-zA-Z0-9\-_\.]+\.png$/)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid filename. Only alphanumeric characters, hyphens, underscores, and dots allowed. Must end with .png' 
      });
    }
    
    // Decode base64 image
    const base64Data = image.replace(/^data:image\/png;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Save image locally first
    const localFilePath = path.join(UPLOAD_DIR, filename);
    await fs.writeFile(localFilePath, imageBuffer);
    
    // Generate thumbnail
    let thumbnailLocalPath = null;
    const thumbnailFilename = filename.replace('.png', '-thumb.png');
    try {
      // Create thumbnail with maximum dimensions while maintaining aspect ratio
      // Keep reducing quality until file size is under 200KB
      let quality = 80;
      let thumbnailBuffer;
      
      while (quality > 10) {
        thumbnailBuffer = await sharp(imageBuffer)
          .resize(800, 800, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .png({ quality: quality })
          .toBuffer();
          
        if (thumbnailBuffer.length < 200 * 1024) { // 200KB
          break;
        }
        
        quality -= 10;
      }
      
      // If still too large, resize further
      if (thumbnailBuffer.length >= 200 * 1024) {
        thumbnailBuffer = await sharp(imageBuffer)
          .resize(600, 600, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .png({ quality: 60 })
          .toBuffer();
      }
      
      thumbnailLocalPath = path.join(UPLOAD_DIR, thumbnailFilename);
      await fs.writeFile(thumbnailLocalPath, thumbnailBuffer);
    } catch (thumbnailError) {
      console.warn('Failed to generate thumbnail:', thumbnailError.message);
    }
    
    // Decode and save QR code image if provided
    let qrCodeLocalPath = null;
    if (qrCodeImage) {
      const qrCodeFilename = filename.replace('.png', '-qrcode.png');
      const qrCodeBase64Data = qrCodeImage.replace(/^data:image\/png;base64,/, '');
      const qrCodeBuffer = Buffer.from(qrCodeBase64Data, 'base64');
      qrCodeLocalPath = path.join(UPLOAD_DIR, qrCodeFilename);
      await fs.writeFile(qrCodeLocalPath, qrCodeBuffer);
    }
    
    // Upload to FTP
    const client = new ftp.Client();
    client.ftp.verbose = true; // Log FTP commands
    
    try {
      await client.access(FTP_CONFIG);
      
      // Upload to the new specified directory
      try {
        await client.cd('domains/ebeesnet.com/public_html/project/wynn-mif/img');
        console.log('Successfully navigated to new ebeesnet.com wynn-mif img directory');
        // Upload the file
        await client.uploadFrom(localFilePath, filename);
        
        // Upload thumbnail if generated
        if (thumbnailLocalPath) {
          await client.uploadFrom(thumbnailLocalPath, thumbnailFilename);
        }
        
        // Upload QR code if provided
        if (qrCodeLocalPath) {
          const qrCodeFilename = filename.replace('.png', '-qrcode.png');
          await client.uploadFrom(qrCodeLocalPath, qrCodeFilename);
        }
        
        // Return the public URL
        const publicUrl = `https://ebeesnet.com/project/wynn-mif/img/${filename}`;
        const thumbnailUrl = thumbnailLocalPath 
          ? `https://ebeesnet.com/project/wynn-mif/img/${thumbnailFilename}` 
          : null;
        
        client.close();
        
        // Remove local files after successful upload
        await fs.unlink(localFilePath);
        if (thumbnailLocalPath) {
          await fs.unlink(thumbnailLocalPath);
        }
        if (qrCodeLocalPath) {
          await fs.unlink(qrCodeLocalPath);
        }
        
        res.json({ 
          success: true, 
          url: publicUrl,
          thumbnailUrl: thumbnailUrl,
          message: 'Image uploaded successfully to FTP server.'
        });
        return;
      } catch (dirError) {
        console.log('Could not access new ebeesnet.com wynn-mif img directory');
      }
      
      // Try alternative directory paths that might work
      const pathsToTry = [
        'domains/ebeesnet.com/public_html/project/wynn-mif',
        'public_html/project/wynn-mif/img',
        'project/wynn-mif/img',
        'wynn-mif/img'
      ];
      
      let foundPath = false;
      for (const path of pathsToTry) {
        try {
          await client.cd(path);
          console.log(`Successfully navigated to directory: ${path}`);
          // Upload the file
          await client.uploadFrom(localFilePath, filename);
          
          // Upload thumbnail if generated
          if (thumbnailLocalPath) {
            await client.uploadFrom(thumbnailLocalPath, thumbnailFilename);
          }
          
          // Upload QR code if provided
          if (qrCodeLocalPath) {
            const qrCodeFilename = filename.replace('.png', '-qrcode.png');
            await client.uploadFrom(qrCodeLocalPath, qrCodeFilename);
          }
          
          // Return the public URL
          const publicUrl = `https://ebeesnet.com/project/wynn-mif/img/${filename}`;
          const thumbnailUrl = thumbnailLocalPath 
            ? `https://ebeesnet.com/project/wynn-mif/img/${thumbnailFilename}` 
            : null;
          
          client.close();
          
          // Remove local files after successful upload
          await fs.unlink(localFilePath);
          if (thumbnailLocalPath) {
            await fs.unlink(thumbnailLocalPath);
          }
          if (qrCodeLocalPath) {
            await fs.unlink(qrCodeLocalPath);
          }
          
          res.json({ 
            success: true, 
            url: publicUrl,
            thumbnailUrl: thumbnailUrl,
            message: 'Image uploaded successfully to FTP server.'
          });
          return;
        } catch (err) {
          console.log(`Could not access ${path}:`, err.message);
        }
      }
      
      // If no path worked, try to create the directory structure
      try {
        // Try to create the directory path
        await client.sendIgnoringError('MKD domains');
        await client.cd('domains');
        await client.sendIgnoringError('MKD ebeesnet.com');
        await client.cd('ebeesnet.com');
        await client.sendIgnoringError('MKD public_html');
        await client.cd('public_html');
        await client.sendIgnoringError('MKD project');
        await client.cd('project');
        await client.sendIgnoringError('MKD wynn-mif');
        await client.cd('wynn-mif');
        await client.sendIgnoringError('MKD img');
        await client.cd('img');
        
        // Upload the file
        await client.uploadFrom(localFilePath, filename);
        
        // Upload thumbnail if generated
        if (thumbnailLocalPath) {
          await client.uploadFrom(thumbnailLocalPath, thumbnailFilename);
        }
        
        // Upload QR code if provided
        if (qrCodeLocalPath) {
          const qrCodeFilename = filename.replace('.png', '-qrcode.png');
          await client.uploadFrom(qrCodeLocalPath, qrCodeFilename);
        }
        
        // Return the public URL
        const publicUrl = `https://ebeesnet.com/project/wynn-mif/img/${filename}`;
        const thumbnailUrl = thumbnailLocalPath 
          ? `https://ebeesnet.com/project/wynn-mif/img/${thumbnailFilename}` 
          : null;
        
        client.close();
        
        // Remove local files after successful upload
        await fs.unlink(localFilePath);
        if (thumbnailLocalPath) {
          await fs.unlink(thumbnailLocalPath);
        }
        if (qrCodeLocalPath) {
          await fs.unlink(qrCodeLocalPath);
        }
        
        res.json({ 
          success: true, 
          url: publicUrl,
          thumbnailUrl: thumbnailUrl,
          message: 'Image uploaded successfully to FTP server.'
        });
        return;
      } catch (createError) {
        console.log('Could not create directory structure:', createError.message);
      }
      
      // Fallback - upload to root directory
      await client.uploadFrom(localFilePath, filename);
      
      // Upload thumbnail if generated
      if (thumbnailLocalPath) {
        await client.uploadFrom(thumbnailLocalPath, thumbnailFilename);
      }
      
      // Upload QR code if provided
      if (qrCodeLocalPath) {
        const qrCodeFilename = filename.replace('.png', '-qrcode.png');
        await client.uploadFrom(qrCodeLocalPath, qrCodeFilename);
      }
      
      // Close the connection
      client.close();
      
      // Remove local files after successful upload
      await fs.unlink(localFilePath);
      if (thumbnailLocalPath) {
        await fs.unlink(thumbnailLocalPath);
      }
      if (qrCodeLocalPath) {
        await fs.unlink(qrCodeLocalPath);
      }
      
      // Return the public URL for root directory
      const publicUrl = `https://ebeesnet.com/${filename}`;
      const thumbnailUrl = thumbnailLocalPath 
        ? `https://ebeesnet.com/${thumbnailFilename}` 
        : null;
      
      res.json({ 
        success: true, 
        url: publicUrl,
        thumbnailUrl: thumbnailUrl,
        message: 'Image uploaded successfully to FTP server root directory.'
      });
    } catch (ftpError) {
      client.close();
      // Remove local files if FTP upload failed
      await fs.unlink(localFilePath).catch(() => {});
      if (qrCodeLocalPath) {
        await fs.unlink(qrCodeLocalPath).catch(() => {});
      }
      
      console.error('FTP Upload Error:', ftpError);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to upload image to FTP server',
        details: ftpError.message
      });
    }
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});

module.exports = app;