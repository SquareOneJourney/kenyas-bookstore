import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess }) => {
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [error, setError] = useState<string>('');

    const regionId = "html5qr-code-capture-region";
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    // Get available cameras
    useEffect(() => {
        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length) {
                // Fix: map the Html5Qrcode result correctly
                // The library returns objects with { id, label }
                const formattedDevices = devices.map(d => ({
                    deviceId: d.id,
                    label: d.label
                })) as unknown as MediaDeviceInfo[];

                setCameras(formattedDevices);

                // Prioritize back camera ("environment")
                const backCamera = devices.find(device =>
                    device.label.toLowerCase().includes('back') ||
                    device.label.toLowerCase().includes('environment') ||
                    device.label.toLowerCase().includes('rear')
                );

                // Set default to back camera if found, else first available
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

    // Start the camera stream (Viewfinder only, no continuous scanning)
    const startCamera = useCallback(async () => {
        if (!selectedCameraId) return;

        // If instance exists, stop it first
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
            // We start the scanner but with a config that DOESN'T auto-scan essentially
            // We are just using it to get the video feed up and accessible
            // Actually, for "Capture" mode, we can just use native video, 
            // but Html5Qrcode helps manage the camera selection nicely.

            // Note: We are using a dummy qr callback because we don't want continuous results
            // We want to trigger it manually.
            await scanner.start(
                selectedCameraId,
                {
                    fps: 10, // Lower FPS for viewfinder is fine
                    qrbox: { width: 300, height: 150 },
                    aspectRatio: 1.333334,
                    videoConstraints: {
                        width: { min: 1280, ideal: 1920 }, // High res
                        height: { min: 720, ideal: 1080 },
                        focusMode: "continuous"
                    }
                },
                (decodedText) => {
                    // If it accidentally works, great!
                    handleScanSuccess(decodedText);
                },
                () => { } // Ignore errors
            );

            setIsCameraReady(true);
            setError('');
        } catch (err) {
            console.error("Error starting camera", err);
            setError("Could not start camera. Please check permissions.");
        }
    }, [selectedCameraId]);

    const handleScanSuccess = (text: string) => {
        setScanResult(text);

        // Beep
        const audio = new AudioContext();
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, audio.currentTime + 0.1);

        onScanSuccess(text);

        // Optional: Stop after success
        // stopCamera();
    };

    // The Magic: Manual Capture & Scan
    const captureAndScan = async () => {
        if (!scannerRef.current || isProcessing) return;

        setIsProcessing(true);
        setError('');

        try {
            // Use the internal checking of the library itself on the current video frame
            // This forces a "try to decode NOW" on the current high-res frame

            // Since there isn't a direct "scanCurrentFrame" public API in v2 that returns a promise efficiently,
            // we will grab the video element from the DOM (which Html5Qrcode manages)
            const videoElement = document.querySelector(`#${regionId} video`) as HTMLVideoElement;

            if (!videoElement) {
                throw new Error("Video stream not found");
            }

            // Create a high-res canvas capture
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

            // Convert to blob/file
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    setIsProcessing(false);
                    return;
                }

                // IMPORTANT: We must STOP the camera scan before starting the file scan
                // html5-qrcode doesn't allow two scan processes at once
                if (scannerRef.current?.isScanning) {
                    await scannerRef.current.stop();
                    setIsCameraReady(false);
                }

                const file = new File([blob], "capture.jpg", { type: "image/jpeg" });

                // Scan the captured file
                try {
                    const result = await scannerRef.current!.scanFileV2(file, true);
                    if (result && result.decodedText) {
                        handleScanSuccess(result.decodedText);
                    }
                } catch (scanErr) {
                    console.log("Scan failed for this frame", scanErr);
                    setError("Could not read barcode. Try again.");
                    // Restart camera if failed so user can try again
                    startCamera();
                } finally {
                    setIsProcessing(false);
                }
            }, 'image/jpeg', 0.95);

        } catch (err) {
            console.error(err);
            setIsProcessing(false);
        }
    };

    const stopCamera = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
                setIsCameraReady(false);
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Barcode Scanner</h3>

                {cameras.length > 0 && !isCameraReady && (
                    <select
                        className="p-2 border border-gray-300 rounded-lg text-sm max-w-[200px]"
                        value={selectedCameraId}
                        onChange={(e) => setSelectedCameraId(e.target.value)}
                    >
                        {cameras.map((cam: any) => (
                            <option key={cam.deviceId || cam.id} value={cam.deviceId || cam.id}>
                                {cam.label ? (cam.label.length > 25 ? cam.label.slice(0, 25) + '...' : cam.label) : `Camera ${cam.deviceId?.slice(0, 5)}`}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Viewfinder Area */}
            <div className="relative bg-black min-h-[300px] flex flex-col">
                {/* Visual Guide Overlay */}
                {isCameraReady && !scanResult && (
                    <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                        <div className="w-[80%] h-[150px] border-2 border-red-500 rounded-lg opacity-70 shadow-[0_0_0_100vh_rgba(0,0,0,0.5)]"></div>
                        <div className="absolute text-white text-xs font-bold top-[60%] bg-black/50 px-2 py-1 rounded">
                            Place Barcode Here
                        </div>
                    </div>
                )}

                {/* The Scanner Div */}
                <div id={regionId} className="w-full h-full flex-grow" />

                {/* Start / Placeholder State */}
                {!isCameraReady && !scanResult && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 z-10">
                        <svg className="w-16 h-16 mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        </svg>
                        <button
                            onClick={startCamera}
                            disabled={!selectedCameraId}
                            className="bg-forest hover:bg-forest/90 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform active:scale-95"
                        >
                            Start Camera
                        </button>
                    </div>
                )}

                {/* Success State */}
                {scanResult && (
                    <div className="absolute inset-0 z-20 bg-white flex flex-col items-center justify-center p-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Scanned!</h2>
                        <p className="text-3xl font-mono text-forest font-bold mb-8">{scanResult}</p>
                        <button
                            onClick={() => { setScanResult(null); }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-8 rounded-lg"
                        >
                            Scan Another
                        </button>
                    </div>
                )}
            </div>

            {/* Footer Controls */}
            {isCameraReady && !scanResult && (
                <div className="p-4 bg-gray-900 border-t border-gray-800 flex justify-center gap-4">
                    <button
                        onClick={captureAndScan}
                        disabled={isProcessing}
                        className={`
                            flex-1 max-w-xs py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all
                            flex items-center justify-center gap-2
                            ${isProcessing ? 'bg-gray-600 cursor-wait' : 'bg-red-600 hover:bg-red-500 active:scale-95'}
                        `}
                    >
                        {isProcessing ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Processing...
                            </>
                        ) : (
                            <>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                                SNAP & SCAN
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-100 text-red-700 text-center text-sm font-medium">
                    {error}
                </div>
            )}
        </div>
    );
};

export default BarcodeScanner;
