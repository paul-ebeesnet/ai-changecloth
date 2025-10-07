# AI Costume Changer Backend

This is the backend service for the AI Costume Changer application. It handles FTP uploads of generated images and QR codes.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

3. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

### POST /upload

Uploads an image and its corresponding QR code to the FTP server.

**Request Body:**
```json
{
  "image": "data:image/png;base64,...", // Base64 encoded image
  "filename": "image-name.png",         // Filename for the uploaded image
  "qrCodeImage": "data:image/png;base64,..." // Optional: Base64 encoded QR code
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://ebeesnet.com/project/wynn-mif/img/image-name.png",
  "message": "Image uploaded successfully"
}
```

When a QR code is generated, it will be automatically uploaded with the filename `image-name-qrcode.png`.

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

## Environment Variables

- `FTP_HOST` - FTP server hostname (default: ebeesnet.com)
- `FTP_PORT` - FTP server port (default: 21)
- `FTP_USER` - FTP username (default: tfunso)
- `FTP_PASSWORD` - FTP password (default: PIppen33)
- `PORT` - Server port (default: 3001)

## Deployment Notes

The current implementation uploads files to the directory:
`ftp://tfunso@ebeesnet.com/domains/ebeesnet.com/public_html/project/wynn-mif/img`

The public URL for uploaded images will be:
`https://ebeesnet.com/project/wynn-mif/img/filename.png`

The public URL for corresponding QR codes will be:
`https://ebeesnet.com/project/wynn-mif/img/filename-qrcode.png`

If the directory doesn't exist, the server will attempt to create it automatically.