
import React from 'react';

interface QRCodeDisplayProps {
  value: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ value }) => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(value)}`;

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <img src={qrCodeUrl} alt="QR Code" width="200" height="200" />
    </div>
  );
};

export default QRCodeDisplay;
