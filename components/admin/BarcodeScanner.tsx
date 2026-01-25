import React, { useRef, useState, useCallback } from 'react';
import Quagga from '@ericblade/quagga2';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
    onScanSuccess,
    onScanFailure,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [mode, setMode] = useState<'upload' | 'camera'>('upload');
    const [cameraReady, setCameraReady] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const [scanCount, setScanCount] = useState(0);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string>('');

    // Validate ISBN format
    const isValidISBN = (code: string): boolean => {
        const clean = code.replace(/[-\s]/g, '');
        if (/^97[89]\d{10}$/.test(clean)) return true;
        if (/^\d{9}[\dXx]$/.test(clean)) return true;
        if (/^\d{13}$/.test(clean)) return true;
        if (/^\d{12}$/.test(clean)) return true;
        return false;
    };

    // Decode barcode from image
    const decodeImage = useCallback(async (imageDataUrl: string): Promise<void> => {
        setProcessing(true);
        setError(null);
        setDebugInfo('Processing image...');

        try {
            const result = await new Promise<any>((resolve, reject) => {
                Quagga.decodeSingle({
                    src: imageDataUrl,
                    numOfWorkers: 0,
                    decoder: {
                        readers: [
                            "ean_reader",
                            "ean_8_reader",
                            "upc_reader",
                            "code_128_reader",
                            "code_39_reader",
                        ],
                        multiple: false
                    },
                    locate: true,
                    locator: {
                        patchSize: "large",
                        halfSample: false
                    }
                }, (result) => {
                    if (result && result.codeResult && result.codeResult.code) {
                        resolve(result);
                    } else {
                        reject(new Error("No barcode detected in image"));
                    }
                });
            });

            const code = result.codeResult.code;
            const format = result.codeResult.format;

            console.log(`📸 Decoded: ${code} (${format})`);

            if (!isValidISBN(code)) {
                setError(`Detected "${code}" but it doesn't look like a valid ISBN. Try again with a clearer photo.`);
                setDebugInfo(`Invalid format: ${format}`);
                setProcessing(false);
                return;
            }

            // SUCCESS!
            console.log(`✅ Valid ISBN: ${code}`);
            setLastScanned(code);
            setScanCount(prev => prev + 1);
            setDebugInfo(`Success! ISBN: ${code}`);
            setPreviewImage(null);

            // Play beep
            try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 1500;
                gain.gain.value = 0.3;
                osc.start();
                setTimeout(() => { osc.stop(); ctx.close(); }, 150);
            } catch (e) { }

            onScanSuccess(code);

        } catch (err: any) {
            console.error("Decode error:", err);
            setError("No barcode found in image. Make sure the barcode is clear, well-lit, and fully visible.");
            setDebugInfo('Try a different photo');
        } finally {
            setProcessing(false);
        }
    }, [onScanSuccess]);

    // Handle file upload
    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const imageDataUrl = event.target?.result as string;
            setPreviewImage(imageDataUrl);
            await decodeImage(imageDataUrl);
        };
        reader.readAsDataURL(file);

        // Reset input so same file can be selected again
        e.target.value = '';
    }, [decodeImage]);

    // Start camera
    const startCamera = useCallback(async () => {
        setMode('camera');
        setCameraReady(false);
        setError(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setCameraReady(true);
                setDebugInfo('Camera ready - position barcode and tap Capture');
            }
        } catch (err: any) {
            setError("Camera access denied. Please allow camera permission.");
            setMode('upload');
        }
    }, []);

    // Stop camera
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setCameraReady(false);
        setMode('upload');
    }, []);

    // Capture from camera
    const captureFromCamera = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || processing) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageDataUrl = canvas.toDataURL('image/png');
        setPreviewImage(imageDataUrl);

        // Stop camera after capture
        stopCamera();

        // Process the image
        await decodeImage(imageDataUrl);
    }, [processing, decodeImage, stopCamera]);

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const clearPreview = () => {
        setPreviewImage(null);
        setError(null);
        setDebugInfo('');
    };

    return (
        <div className="w-full max-w-lg mx-auto">
            {/* Last scanned banner */}
            {lastScanned && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-green-600">
                                Last Scanned ISBN ({scanCount} total)
                            </p>
                            <p className="text-2xl font-mono font-bold text-green-700">{lastScanned}</p>
                        </div>
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}

            {/* Main content area */}
            <div className="bg-gray-100 rounded-2xl p-6 border border-gray-200">
                {/* Camera mode */}
                {mode === 'camera' && (
                    <div className="relative">
                        <video
                            ref={videoRef}
                            className="w-full rounded-xl bg-black"
                            style={{ minHeight: '280px' }}
                            playsInline
                            muted
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Camera overlay */}
                        {cameraReady && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-8 border-2 border-white/50 rounded-lg">
                                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-20 border-2 border-green-400 rounded bg-green-400/10" />
                                </div>
                            </div>
                        )}

                        {/* Camera controls */}
                        <div className="mt-4 flex gap-3">
                            <button
                                onClick={captureFromCamera}
                                disabled={!cameraReady || processing}
                                className="flex-1 py-4 bg-forest text-white font-bold rounded-xl hover:bg-forest/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {processing ? 'Processing...' : 'Capture Photo'}
                            </button>
                            <button
                                onClick={stopCamera}
                                className="px-4 py-4 bg-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-400 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Upload mode */}
                {mode === 'upload' && !previewImage && (
                    <div className="space-y-4">
                        {/* Upload option */}
                        <button
                            onClick={triggerFileInput}
                            className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-forest hover:bg-forest/5 transition-all group"
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center group-hover:bg-forest/20 transition-colors">
                                    <svg className="w-8 h-8 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-gray-700">Upload Barcode Photo</p>
                                    <p className="text-sm text-gray-500">Take a photo with your phone, then upload it</p>
                                </div>
                            </div>
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileUpload}
                            className="hidden"
                        />

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-3 bg-gray-100 text-sm text-gray-500">or</span>
                            </div>
                        </div>

                        {/* Camera option */}
                        <button
                            onClick={startCamera}
                            className="w-full py-4 bg-white border-2 border-gray-300 rounded-xl hover:border-forest hover:bg-forest/5 transition-all flex items-center justify-center gap-3"
                        >
                            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span className="font-bold text-gray-700">Use Webcam</span>
                        </button>
                    </div>
                )}

                {/* Preview uploaded image */}
                {mode === 'upload' && previewImage && (
                    <div className="space-y-4">
                        <div className="relative">
                            <img
                                src={previewImage}
                                alt="Barcode preview"
                                className="w-full rounded-xl"
                            />
                            {processing && (
                                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                                    <div className="bg-white rounded-xl px-6 py-4 flex items-center gap-3">
                                        <div className="w-6 h-6 border-3 border-forest border-t-transparent rounded-full animate-spin" />
                                        <span className="font-bold text-gray-700">Processing...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {!processing && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => decodeImage(previewImage)}
                                    className="flex-1 py-3 bg-forest text-white font-bold rounded-xl hover:bg-forest/90"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={clearPreview}
                                    className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300"
                                >
                                    New Photo
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Error display */}
            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Debug info */}
            {debugInfo && (
                <p className="mt-2 text-xs text-gray-500 text-center">{debugInfo}</p>
            )}

            {/* Tips */}
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800 font-bold mb-2">📷 For best results:</p>
                <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                    <li>Take a <strong>close-up photo</strong> of the ISBN barcode</li>
                    <li>Make sure the barcode is <strong>sharp and in focus</strong></li>
                    <li>Ensure <strong>good lighting</strong> without glare</li>
                    <li>The barcode should fill most of the photo</li>
                </ul>
            </div>
        </div>
    );
};

export default BarcodeScanner;
