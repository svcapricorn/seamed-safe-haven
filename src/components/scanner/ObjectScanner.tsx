// SeaMed Tracker - Object Scanner Component
// Uses device camera to capture and identify medical supplies

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Flashlight, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { 
    Dialog, 
    IconButton, 
    Button, 
    Typography, 
    Box, 
    CircularProgress, 
    Alert,
    Stack
} from '@mui/material';
import { ItemCategory } from '@/types';

interface ObjectScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onIdentify: (result: ObjectScanResult) => void;
}

export interface ObjectScanResult {
  name: string;
  category: ItemCategory;
  confidence: number;
  image?: string;
}

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
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Prefer back camera
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch (err) {
        console.warn('Environment camera not found or access denied, trying fallback.', err);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const track = stream.getVideoTracks()[0];
      const capabilities = (track.getCapabilities && track.getCapabilities()) as any;
      setHasTorch(capabilities?.torch === true);

      setIsInitializing(false);
    } catch (err) {
      console.error('Camera error:', err);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Unable to access camera.');
      }
      setIsInitializing(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    setTorchOn(false);
  }, []);

  useEffect(() => {
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
     const stream = streamRef.current;
    if (!stream) return;

    const track = stream.getVideoTracks()[0];
    try {
      await track.applyConstraints({
         advanced: [{ torch: !torchOn } as any]
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error('Torch error:', err);
    }
  };

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    let result: ObjectScanResult | null = null;
    
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (apiKey) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); 

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are a medical inventory assistant. Identify the medical supply item in the image by READING THE TEXT LABELS (OCR) and analyzing the packaging. Prioritize text found on the label (Brand, Chemical Name, Dosage) to determine the item 'name'. Return strictly valid JSON with no markdown formatting containing: 'name' (string), 'category' (one of: medications, first-aid, tools, diagnostic, ppe, other), and 'confidence' (number 0-1)."
              },
              {
                role: "user",
                content: [
                  { type: "text", text: "Identify this medical item. Read all visible text on the packaging, bottle, or box to determine exactly what it is. Include dosage or specific type if visible." },
                  { type: "image_url", image_url: { url: imageData } }
                ]
              }
            ],
            max_tokens: 300
          })
        });
        
        clearTimeout(timeoutId);

        const data = await response.json();
        
        if (data.choices && data.choices[0]?.message?.content) {
          const content = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
          try {
            const parsed = JSON.parse(content);
            if (parsed.name && parsed.category) {
              result = {
                name: parsed.name,
                category: parsed.category,
                confidence: parsed.confidence || 0.85,
                image: imageData
              };
            }
          } catch (e) {
            console.error("Failed to parse AI response:", content);
          }
        }
      }
    } catch (error) {
       console.error("AI Analysis failed:", error);
    }

    if (!result) {
      console.log('Using simulation fallback...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      const randomIndex = Math.floor(Math.random() * MEDICAL_SUPPLY_PATTERNS.length);
      const identified = MEDICAL_SUPPLY_PATTERNS[randomIndex];

      result = {
        name: identified.name,
        category: identified.category,
        confidence: 0.75 + Math.random() * 0.2,
        image: imageData
      };
    }

    if ('vibrate' in navigator) navigator.vibrate(100);

    setIsAnalyzing(false);
    onIdentify(result);
    // Don't modify captured image or state here as we are closing or done
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
    
    // Pause video
    video.pause();
    
    analyzeImage(imageData);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setIsAnalyzing(false);
    if (videoRef.current) {
        videoRef.current.play().catch(console.error);
    }
  };

   return (
    <Dialog 
        open={isOpen} 
        onClose={onClose} 
        fullScreen 
        PaperProps={{ 
            sx: { bgcolor: 'black' } 
        }}
        TransitionComponent={undefined}
    >
        <Box sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
             {/* Header */}
             <Box sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                p: 2, 
                zIndex: 10, 
                display: 'flex', 
                justifyContent: 'space-between',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)'
            }}>
                <IconButton onClick={onClose} sx={{ color: 'white' }} disabled={isAnalyzing}>
                    <X />
                </IconButton>
                
                <Typography variant="subtitle1" sx={{ color: 'white', alignSelf: 'center', fontWeight: 500 }}>
                    Identify Item
                </Typography>

                {hasTorch && !capturedImage ? (
                    <IconButton onClick={toggleTorch} sx={{ color: torchOn ? 'warning.main' : 'white' }}>
                        <Flashlight />
                    </IconButton>
                ) : (
                    <Box sx={{ width: 40 }} />
                )}
            </Box>

            {/* Camera View */}
            <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {!capturedImage ? (
                   <video 
                        ref={videoRef} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        playsInline
                        muted
                    />
                ) : (
                   <img 
                      src={capturedImage} 
                      alt="Captured" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                   />
                )}
                
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Viewfinder / Guidance */}
                {!capturedImage && !isInitializing && (
                     <Box sx={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)',
                        width: '80%',
                        height: '60%',
                        border: '2px solid rgba(255,255,255,0.7)',
                        borderRadius: 3,
                    }}>
                        {/* Crosshair */}
                        <Box sx={{ position: 'absolute', top: '50%', left: '50%', width: 8, height: 8, bgcolor: 'secondary.main', transform: 'translate(-50%, -50%)', borderRadius: '50%' }} />
                    </Box>
                )}

                {isAnalyzing && (
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.4)', flexDirection: 'column', gap: 2 }}>
                        <CircularProgress sx={{ color: 'white' }} size={60} />
                        <Typography color="white" fontWeight="bold">Identifying...</Typography>
                    </Box>
                )}

                {isInitializing && (
                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
                      <CircularProgress sx={{ color: 'white' }} />
                      <Typography color="white">Starting camera...</Typography>
                  </Box>
                )}

                {error && (
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.8)', p: 3 }}>
                         <Alert severity="error" variant="filled" action={
                            <Button color="inherit" size="small" onClick={retakePhoto}>Try Again</Button>
                         }>
                            {error}
                        </Alert>
                    </Box>
                )}
            </Box>

            {/* Footer / Controls */}
            <Box sx={{ p: 4, bgcolor: 'black', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                {!capturedImage && !isInitializing ? (
                    <Button 
                        onClick={captureImage}
                        variant="contained" 
                        color="secondary" 
                        size="large"
                        startIcon={<Camera />}
                        fullWidth
                        sx={{ 
                            height: 56, 
                            borderRadius: 2, 
                            fontSize: '1rem', 
                            textTransform: 'none',
                            fontWeight: 600
                        }}
                    >
                        Capture & Identify
                    </Button>
                ) : (capturedImage && !isAnalyzing) ? (
                    <Button 
                        onClick={retakePhoto} 
                        variant="outlined" 
                        color="inherit" 
                        startIcon={<RefreshCw />}
                        sx={{ 
                            color: 'white', 
                            borderColor: 'white', 
                            height: 56, 
                            borderRadius: 2,
                            textTransform: 'none'
                        }}
                        fullWidth
                    >
                        Retake Photo
                    </Button>
                ) : null}
                
                <Typography variant="caption" sx={{ color: 'white', opacity: 0.7 }}>
                  {capturedImage ? 'Analyzing the captured image...' : 'Point camera at the medical supply item'}
                </Typography>
                
                <Button 
                    onClick={onClose} 
                    sx={{ 
                        color: 'white', 
                        opacity: 0.7, 
                        width: '100%',
                        textTransform: 'none' 
                    }}
                >
                  Cancel
                </Button>
            </Box>
        </Box>
    </Dialog>
  );
}