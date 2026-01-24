import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
    onScanSuccess,
    onScanFailure,
}) => {
    const scannerId = "html5-qrcode-reader";
    const [cameras, setCameras] = useState<any[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string>('');
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // stable ref for the scanner instance
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        // 1. Initialize the scanner instance on mount
        const initScanner = async () => {
            try {
                // Fetch cameras first
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length > 0) {
                    setCameras(devices);
                    // Default to the last camera (usually the back camera on phones)
                    // or try to find one labeled "back" or "environment"
                    const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
                    setSelectedCameraId(backCamera ? backCamera.id : devices[devices.length - 1].id);
                } else {
                    setError("No cameras found on this device.");
                }

                // Create instance
                if (!html5QrCodeRef.current) {
                    html5QrCodeRef.current = new Html5Qrcode(scannerId, {
                        verbose: false,
                        formatsToSupport: [
                            Html5QrcodeSupportedFormats.EAN_13,
                            Html5QrcodeSupportedFormats.EAN_8,
                            Html5QrcodeSupportedFormats.UPC_A,
                            Html5QrcodeSupportedFormats.UPC_E,
                        ]
                    });
                }
            } catch (err) {
                console.error("Error getting cameras", err);
                setError("Permission denied or no camera found.");
            }
        };

        initScanner();

        // Cleanup on unmount
        return () => {
            if (html5QrCodeRef.current) {
                if (html5QrCodeRef.current.isScanning) {
                    html5QrCodeRef.current.stop().then(() => {
                        html5QrCodeRef.current?.clear();
                    }).catch(err => console.error("Failed to stop scanner on unmount", err));
                } else {
                    html5QrCodeRef.current.clear();
                }
            }
        };
    }, []);

    // Effect to start scanning when simple trigger or camera change happens
    useEffect(() => {
        if (!selectedCameraId || !html5QrCodeRef.current) return;

        const startScanning = async () => {
            try {
                if (html5QrCodeRef.current?.isScanning) {
                    await html5QrCodeRef.current.stop();
                }

                // Extra safety: wait a tick
                await new Promise(r => setTimeout(r, 100));

                if (!html5QrCodeRef.current) return;

                await html5QrCodeRef.current.start(
                    selectedCameraId,
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 150 },
                        aspectRatio: 1.0,
                    },
                    (decodedText) => {
                        // Success
                        onScanSuccess(decodedText);
                        // Optional: Stop after successful scan if you want one-shot
                        // html5QrCodeRef.current?.stop();
                    },
                    (errorMessage) => {
                        // Scan error (common, ignore mostly)
                        if (onScanFailure) onScanFailure(errorMessage);
                    }
                );
                setIsScanning(true);
                setError(null);
            } catch (err) {
                console.error("Failed to start scanner with ID", selectedCameraId, err);
                setError("Failed to start video stream. Please ensure permissions are granted.");
                setIsScanning(false);
            }
        };

        startScanning();

    }, [selectedCameraId]);

    return (
        <div className="w-full max-w-sm mx-auto p-4 bg-white rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-center font-bold text-gray-700 mb-2">Scan Barcode</h3>

            <div
                id={scannerId}
                className="w-full h-64 bg-black overflow-hidden rounded-lg mb-4"
                style={{ minHeight: '300px' }}
            ></div>

            {error && (
                <div className="p-3 mb-4 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                    {error}
                </div>
            )}

            {cameras.length > 1 && (
                <div className="flex justify-center">
                    <select
                        value={selectedCameraId}
                        onChange={(e) => setSelectedCameraId(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700"
                    >
                        {cameras.map(cam => (
                            <option key={cam.id} value={cam.id}>
                                {cam.label || `Camera ${cam.id.substr(0, 5)}...`}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="text-center mt-2">
                <p className="text-xs text-gray-400 uppercase tracking-widest">
                    {isScanning ? "Scanning Active" : "Initializing..."}
                </p>
            </div>
        </div>
    );
};

export default BarcodeScanner;
