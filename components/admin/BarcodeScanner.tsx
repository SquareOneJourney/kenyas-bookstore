
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
    width?: number;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
    onScanSuccess,
    onScanFailure,
    width = 500
}) => {
    const scannerId = "html5-qrcode-video";
    const [isScannerStarted, setIsScannerStarted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        // Initialize the engine
        const html5QrCode = new Html5Qrcode(scannerId);
        html5QrCodeRef.current = html5QrCode;

        const config = {
            fps: 15,
            qrbox: { width: 250, height: 150 },
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.CODE_128,
            ]
        };

        const startScanner = async () => {
            try {
                // High-end move: Specifically request the back camera (environment) 
                // to skip the "which camera" dropdown mess.
                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        // Success Feedback: Pulse the scanner green 
                        const cutout = document.querySelector('.scanner-cutout');
                        if (cutout) {
                            cutout.classList.add('bg-green-500/20');
                            setTimeout(() => cutout.classList.remove('bg-green-500/20'), 300);
                        }
                        onScanSuccess(decodedText);
                    },
                    (errorMessage) => {
                        if (onScanFailure) onScanFailure(errorMessage);
                    }
                );
                setIsScannerStarted(true);
            } catch (err: any) {
                console.warn("Failed to start with environment camera, falling back to default.", err);
                // Fallback: Just use whatever camera is available
                try {
                    await html5QrCode.start(
                        { facingMode: "user" }, // Try front if back fails
                        config,
                        onScanSuccess,
                        onScanFailure
                    );
                    setIsScannerStarted(true);
                } catch (fallbackErr: any) {
                    setError("Could not access camera. Please check permissions.");
                    console.error("Camera Init Error:", fallbackErr);
                }
            }
        };

        startScanner();

        return () => {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                html5QrCodeRef.current.stop().then(() => {
                    html5QrCodeRef.current?.clear();
                }).catch(err => console.error("Scanner stop error", err));
            }
        };
    }, [onScanSuccess, onScanFailure]);

    return (
        <div className="w-full relative overflow-hidden rounded-xl bg-black aspect-[4/3] shadow-2xl ring-1 ring-white/10">
            {/* The actual video feed */}
            <div id={scannerId} className="w-full h-full object-cover"></div>

            {/* Premium UI Overlay */}
            {isScannerStarted && (
                <>
                    <div className="scanner-overlay-mask"></div>
                    <div className="scanner-cutout">
                        {/* The animated laser line */}
                        <div className="scanner-laser-line"></div>

                        {/* Stylized corner brackets */}
                        <div className="scanner-corner scanner-corner-tl"></div>
                        <div className="scanner-corner scanner-corner-tr"></div>
                        <div className="scanner-corner scanner-corner-bl"></div>
                        <div className="scanner-corner scanner-corner-br"></div>
                    </div>

                    {/* Status Text */}
                    <div className="absolute bottom-6 left-0 right-0 z-20 text-center">
                        <p className="text-white/80 text-sm font-medium tracking-wide animate-pulse">
                            ALIGN BARCODE WITHIN THE FRAME
                        </p>
                    </div>
                </>
            )}

            {error && (
                <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/80 p-6 text-center">
                    <div>
                        <p className="text-red-400 font-bold mb-2">ACCESS DENIED</p>
                        <p className="text-white/60 text-xs">{error}</p>
                    </div>
                </div>
            )}

            {!isScannerStarted && !error && (
                <div className="absolute inset-0 flex items-center justify-center z-30">
                    <div className="animate-spin h-8 w-8 border-2 border-forest border-t-transparent rounded-full"></div>
                </div>
            )}
        </div>
    );
};

export default BarcodeScanner;
