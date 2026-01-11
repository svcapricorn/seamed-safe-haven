// SeaMed Tracker - Object Scanner Component
// Uses device camera to capture and identify medical supplies

import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Flashlight, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ItemCategory, CATEGORY_INFO } from '@/types';

interface ObjectScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onIdentify: (result: ObjectScanResult) => void;
}

export interface ObjectScanResult {
  name: string;
  category: ItemCategory;
  confidence: number;
}

// Common medical supply patterns for identification
const MEDICAL_SUPPLY_PATTERNS: { keywords: string[]; name: string; category: ItemCategory }[] = [
  { keywords: ['bandage', 'band-aid', 'plaster', 'adhesive'], name: 'Adhesive Bandages', category: 'first-aid' },
  { keywords: ['gauze', 'pad', 'dressing'], name: 'Gauze Pads', category: 'first-aid' },
  { keywords: ['tape', 'medical tape', 'surgical tape'], name: 'Medical Tape', category: 'first-aid' },
  { keywords: ['scissors', 'shears'], name: 'Medical Scissors', category: 'tools' },
  { keywords: ['tweezers', 'forceps'], name: 'Tweezers', category: 'tools' },
  { keywords: ['thermometer'], name: 'Thermometer', category: 'diagnostic' },
  { keywords: ['stethoscope'], name: 'Stethoscope', category: 'diagnostic' },
  { keywords: ['syringe', 'needle'], name: 'Syringes', category: 'tools' },
  { keywords: ['ibuprofen', 'advil', 'motrin'], name: 'Ibuprofen', category: 'medications' },
  { keywords: ['aspirin', 'bayer'], name: 'Aspirin', category: 'medications' },
  { keywords: ['acetaminophen', 'tylenol', 'paracetamol'], name: 'Acetaminophen', category: 'medications' },
  { keywords: ['antibiotic', 'neosporin', 'polysporin'], name: 'Antibiotic Ointment', category: 'medications' },
  { keywords: ['antiseptic', 'betadine', 'iodine'], name: 'Antiseptic Solution', category: 'medications' },
  { keywords: ['gloves', 'latex', 'nitrile'], name: 'Medical Gloves', category: 'ppe' },
  { keywords: ['mask', 'face mask', 'surgical mask'], name: 'Face Masks', category: 'ppe' },
  { keywords: ['splint'], name: 'Splint', category: 'first-aid' },
  { keywords: ['tourniquet'], name: 'Tourniquet', category: 'first-aid' },
  { keywords: ['cold pack', 'ice pack'], name: 'Cold Pack', category: 'first-aid' },
  { keywords: ['burn', 'burn gel', 'burn cream'], name: 'Burn Treatment', category: 'first-aid' },
  { keywords: ['eye wash', 'saline'], name: 'Eye Wash Solution', category: 'first-aid' },
];

export function ObjectScanner({ isOpen, onClose, onIdentify }: ObjectScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setError(null);
    setCapturedImage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check if torch is available
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      setHasTorch(capabilities?.torch === true);

      setIsInitializing(false);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please check permissions.');
      setIsInitializing(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
      setIsAnalyzing(false);
    }

    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;

    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as any]
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error('Failed to toggle torch:', err);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    analyzeImage(imageData);
  };

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);

    // Simulate AI analysis with pattern matching
    // In a real implementation, this would call an AI vision API
    await new Promise(resolve => setTimeout(resolve, 1500));

    // For demo purposes, randomly select a medical supply
    // In production, use actual image recognition
    const randomIndex = Math.floor(Math.random() * MEDICAL_SUPPLY_PATTERNS.length);
    const identified = MEDICAL_SUPPLY_PATTERNS[randomIndex];

    const result: ObjectScanResult = {
      name: identified.name,
      category: identified.category,
      confidence: 0.75 + Math.random() * 0.2, // 75-95% confidence
    };

    // Vibrate on successful identification
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }

    setIsAnalyzing(false);
    onIdentify(result);
    onClose();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setIsAnalyzing(false);
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
            <span className="text-white font-medium">Identify Item</span>
            {hasTorch && !capturedImage && (
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
            {(!hasTorch || capturedImage) && <div className="w-10" />}
          </div>

          {/* Camera / Captured View */}
          <div className="flex-1 relative flex items-center justify-center p-4">
            {error ? (
              <div className="text-center text-white">
                <Camera className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <p className="mb-4">{error}</p>
                <Button onClick={onClose} variant="outline" className="text-white border-white">
                  Close
                </Button>
              </div>
            ) : capturedImage ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="max-w-full max-h-full rounded-2xl object-contain"
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                    <div className="text-center text-white">
                      <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
                      <p>Identifying item...</p>
                    </div>
                  </div>
                )}
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
                <canvas ref={canvasRef} className="hidden" />

                {/* Viewfinder overlay */}
                {!isInitializing && (
                  <div className="absolute inset-4 pointer-events-none">
                    {/* Center frame */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-secondary/50 rounded-xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-secondary rounded-full" />
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

          {/* Actions */}
          <div className="p-4 space-y-3">
            {capturedImage && !isAnalyzing ? (
              <Button
                onClick={retakePhoto}
                variant="outline"
                className="w-full h-14 text-white border-white hover:bg-white/20"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Retake Photo
              </Button>
            ) : !capturedImage && !isInitializing && (
              <Button
                onClick={captureImage}
                className="w-full h-14 bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                <Camera className="h-5 w-5 mr-2" />
                Capture & Identify
              </Button>
            )}
            <p className="text-white/70 text-sm text-center">
              {capturedImage 
                ? 'Analyzing the captured image...' 
                : 'Point camera at the medical supply item'}
            </p>
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-white/70 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}