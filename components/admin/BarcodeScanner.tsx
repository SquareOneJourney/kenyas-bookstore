
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

        const onScan = (decodedText: string) => {
            const cutout = document.querySelector('.scanner-cutout');
            if (cutout) {
                cutout.classList.add('bg-green-500/20');
                setTimeout(() => cutout.classList.remove('bg-green-500/20'), 300);
            }
            html5QrCode.pause(true);
            setIsScannerStarted(false);
            onScanSuccess(decodedText);
        };

        const startScanner = async () => {
            try {
                // progressive degradation strategy
                // 1. Try High Res (Best for focusing)
                // 2. Try Medium Res (Standard)
                // 3. Try Basic (Just give me a video feed)

                const startWithConstraints = async (constraints: any) => {
                    try {
                        console.log("Attempting camera with constraints:", JSON.stringify(constraints));
                        await html5QrCode.start(constraints, config, onScan, (err) => { if (onScanFailure) onScanFailure(err) });
                        setIsScannerStarted(true);
                        setError(null);
                        return true;
                    } catch (err) {
                        console.warn("Camera start failed for constraints:", constraints, err);
                        return false;
                    }
                };

                // Attempt 1: High Quality (720p minimum)
                const highRes = {
                    facingMode: "environment",
                    width: { min: 640, ideal: 1280 },
                    height: { min: 480, ideal: 720 },
                    aspectRatio: { ideal: 1.777 },
                    // @ts-ignore
                    focusMode: "continuous"
                };

                // Attempt 2: Loose (Just ask for environment)
                const mediumRes = { facingMode: "environment" };

                // Attempt 3: Desperate (Anything works)
                const basic = { facingMode: "user" };

                if (await startWithConstraints(highRes)) return;
                console.log("High res failed, trying medium constraint...");

                if (await startWithConstraints(mediumRes)) return;
                console.log("Medium res failed, trying basic constraint...");

                if (await startWithConstraints(basic)) return;

                throw new Error("Could not start any camera.");

            } catch (err: any) {
                console.error("All camera attempts failed:", err);
                setError("Could not access camera. Please check permissions.");
            }
        };

        startScanner();

        return () => {
            if (html5QrCodeRef.current) {
                try {
                    if (html5QrCodeRef.current.isScanning) {
                        html5QrCodeRef.current.stop().then(() => {
                            html5QrCodeRef.current?.clear();
                        }).catch(err => console.error("Scanner stop error", err));
                    } else {
                        // If paused or not scanning, just clear
                        html5QrCodeRef.current.clear();
                    }
                } catch (e) {
                    console.error("Cleanup error", e);
                }
            }
        };
    }, [onScanSuccess, onScanFailure]);

    return (
        <div className="w-full relative overflow-hidden rounded-xl bg-black aspect-[4/3] shadow-2xl ring-1 ring-white/10">
            {/* The actual video feed */}
            <div id={scannerId} className="w-full h-full object-cover"></div>

            {/* Premium UI Overlay */}
            {isScannerStarted ? (
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
            ) : !error && (
                // Success State Overlay (When paused)
                <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-forest text-cream p-4 rounded-full mb-4 shadow-lg shadow-forest/50">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-white font-bold text-lg tracking-widest uppercase">Book Details Found</p>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/80 p-6 text-center">
                    <div>
                        <p className="text-red-400 font-bold mb-2">ACCESS DENIED</p>
                        <p className="text-white/60 text-xs">{error}</p>
                    </div>
                </div>
            )}

            {!isScannerStarted && !error && !html5QrCodeRef.current && (
                <div className="absolute inset-0 flex items-center justify-center z-30">
                    <div className="animate-spin h-8 w-8 border-2 border-forest border-t-transparent rounded-full"></div>
                </div>
            )}
        </div>
    );
};

export default BarcodeScanner;
