
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
    const [hasTorch, setHasTorch] = useState(false);
    const [torchOn, setTorchOn] = useState(false);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
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
            setTorchOn(false);
            onScanSuccess(decodedText);
        };

        const startScanner = async () => {
            try {
                // HINTING: We use "ideal" constraints. 
                // Browsers will try to get 1080p/720p (which have better light sensitivity) 
                // but won't crash if they can only give 480p.
                const cameraConfig = {
                    facingMode: "environment",
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                };

                await html5QrCode.start(
                    cameraConfig,
                    config,
                    onScan,
                    (errorMessage) => { }
                );

                setIsScannerStarted(true);
                setError(null);

                // Check for torch capability
                const scanner = html5QrCodeRef.current;
                if (scanner) {
                    const cameras = await Html5Qrcode.getCameras();
                    if (cameras && cameras.length > 0) {
                        try {
                            // @ts-ignore - torch is partially supported in some browsers through applyConstraints
                            const track = (scanner as any)._videoElement?.srcObject?.getVideoTracks()[0];
                            const capabilities = track?.getCapabilities();
                            if (capabilities?.torch) {
                                setHasTorch(true);
                            }
                        } catch (e) {
                            console.log("Torch detection failed", e);
                        }
                    }
                }

            } catch (err) {
                console.error("Camera start failed:", err);
                setError("Camera access denied. Please allow permissions.");
            }
        };

        setTimeout(startScanner, 100);

        return () => {
            if (html5QrCodeRef.current) {
                if (html5QrCodeRef.current.isScanning) {
                    html5QrCodeRef.current.stop().then(() => {
                        html5QrCodeRef.current?.clear();
                    }).catch(err => console.error("Scanner stop error", err));
                } else {
                    html5QrCodeRef.current.clear();
                }
            }
        };
    }, [onScanSuccess, onScanFailure]);

    const toggleTorch = async () => {
        const scanner = html5QrCodeRef.current;
        if (!scanner || !hasTorch) return;

        try {
            const nextState = !torchOn;
            // @ts-ignore - html5-qrcode exposing applyConstraints
            const track = (scanner as any)._videoElement?.srcObject?.getVideoTracks()[0];
            await track.applyConstraints({
                advanced: [{ torch: nextState }]
            });
            setTorchOn(nextState);
        } catch (e) {
            console.error("Failed to toggle torch", e);
        }
    };

    return (
        <div className="w-full relative overflow-hidden rounded-xl bg-black aspect-[4/3] shadow-2xl ring-1 ring-white/10">
            <div id={scannerId} className="w-full h-full object-cover"></div>

            {isScannerStarted && (
                <>
                    <div className="scanner-overlay-mask"></div>
                    <div className="scanner-cutout">
                        <div className="scanner-laser-line"></div>
                        <div className="scanner-corner scanner-corner-tl"></div>
                        <div className="scanner-corner scanner-corner-tr"></div>
                        <div className="scanner-corner scanner-corner-bl"></div>
                        <div className="scanner-corner scanner-corner-br"></div>
                    </div>

                    {/* Torch Toggle */}
                    {hasTorch && (
                        <button
                            onClick={toggleTorch}
                            className={`absolute top-4 right-4 z-50 p-3 rounded-full backdrop-blur-md transition-all ${torchOn ? 'bg-yellow-400 text-black' : 'bg-black/40 text-white border border-white/20'}`}
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </button>
                    )}

                    <div className="absolute bottom-6 left-0 right-0 z-20 text-center">
                        <p className="text-white/80 text-sm font-medium tracking-wide animate-pulse">
                            ALIGN BARCODE WITHIN THE FRAME
                        </p>
                    </div>
                </>
            )}

            {!isScannerStarted && !error && (
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
        </div>
    );
};

export default BarcodeScanner;
