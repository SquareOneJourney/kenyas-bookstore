
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
    const [cameras, setCameras] = useState<any[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string>('');
    const [hasTorch, setHasTorch] = useState(false);
    const [torchOn, setTorchOn] = useState(false);

    // Refs for stable instance management
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;

        // Initialize instance
        if (!html5QrCodeRef.current) {
            html5QrCodeRef.current = new Html5Qrcode(scannerId);
        }

        const getCameras = async () => {
            try {
                const devices = await Html5Qrcode.getCameras();
                if (isMountedRef.current && devices && devices.length > 0) {
                    setCameras(devices);
                }
            } catch (err) {
                console.warn("Could not list cameras", err);
                // Non-fatal, we will try to start with "environment" facing mode anyway
            }
        };

        getCameras();
        startScanner(); // Initial start with default settings

        return () => {
            isMountedRef.current = false;
            if (html5QrCodeRef.current?.isScanning) {
                html5QrCodeRef.current.stop().catch(err => console.warn("Stop failed during unmount", err));
            }
        };
    }, []);

    const startScanner = async (cameraIdOrConfig?: string | { facingMode: string }) => {
        if (!html5QrCodeRef.current) return;

        try {
            // If already scanning, stop first
            if (html5QrCodeRef.current.isScanning) {
                await html5QrCodeRef.current.stop();
            }

            // Default config - explicitly NOT setting aspectRatio to avoid OverconstrainedError
            const config = {
                fps: 15, // Reduced from 20 for better stability
                qrbox: { width: 250, height: 150 },
                // aspectRatio: 1.0 <--- REMOVED: This causes "dark camera" on many devices
            };

            const cameraConfig = cameraIdOrConfig || { facingMode: "environment" };

            await html5QrCodeRef.current.start(
                cameraConfig as any,
                config,
                (decodedText) => {
                    // Success callback
                    if (isMountedRef.current) {
                        // Optional: Vibration feedback
                        if (navigator.vibrate) navigator.vibrate(200);

                        // Don't stop the scanner automatically for better UX, 
                        // just report the hit. The parent can decide to unmount/hide.
                        onScanSuccess(decodedText);
                    }
                },
                (errorMessage) => {
                    // Ignore frame scan errors
                }
            );

            if (isMountedRef.current) {
                setIsScannerStarted(true);
                setError(null);

                // Check for torch capability after start
                setTimeout(() => {
                    if (!html5QrCodeRef.current) return;
                    try {
                        const track = (html5QrCodeRef.current as any)._videoElement?.srcObject?.getVideoTracks()[0];
                        const capabilities = track?.getCapabilities();
                        setHasTorch(!!capabilities?.torch);
                    } catch (e) {
                        console.log("Torch check failed", e);
                    }
                }, 500);
            }

        } catch (err: any) {
            console.error("Failed to start scanner", err);
            if (isMountedRef.current) {
                let msg = "Camera failed to start.";
                if (err?.name === "NotAllowedError") msg = "Camera permission denied.";
                if (err?.name === "NotFoundError") msg = "No camera found.";
                if (err?.name === "NotReadableError") msg = "Camera is in use by another app.";
                setError(msg);
            }
        }
    };

    const toggleTorch = async () => {
        if (!hasTorch || !isScannerStarted || !html5QrCodeRef.current) return;
        try {
            const nextState = !torchOn;
            const track = (html5QrCodeRef.current as any)._videoElement?.srcObject?.getVideoTracks()[0];
            await track.applyConstraints({ advanced: [{ torch: nextState }] });
            setTorchOn(nextState);
        } catch (e) {
            console.error("Torch toggle failed", e);
        }
    };

    const switchCamera = (id: string) => {
        setSelectedCameraId(id);
        startScanner(id); // Restart with specific ID
    };

    return (
        <div className="w-full relative overflow-hidden rounded-[2.5rem] bg-black aspect-[3/4] shadow-2xl ring-1 ring-white/20">
            {/* Real Viewport */}
            <div id={scannerId} className="w-full h-full"></div>

            {/* Dark Mask for professional focus - purely visual */}
            <div className="absolute inset-0 bg-black/40 pointer-events-none transition-opacity duration-700"></div>

            {/* Corner Brackets - Styled after premium scanning apps */}
            <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
                <div className="w-full max-w-[280px] aspect-[1.6/1] relative">
                    <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-xl shadow-lg"></div>
                    <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-xl shadow-lg"></div>
                    <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-xl shadow-lg"></div>
                    <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-xl shadow-lg"></div>

                    {/* Pulsing Scan Line */}
                    <div className="animate-scan-y">
                        <div className="h-[2px] bg-white shadow-[0_0_15px_rgba(255,255,255,1)] opacity-70"></div>
                    </div>
                </div>
            </div>

            {/* Header Controls */}
            <div className="absolute top-8 left-0 right-0 px-8 flex justify-between items-center z-50">
                <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20 shadow-lg">
                    <p className="text-[10px] font-black text-white tracking-[0.2em] uppercase">
                        {isScannerStarted ? 'Active' : 'Initializing...'}
                    </p>
                </div>

                <div className="flex gap-3">
                    {hasTorch && (
                        <button onClick={toggleTorch} className={`p-4 rounded-full backdrop-blur-2xl transition-all shadow-xl ${torchOn ? 'bg-white text-black scale-110' : 'bg-black/60 text-white border border-white/20 hover:bg-black/80'}`}>
                            <svg className="w-5 h-5" fill={torchOn ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom Controls / Camera Selector */}
            <div className="absolute bottom-6 left-0 right-0 px-8 z-50 flex justify-center w-full overflow-x-auto no-scrollbar">
                {cameras.length > 1 && (
                    <div className="flex gap-2 bg-black/60 backdrop-blur-2xl p-1.5 rounded-full border border-white/20 shadow-2xl">
                        {cameras.map((cam, idx) => (
                            <button
                                key={cam.id}
                                onClick={() => switchCamera(cam.id)}
                                className={`px-4 py-2 rounded-full text-[9px] font-black tracking-widest transition-all whitespace-nowrap ${selectedCameraId === cam.id ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                            >
                                {cam.label ? (cam.label.length > 10 ? `CAM ${idx + 1}` : cam.label) : `CAM ${idx + 1}`}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {error && (
                <div className="absolute inset-0 flex items-center justify-center z-[100] bg-black/95 p-8 text-center animate-in zoom-in-95 duration-300">
                    <div className="glass-panel p-10 rounded-[3rem] border-red-500/30 shadow-2xl">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-white text-xl font-black tracking-tight mb-3 uppercase">Scanner Error</h3>
                        <p className="text-white/50 text-xs mb-8 leading-relaxed max-w-[200px] mx-auto">{error}</p>
                        <button
                            onClick={() => {
                                setError(null);
                                startScanner();
                            }}
                            className="w-full bg-white text-black py-5 rounded-2xl font-black text-xs tracking-[0.2em] shadow-xl hover:bg-gray-200 transition-colors"
                        >
                            RETRY
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BarcodeScanner;
