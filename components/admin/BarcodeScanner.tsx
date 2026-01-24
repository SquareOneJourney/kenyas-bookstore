
import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
    width?: number; // Optional width for the scanner container
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
    onScanSuccess, 
    onScanFailure,
    width = 500
}) => {
    const scannerId = "html5-qrcode-reader";
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Prevent multiple initializations
        if (scannerRef.current) {
            return; 
        }

        // Initialize Scanner
        // fps: Frames per second for scanning
        // qrbox: The dimension of the scanning region
        const scanner = new Html5QrcodeScanner(
            scannerId,
            { 
                fps: 10, 
                qrbox: { width: 250, height: 150 },
                aspectRatio: 1.0, 
                showTorchButtonIfSupported: true 
            },
            /* verbose= */ false
        );

        scanner.render(
            (decodedText, _decodedResult) => {
                // Success callback
                onScanSuccess(decodedText);
                // Optional: Stop scanning after success if desired? 
                // Currently keeping it running for multiple scans.
            }, 
            (errorMessage) => {
                // Failure callback (called frequently when no code is found)
                if (onScanFailure) {
                    onScanFailure(errorMessage);
                }
            }
        );

        scannerRef.current = scanner;

        // Cleanup function
        return () => {
             if (scannerRef.current) {
                 try {
                     scannerRef.current.clear().catch(error => {
                         console.error("Failed to clear html5-qrcode scanner. ", error);
                     });
                 } catch (e) {
                     console.error("Error clearing scanner", e);
                 }
                 scannerRef.current = null;
             }
        };
    }, [onScanSuccess, onScanFailure]);

    return (
        <div className="w-full relative overflow-hidden rounded-lg bg-gray-100"> 
            <div id={scannerId} style={{ width: '100%', maxWidth: `${width}px`, margin: '0 auto' }}></div>
            <p className="text-center text-xs text-gray-500 mt-2">
                Point your camera at a barcode to scan.
            </p>
        </div>
    );
};

export default BarcodeScanner;
