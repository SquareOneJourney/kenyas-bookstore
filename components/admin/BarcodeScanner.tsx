
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
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    // Initialize and Get Cameras
    useEffect(() => {
        const html5QrCode = new Html5Qrcode(scannerId);
        html5QrCodeRef.current = html5QrCode;

        const init = async () => {
            try {
                const availableCameras = await Html5Qrcode.getCameras();
                if (availableCameras && availableCameras.length > 0) {
                    setCameras(availableCameras);
                    // Default to the last camera (usually the high-res secondary lens on mobile)
                    setSelectedCameraId(availableCameras[availableCameras.length - 1].id);
                } else {
                    setError("No cameras found on this device.");
                }
            } catch (err) {
                console.error("Failed to get cameras", err);
                setError("Camera permission denied. Please check your settings.");
            }
        };

        if (!isScannerStarted && !error) {
            init();
        }

        return () => {
            if (html5QrCodeRef.current?.isScanning) {
                html5QrCodeRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const startScanner = async (cameraId: string) => {
        if (!html5QrCodeRef.current) return;

        try {
            // Stop if already running
            if (html5QrCodeRef.current.isScanning) {
                await html5QrCodeRef.current.stop();
            }

            const config = {
                fps: 20,
                qrbox: { width: 250, height: 150 },
                aspectRatio: 1.0 // Square for better focus area
            };

            await html5QrCodeRef.current.start(
                cameraId,
                config,
                (decodedText) => {
                    html5QrCodeRef.current?.pause(true);
                    setIsScannerStarted(false);
                    onScanSuccess(decodedText);
                },
                () => { } // Frame errors are expected
            );

            setIsScannerStarted(true);
            setError(null);

            // Torch detection
            const track = (html5QrCodeRef.current as any)._videoElement?.srcObject?.getVideoTracks()[0];
            const capabilities = track?.getCapabilities();
            setHasTorch(!!capabilities?.torch);

        } catch (err) {
            console.error("Start failed", err);
            setError("This camera is currently blocked. Try selecting another one.");
        }
    };

    const toggleTorch = async () => {
        if (!hasTorch || !isScannerStarted) return;
        try {
            const nextState = !torchOn;
            const track = (html5QrCodeRef.current as any)._videoElement?.srcObject?.getVideoTracks()[0];
            await track.applyConstraints({ advanced: [{ torch: nextState }] });
            setTorchOn(nextState);
        } catch (e) {
            console.error(e);
        }
    };

    const switchCamera = (id: string) => {
        setSelectedCameraId(id);
        startScanner(id);
    };

    // Auto-start when camera selection is ready
    useEffect(() => {
        if (selectedCameraId && !isScannerStarted && !error) {
            startScanner(selectedCameraId);
        }
        return () => {
            if (html5QrCodeRef.current) {
                const stopPromise = html5QrCodeRef.current.isScanning
                    ? html5QrCodeRef.current.stop()
                    : Promise.resolve();

                stopPromise.then(() => {
                    html5QrCodeRef.current?.clear();
                }).catch(console.error);
            }
        };
    }, [selectedCameraId]);

    return (
        <div className="w-full relative overflow-hidden rounded-[2.5rem] bg-black aspect-[3/4] shadow-2xl ring-1 ring-white/20">
            {/* Real Viewport */}
            <div id={scannerId} className="w-full h-full"></div>

            {/* Dark Mask for professional focus */}
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
                    <p className="text-[10px] font-black text-white tracking-[0.2em] uppercase">Lens Active</p>
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
            <div className="absolute bottom-10 left-0 right-0 px-8 z-50 flex flex-col items-center gap-8">
                {cameras.length > 1 && (
                    <div className="flex gap-2 bg-black/60 backdrop-blur-2xl p-1.5 rounded-full border border-white/20 shadow-2xl">
                        {cameras.map((cam, idx) => (
                            <button
                                key={cam.id}
                                onClick={() => switchCamera(cam.id)}
                                className={`px-5 py-2 rounded-full text-[9px] font-black tracking-widest transition-all ${selectedCameraId === cam.id ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                            >
                                {idx === 0 ? 'WIDE' : idx === 1 ? 'ULTRA' : `LENS ${idx + 1}`}
                            </button>
                        ))}
                    </div>
                )}

                {/* The "Snap" Button Visual - Auto-scans, but gives users something to interact with */}
                <button
                    onClick={() => {
                        const overlay = document.querySelector('.scanner-overlay-mask');
                        overlay?.classList.add('bg-white/20');
                        setTimeout(() => overlay?.classList.remove('bg-white/20'), 100);
                    }}
                    className="w-24 h-24 rounded-full border-[6px] border-white/30 p-1 active:scale-90 transition-transform shadow-2xl"
                >
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                        <div className="w-[85%] h-[85%] rounded-full border-2 border-black/5"></div>
                    </div>
                </button>
            </div>

            {error && (
                <div className="absolute inset-0 flex items-center justify-center z-[100] bg-black/95 p-8 text-center animate-in zoom-in-95 duration-300">
                    <div className="glass-panel p-10 rounded-[3rem] border-red-500/30 shadow-2xl">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-white text-xl font-black tracking-tight mb-3 uppercase">Hardware Blocked</h3>
                        <p className="text-white/50 text-xs mb-8 leading-relaxed max-w-[200px] mx-auto">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-white text-black py-5 rounded-2xl font-black text-xs tracking-[0.2em] shadow-xl hover:bg-gray-200 transition-colors"
                        >
                            RESET CAMERA
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BarcodeScanner;
