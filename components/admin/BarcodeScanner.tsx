import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess }) => {
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMethod, setProcessingMethod] = useState<'local' | 'ai' | null>(null);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [error, setError] = useState<string>('');

    const regionId = "html5qr-code-capture-region";
    const scannerRef = useRef<Html5Qrcode | null>(null);

    // Initialize Gemini Helper
    const scanWithGemini = async (imageFile: File): Promise<string | null> => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("No Gemini API key found");
            return null;
        }

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            // Convert file to base64
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(imageFile);
                reader.onload = () => {
                    const result = reader.result as string;
                    // Remove data url prefix
                    const base64 = result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
            });

            const prompt = "Locate the barcode on this book cover. Read the ISBN-13 number (starts with 978 or 979) or the ISBN-10 number. Return ONLY the digits of the number, nothing else. If there are dashes, remove them.";

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: "image/jpeg"
                    }
                }
            ]);

            const text = result.response.text().trim();
            const cleaned = text.replace(/[^0-9X]/gi, '');

            if (cleaned.length >= 10) {
                return cleaned;
            }
            return null;

        } catch (err) {
            console.error("Gemini Scan Error:", err);
            return null;
        }
    };

    // Get cameras on mount
    useEffect(() => {
        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length) {
                // Fix types for devices
                const formattedDevices = devices.map(d => ({
                    deviceId: d.id,
                    label: d.label
                })) as unknown as MediaDeviceInfo[];

                setCameras(formattedDevices);

                // Prioritize back camera
                const backCamera = devices.find(device =>
                    device.label.toLowerCase().includes('back') ||
                    device.label.toLowerCase().includes('environment') ||
                    device.label.toLowerCase().includes('rear')
                );

                setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
            } else {
                setError('No cameras found');
            }
        }).catch(err => {
            console.error(err);
            setError('Camera permission denied or no camera found.');
        });

        // Cleanup
        return () => {
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    // Start selected camera
    const startCamera = useCallback(async () => {
        if (!selectedCameraId) return;

        // Cleanup existing instance
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (e) {
                // Ignore stop errors
            }
        }

        const scanner = new Html5Qrcode(regionId);
        scannerRef.current = scanner;

        try {
            await scanner.start(
                selectedCameraId,
                {
                    fps: 10,
                    qrbox: { width: 300, height: 150 },
                    aspectRatio: 1.333334,
                    videoConstraints: {
                        facingMode: "environment", // Request back camera
                        focusMode: "continuous"
                    }
                },
                () => { }, // Ignore auto-scan results (we snap manually)
                () => { }
            );

            setIsCameraReady(true);
            setError('');
        } catch (err) {
            console.error("Error starting camera", err);
            setError("Could not start camera. Try switching cameras.");
        }
    }, [selectedCameraId]);

    // Handle switching cameras
    const switchCamera = () => {
        if (cameras.length <= 1) return;

        const currentIndex = cameras.findIndex(c => (c as any).deviceId === selectedCameraId || (c as any).id === selectedCameraId);
        const nextIndex = (currentIndex + 1) % cameras.length;
        const nextCamera = cameras[nextIndex];

        // Handle inconsistent ID naming in library vs standard API
        const nextId = (nextCamera as any).id || (nextCamera as any).deviceId;
        setSelectedCameraId(nextId);
    };

    // Auto-restart camera on selection change
    useEffect(() => {
        if (selectedCameraId && isCameraReady) {
            startCamera();
        } else if (selectedCameraId && !isCameraReady && !error) {
            // Initial start wait for user interaction usually, but if we just switched, auto-start
        }
    }, [selectedCameraId]);


    // MAIN ACTION: Capture Frame & Scan
    const captureAndScan = async () => {
        if (!scannerRef.current || isProcessing) return;

        setIsProcessing(true);
        setProcessingMethod('local');
        setError('');

        try {
            const videoElement = document.querySelector(`#${regionId} video`) as HTMLVideoElement;
            if (!videoElement) throw new Error("Video stream not found");

            // 1. Capture High-Res Snapshot
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    setIsProcessing(false);
                    return;
                }

                // 2. STOP Camera (Critical for file scan to work)
                if (scannerRef.current?.isScanning) {
                    await scannerRef.current.stop();
                    setIsCameraReady(false);
                }

                const file = new File([blob], "capture.jpg", { type: "image/jpeg" });

                // 3. Try Local Scan First
                try {
                    const result = await scannerRef.current!.scanFileV2(file, true);
                    if (result && result.decodedText) {
                        handleScanSuccess(result.decodedText);
                        return;
                    }
                } catch (localErr) {
                    console.log("Local scan failed, trying AI fallback...");
                }

                // 4. Try Gemini AI Fallback
                setProcessingMethod('ai');
                const aiResult = await scanWithGemini(file);

                if (aiResult) {
                    handleScanSuccess(aiResult);
                } else {
                    setError("Could not identify barcode. Ensure good lighting and hold steady.");
                    startCamera(); // Restart camera for next try
                }

                setIsProcessing(false);
                setProcessingMethod(null);

            }, 'image/jpeg', 0.95);

        } catch (err) {
            console.error(err);
            setIsProcessing(false);
            setProcessingMethod(null);
            startCamera();
        }
    };

    const handleScanSuccess = (text: string) => {
        setScanResult(text);
        setIsProcessing(false);
        setProcessingMethod(null);

        // Success Beep
        try {
            const audio = new AudioContext();
            const osc = audio.createOscillator();
            const gain = audio.createGain();
            osc.connect(gain);
            gain.connect(audio.destination);
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audio.currentTime + 0.1);
        } catch (e) { }

        onScanSuccess(text);
    };

    return (
        <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Barcode Scanner</h3>

                {cameras.length > 1 && !scanResult && (
                    <button
                        onClick={switchCamera}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Switch Camera
                    </button>
                )}
            </div>

            {/* Viewfinder Container */}
            <div className="relative bg-black min-h-[300px] flex flex-col">

                {/* Visual Guide (Only when active) */}
                {isCameraReady && !scanResult && !isProcessing && (
                    <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                        <div className="w-[85%] h-[160px] border-2 border-red-500 rounded-lg shadow-[0_0_0_100vh_rgba(0,0,0,0.5)]">
                            {/* Corner Markers */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-red-500 -mt-1 -ml-1"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-red-500 -mt-1 -mr-1"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-red-500 -mb-1 -ml-1"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-red-500 -mb-1 -mr-1"></div>
                        </div>
                        <div className="absolute text-white text-xs font-bold top-[65%] bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                            Snap Photo of Barcode
                        </div>
                    </div>
                )}

                {/* Processing Overlay */}
                {isProcessing && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm text-white">
                        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="font-bold text-lg animate-pulse">Processing...</p>
                        <p className="text-sm text-gray-300 mt-2">
                            {processingMethod === 'local' ? 'Checking Image...' : 'Analyzing with AI...'}
                        </p>
                    </div>
                )}

                {/* Scanner Element (Video) */}
                <div id={regionId} className="w-full h-full flex-grow bg-black" />

                {/* Start Button Overlay */}
                {!isCameraReady && !scanResult && !isProcessing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 z-10">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <button
                            onClick={startCamera}
                            className="bg-forest hover:bg-forest/90 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform active:scale-95 flex items-center gap-2"
                        >
                            <span>Start Camera</span>
                        </button>
                    </div>
                )}

                {/* Success Overlay */}
                {scanResult && (
                    <div className="absolute inset-0 z-20 bg-white flex flex-col items-center justify-center p-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-[bounce_1s_infinite]">
                            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Barcode Found!</h2>
                        <p className="text-3xl font-mono text-forest font-bold mb-8 tracking-wider">{scanResult}</p>
                        <button
                            onClick={() => { setScanResult(null); startCamera(); }}
                            className="w-full bg-forest text-white font-bold py-4 rounded-xl shadow-lg hover:bg-forest/90 transition-all transform active:scale-98"
                        >
                            Scan Another Book
                        </button>
                    </div>
                )}
            </div>

            {/* Manual SNAP Button */}
            {isCameraReady && !scanResult && !isProcessing && (
                <div className="p-6 bg-gray-900 border-t border-gray-800 flex justify-center">
                    <button
                        onClick={captureAndScan}
                        className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-red-600 hover:bg-red-500 active:scale-90 transition-all shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                        aria-label="Capture and Scan"
                    >
                        <div className="w-16 h-16 rounded-full bg-white/20"></div>
                    </button>
                    <p className="absolute bottom-2 text-gray-500 text-xs mt-2">Tap to Scan</p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-50 border-t border-red-100 text-red-700 text-center text-sm font-medium animate-pulse">
                    ⚠️ {error}
                </div>
            )}
        </div>
    );
};

export default BarcodeScanner;
