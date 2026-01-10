// SeaMed Tracker - Barcode Scanner Component
// Uses device camera to scan barcodes and QR codes

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, AlertCircle, Flashlight } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    setIsInitializing(true);
    setError(null);

    const startScanning = async () => {
      try {
        const videoInputDevices = await reader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
          setError('No camera found on this device');
          setIsInitializing(false);
          return;
        }

        // Prefer back camera
        const backCamera = videoInputDevices.find(
          device => device.label.toLowerCase().includes('back') ||
                    device.label.toLowerCase().includes('rear')
        );
        const deviceId = backCamera?.deviceId || videoInputDevices[0].deviceId;

        await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result, err) => {
            if (result) {
              // Vibrate on successful scan if supported
              if ('vibrate' in navigator) {
                navigator.vibrate(100);
              }
              onScan(result.getText());
              onClose();
            }
            if (err && !(err instanceof NotFoundException)) {
              console.error('Scan error:', err);
            }
          }
        );

        // Check if torch is available
        const stream = videoRef.current?.srcObject as MediaStream;
        if (stream) {
          const track = stream.getVideoTracks()[0];
          const capabilities = track.getCapabilities?.() as any;
          setHasTorch(capabilities?.torch === true);
        }

        setIsInitializing(false);
      } catch (err) {
        console.error('Camera error:', err);
        setError('Unable to access camera. Please check permissions.');
        setIsInitializing(false);
      }
    };

    startScanning();

    return () => {
      reader.reset();
    };
  }, [isOpen, onScan, onClose]);

  const toggleTorch = async () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (!stream) return;

    const track = stream.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as any]
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error('Failed to toggle torch:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="scan-overlay flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
            <span className="text-white font-medium">Scan Barcode</span>
            {hasTorch && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTorch}
                className={cn(
                  'text-white hover:bg-white/20',
                  torchOn && 'bg-white/20'
                )}
              >
                <Flashlight className="h-6 w-6" />
              </Button>
            )}
            {!hasTorch && <div className="w-10" />}
          </div>

          {/* Camera View */}
          <div className="flex-1 relative flex items-center justify-center p-4">
            {error ? (
              <div className="text-center text-white">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <p className="mb-4">{error}</p>
                <Button onClick={onClose} variant="outline" className="text-white border-white">
                  Close
                </Button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className={cn(
                    'max-w-full max-h-full rounded-2xl',
                    isInitializing && 'opacity-0'
                  )}
                  playsInline
                  muted
                />
                
                {/* Scanning overlay */}
                {!isInitializing && (
                  <div className="absolute inset-4 pointer-events-none">
                    {/* Corners */}
                    <div className="absolute top-1/4 left-1/4 w-12 h-12 border-l-4 border-t-4 border-secondary rounded-tl-lg" />
                    <div className="absolute top-1/4 right-1/4 w-12 h-12 border-r-4 border-t-4 border-secondary rounded-tr-lg" />
                    <div className="absolute bottom-1/4 left-1/4 w-12 h-12 border-l-4 border-b-4 border-secondary rounded-bl-lg" />
                    <div className="absolute bottom-1/4 right-1/4 w-12 h-12 border-r-4 border-b-4 border-secondary rounded-br-lg" />
                    
                    {/* Scanning line animation */}
                    <motion.div
                      className="absolute left-1/4 right-1/4 h-0.5 bg-secondary"
                      initial={{ top: '25%' }}
                      animate={{ top: ['25%', '75%', '25%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                )}

                {isInitializing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Camera className="h-12 w-12 mx-auto mb-4 animate-pulse" />
                      <p>Starting camera...</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="p-4 text-center">
            <p className="text-white/70 text-sm">
              Position the barcode within the frame
            </p>
            <Button
              variant="ghost"
              onClick={onClose}
              className="mt-4 text-white/70 hover:text-white"
            >
              Enter manually instead
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
