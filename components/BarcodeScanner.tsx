import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScanSuccess: (isbn: string) => void;
  onError?: (error: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onError, onClose }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startScanning = async () => {
      try {
        // Get available cameras
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          // Prefer back camera on mobile, or first available
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
          );
          const selectedCamera = backCamera || devices[0];

          // Create scanner instance
          const scanner = new Html5Qrcode('barcode-scanner-container');
          scannerRef.current = scanner;

          // Start scanning - html5-qrcode supports barcodes by default
          await scanner.start(
            selectedCamera.id,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              // Clean the scanned text (remove any non-ISBN characters)
              const cleanedIsbn = decodedText.replace(/[^0-9X]/gi, '');
              
              // Validate it looks like an ISBN (10 or 13 digits)
              if (cleanedIsbn.length === 10 || cleanedIsbn.length === 13) {
                onScanSuccess(cleanedIsbn);
                stopScanning();
              } else {
                setError('Invalid ISBN format. Please try again.');
                setTimeout(() => setError(null), 3000);
              }
            },
            (errorMessage) => {
              // Ignore not found errors (just means no barcode detected yet)
              if (!errorMessage.includes('No QR code') && !errorMessage.includes('NotFoundException')) {
                console.log('Scan error:', errorMessage);
              }
            }
          );

          setIsScanning(true);
        } else {
          setError('No camera found. Please check your device permissions.');
        }
      } catch (err: any) {
        console.error('Camera error:', err);
        const errorMsg = err.message || 'Failed to access camera. Please check permissions.';
        setError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
      }
    };

    startScanning();

    return () => {
      stopScanning();
    };
  }, []);

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        if (isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        // Ignore errors when stopping (camera might already be released)
        console.log('Scanner cleanup:', err);
      }
      setIsScanning(false);
    }
  };

  const handleClose = async () => {
    await stopScanning();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-deep-blue">Scan ISBN Barcode</h3>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
              aria-label="Close scanner"
            >
              ×
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="relative">
            <div id="barcode-scanner-container" className="w-full rounded-lg overflow-hidden bg-black" style={{ minHeight: '300px' }} />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="border-2 border-forest rounded-lg" style={{ width: '250px', height: '250px' }}>
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-forest rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-forest rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-forest rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-forest rounded-br-lg"></div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mt-4 text-center">
            Point your camera at the ISBN barcode on the book
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;

