import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  Trash2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  X,
  Check,
  SwitchCamera,
  Loader2,
  AlertCircle
} from 'lucide-react';
import AvatarImage from './AvatarImage';

/**
 * Modern profile photo picker supporting:
 * - Live camera opening with viewfinder and instant capture
 * - Resilient progressive camera constraints (ideal user facingMode -> basic video device fallback)
 * - Multi-camera detection and switching (front/rear flip)
 * - Mobile front-facing camera intent via capture="user" and accept="image/*"
 * - Device gallery / desktop file picker via standard file upload
 * - Interactive square crop modal with touch/pointer dragging and zoom slider
 * - High-resolution 400x400 JPEG compression (~40-70KB)
 * - Circular preview without distortion
 * - Informative error feedback with direct file camera & upload fallback actions
 */
export default function ProfilePhotoPicker({
  photo, // Current photo URL or data URL
  onPhotoChange, // Callback: (dataUrl) => void
  onPhotoRemove, // Callback: () => void
  disabled = false,
  isDemo = false,
  label = 'Profile Photo'
}) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const videoRef = useRef(null);

  // Live Camera state
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState('user'); // 'user' or 'environment'
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Crop modal state
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [imageObject, setImageObject] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Error feedback state
  const [errorMessage, setErrorMessage] = useState('');
  const [errorActionType, setErrorActionType] = useState(null); // 'file-camera' | 'upload' | null
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const VIEWPORT_SIZE = 260; // Size of square cropping box on screen

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Synchronize stream with video element whenever stream changes
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((err) => {
        console.warn('[ProfilePhotoPicker] Video auto-play error:', err);
      });
    }
  }, [cameraStream]);

  // Callback ref for mounting video element
  const setVideoRef = useCallback((element) => {
    videoRef.current = element;
    if (element && cameraStream) {
      element.srcObject = cameraStream;
      element.play().catch((err) => {
        console.warn('[ProfilePhotoPicker] Video element play error:', err);
      });
    }
  }, [cameraStream]);

  // Stop active camera stream tracks
  const stopCameraStream = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoReady(false);
  }, [cameraStream]);

  const closeLiveCamera = useCallback(() => {
    stopCameraStream();
    setIsLiveCameraOpen(false);
  }, [stopCameraStream]);

  // Check if multiple video cameras exist on device
  const updateAvailableCameras = async () => {
    try {
      if (navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function') {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      }
    } catch (err) {
      console.warn('[ProfilePhotoPicker] Could not enumerate devices:', err);
    }
  };

  /**
   * Progressive camera constraints:
   * 1. Try ideal facingMode with ideal HD resolution
   * 2. Try ideal facingMode without resolution restrictions
   * 3. Fallback to basic video: true (universal support for desktop webcams)
   */
  const requestCameraStream = async (facing = 'user') => {
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      const err = new Error('Camera streaming is not supported on this browser/origin.');
      err.name = 'NotSupportedError';
      throw err;
    }

    // Tier 1: Ideal facingMode and ideal HD dimensions
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
    } catch (err1) {
      console.warn('[ProfilePhotoPicker] Tier 1 constraint failed:', err1?.name || err1);
    }

    // Tier 2: Ideal facingMode without dimension constraints
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing }
        },
        audio: false
      });
    } catch (err2) {
      console.warn('[ProfilePhotoPicker] Tier 2 constraint failed:', err2?.name || err2);
    }

    // Tier 3: Universal fallback - any active video device (essential for desktop USB webcams)
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });
  };

  /**
   * Primary camera handler:
   * Opens live in-browser camera stream if supported and authorized;
   * gracefully falls back to native camera input (capture="user") if unavailable.
   */
  const handleOpenCamera = async () => {
    setErrorMessage('');
    setErrorActionType(null);
    setIsOptionsOpen(false);

    if (disabled || isDemo) return;

    // Check if live camera stream is supported in current context
    const isLiveSupported = Boolean(
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    );

    if (!isLiveSupported) {
      // Non-secure HTTP origin or unsupported browser:
      // Synchronously trigger native file camera capture so user gesture is preserved
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
        return;
      }
      setErrorMessage('Camera is not supported in this browser environment. Please select a photo from your files.');
      setErrorActionType('upload');
      return;
    }

    try {
      setIsStartingCamera(true);
      const stream = await requestCameraStream(cameraFacingMode);
      setCameraStream(stream);
      setIsLiveCameraOpen(true);
      setIsStartingCamera(false);
      updateAvailableCameras();
    } catch (err) {
      console.warn('[ProfilePhotoPicker] getUserMedia error:', err);
      setIsStartingCamera(false);
      setIsLiveCameraOpen(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was blocked by your browser. Please allow camera permissions in your address bar, or use the file camera option below.');
        setErrorActionType('file-camera');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device was found on this system. You can upload a photo or use your file camera below.');
        setErrorActionType('upload');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMessage('The camera is currently in use by another program or tab. Please close other camera applications and try again.');
        setErrorActionType('file-camera');
      } else {
        setErrorMessage(`Unable to access camera (${err.message || err.name || 'Error'}). You can select a photo from your files or try the file camera below.`);
        setErrorActionType('file-camera');
      }
    }
  };

  // Switch between front (user) and rear (environment) cameras
  const handleFlipCamera = async () => {
    const nextFacing = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(nextFacing);
    setIsVideoReady(false);

    // Stop current stream tracks
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }

    try {
      const newStream = await requestCameraStream(nextFacing);
      setCameraStream(newStream);
    } catch (err) {
      console.warn('[ProfilePhotoPicker] Flip camera failed, falling back:', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setCameraStream(fallbackStream);
      } catch (err2) {
        console.error('[ProfilePhotoPicker] Could not restart camera stream:', err2);
        closeLiveCamera();
        setErrorMessage('Could not switch camera device. Please try again.');
        setErrorActionType('file-camera');
      }
    }
  };

  // Capture snapshot from the live camera stream
  const handleCaptureLivePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setErrorMessage('Camera video feed is not ready yet. Please wait a moment.');
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // If using user (front) camera, mirror horizontally so selfie matches what user saw in viewfinder
    if (cameraFacingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    closeLiveCamera();

    // Load captured photo into crop modal
    const img = new Image();
    img.onload = () => {
      setImageObject(img);
      setRawImageSrc(dataUrl);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsCropOpen(true);
    };
    img.onerror = () => {
      setErrorMessage('Failed to process captured image.');
    };
    img.src = dataUrl;
  };

  // Handle file chosen from native camera capture or gallery
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    setErrorMessage('');
    setErrorActionType(null);

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please choose a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('The chosen photo is too large (max 15MB). Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setErrorMessage('Failed to read image file. Please try another photo.');
    };
    reader.onload = () => {
      const src = reader.result;
      const img = new Image();
      img.onload = () => {
        setImageObject(img);
        setRawImageSrc(src);
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setIsCropOpen(true);
        setIsOptionsOpen(false);
      };
      img.onerror = () => {
        setErrorMessage('Could not load image. The file may be corrupted.');
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = () => {
    setErrorMessage('');
    setErrorActionType(null);
    galleryInputRef.current?.click();
  };

  const handleRemovePhoto = () => {
    if (disabled || isDemo) return;
    setErrorMessage('');
    setErrorActionType(null);
    setIsOptionsOpen(false);
    if (onPhotoRemove) {
      onPhotoRemove();
    }
  };

  // Base scale ensures the smaller dimension fills the viewport (cover fit)
  const getBaseScale = useCallback(() => {
    if (!imageObject) return 1;
    return Math.max(
      VIEWPORT_SIZE / imageObject.naturalWidth,
      VIEWPORT_SIZE / imageObject.naturalHeight
    );
  }, [imageObject]);

  const currentScale = getBaseScale() * zoom;

  // Pointer/Touch Drag handlers for panning
  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !imageObject) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    const maxPanX = Math.max(0, (imageObject.naturalWidth * currentScale - VIEWPORT_SIZE) / 2);
    const maxPanY = Math.max(0, (imageObject.naturalHeight * currentScale - VIEWPORT_SIZE) / 2);

    const nextX = Math.min(maxPanX, Math.max(-maxPanX, dragStartRef.current.panX + deltaX));
    const nextY = Math.min(maxPanY, Math.max(-maxPanY, dragStartRef.current.panY + deltaY));

    setPan({ x: nextX, y: nextY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Execute high-quality canvas crop and export compressed JPEG
  const handleConfirmCrop = () => {
    if (!imageObject) return;

    try {
      const OUTPUT_SIZE = 400; // Crisp, optimized 400x400 profile resolution
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill background with white in case of transparent PNG/WebP
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      const ratio = OUTPUT_SIZE / VIEWPORT_SIZE;

      ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
      ctx.translate(pan.x * ratio, pan.y * ratio);
      ctx.scale(currentScale * ratio, currentScale * ratio);

      ctx.drawImage(
        imageObject,
        -imageObject.naturalWidth / 2,
        -imageObject.naturalHeight / 2
      );

      // Compress to high-quality lightweight JPEG (~40KB - 70KB)
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      if (onPhotoChange) {
        onPhotoChange(croppedDataUrl);
      }

      setIsCropOpen(false);
      setRawImageSrc(null);
      setImageObject(null);
    } catch (err) {
      console.error('[ProfilePhotoPicker] Crop error:', err);
      setErrorMessage('Failed to crop photo. Please try again.');
    }
  };

  const handleCancelCrop = () => {
    setIsCropOpen(false);
    setRawImageSrc(null);
    setImageObject(null);
  };

  const hasPhoto = Boolean(
    photo &&
    photo !== './avatars/default_avatar.svg' &&
    photo !== '/avatars/default_avatar.svg' &&
    !photo.endsWith('default_avatar.svg')
  );

  return (
    <div style={{ marginBottom: '22px' }}>
      {/* Scoped CSS animations */}
      <style>{`
        @keyframes photoSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes photoFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Hidden native input for camera: capture="user" opens front-facing camera on mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Hidden native input for gallery / device file picker */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#222222',
            marginBottom: '10px'
          }}
        >
          {label}
        </label>
      )}

      {/* Main Avatar Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          flexWrap: 'wrap',
          padding: '14px 16px',
          borderRadius: '16px',
          backgroundColor: '#F9FAFB',
          border: '1px solid rgba(0, 0, 0, 0.08)'
        }}
      >
        {/* Circular Preview */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <AvatarImage
            src={photo}
            alt="Profile preview"
            size={68}
            style={{
              border: hasPhoto ? '2.5px solid #111111' : '2px dashed #9CA3AF',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
            }}
          />
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '220px' }}>
          {!hasPhoto ? (
            /* No photo selected: show Camera & Upload Photo */
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleOpenCamera}
                disabled={disabled || isDemo || isStartingCamera}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB'
                }}
              >
                {isStartingCamera ? (
                  <>
                    <Loader2 size={15} style={{ animation: 'photoSpin 1s linear infinite' }} />
                    Opening Camera...
                  </>
                ) : (
                  <>
                    <Camera size={15} />
                    Camera
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleUploadPhoto}
                disabled={disabled || isDemo}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB'
                }}
              >
                <Upload size={15} />
                Upload Photo
              </button>
            </div>
          ) : (
            /* Photo selected: show Change & Remove buttons */
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsOptionsOpen((prev) => !prev)}
                  disabled={disabled || isDemo}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D1D5DB'
                  }}
                >
                  <RefreshCw size={13} />
                  Change
                </button>

                {isOptionsOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '6px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '10px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                      border: '1px solid #E5E7EB',
                      zIndex: 30,
                      minWidth: '150px',
                      padding: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsOptionsOpen(false);
                        handleOpenCamera();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        textAlign: 'left',
                        color: '#111111'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Camera size={14} />
                      Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOptionsOpen(false);
                        handleUploadPhoto();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        textAlign: 'left',
                        color: '#111111'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Upload size={14} />
                      Upload Photo
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={disabled || isDemo}
                className="btn btn-ghost btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#DC2626'
                }}
              >
                <Trash2 size={14} />
                Remove
              </button>
            </div>
          )}

          <p style={{ margin: 0, fontSize: '0.74rem', color: '#6B7280' }}>
            {hasPhoto
              ? 'Photo selected. You can reposition or change it anytime.'
              : 'Add a real student photo so peers recognize you, or skip to use default silhouette.'}
          </p>
        </div>
      </div>

      {/* Informative Inline Error Feedback with Clickable Fallback Actions */}
      {errorMessage && (
        <div
          style={{
            marginTop: '10px',
            padding: '10px 14px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '10px',
            color: '#991B1B',
            fontSize: '0.8rem',
            lineHeight: 1.4
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: errorActionType ? '8px' : 0 }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#DC2626' }} />
            <span style={{ flex: 1, fontWeight: 500 }}>{errorMessage}</span>
            <button
              type="button"
              onClick={() => {
                setErrorMessage('');
                setErrorActionType(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#9CA3AF',
                cursor: 'pointer',
                padding: '0 2px'
              }}
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>

          {errorActionType && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setErrorActionType(null);
                  cameraInputRef.current?.click();
                }}
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: '0.75rem',
                  padding: '5px 11px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #DC2626',
                  color: '#991B1B',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Camera size={13} />
                Try File Camera
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setErrorActionType(null);
                  galleryInputRef.current?.click();
                }}
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: '0.75rem',
                  padding: '5px 11px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  color: '#374151',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Upload size={13} />
                Upload Photo Instead
              </button>
            </div>
          )}
        </div>
      )}

      {/* LIVE CAMERA MODAL */}
      {isLiveCameraOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLiveCamera();
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '420px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'photoFadeIn 0.15s ease-out'
            }}
          >
            {/* Header */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#111111' }}>
                  Camera
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {hasMultipleCameras && (
                  <button
                    type="button"
                    onClick={handleFlipCamera}
                    className="btn btn-secondary btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 9px',
                      fontSize: '0.76rem',
                      fontWeight: 600
                    }}
                    title="Switch front / rear camera"
                  >
                    <SwitchCamera size={14} />
                    Flip
                  </button>
                )}

                <button
                  type="button"
                  onClick={closeLiveCamera}
                  className="btn-ghost"
                  style={{
                    padding: '4px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6B7280'
                  }}
                  aria-label="Close camera"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Live Video Viewfinder with Circular Guide */}
            <div
              style={{
                width: '100%',
                maxWidth: '320px',
                height: '320px',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '20px',
                backgroundColor: '#000000',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <video
                ref={setVideoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => {
                  setIsVideoReady(true);
                  e.currentTarget.play().catch((err) => {
                    console.warn('[ProfilePhotoPicker] Video play error:', err);
                  });
                }}
                onCanPlay={() => setIsVideoReady(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: cameraFacingMode === 'user' ? 'scaleX(-1)' : 'none',
                  opacity: isVideoReady ? 1 : 0,
                  transition: 'opacity 0.2s ease-in'
                }}
              />

              {/* Loading spinner while stream initializes */}
              {!isVideoReady && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    color: '#FFFFFF',
                    backgroundColor: '#111111'
                  }}
                >
                  <Loader2
                    size={28}
                    style={{
                      animation: 'photoSpin 1s linear infinite'
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#D1D5DB' }}>Connecting camera...</span>
                </div>
              )}

              {/* Circular framing guide */}
              <div
                style={{
                  position: 'absolute',
                  inset: '20px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 255, 255, 0.85)',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                  pointerEvents: 'none'
                }}
              />
            </div>

            <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '14px 0 18px 0', textAlign: 'center' }}>
              Center your face inside the circle and click Snap Photo
            </p>

            {/* Shutter & Cancel buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={closeLiveCamera}
                className="btn btn-secondary btn-sm"
                style={{ minWidth: '90px' }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCaptureLivePhoto}
                disabled={!isVideoReady}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  opacity: isVideoReady ? 1 : 0.6,
                  cursor: isVideoReady ? 'pointer' : 'not-allowed'
                }}
              >
                <Camera size={18} />
                Snap Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE SQUARE CROP MODAL */}
      {isCropOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancelCrop();
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '380px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              animation: 'photoFadeIn 0.15s ease-out'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#111111' }}>
                Crop Profile Photo
              </h3>
              <button
                type="button"
                onClick={handleCancelCrop}
                className="btn-ghost"
                style={{
                  padding: '4px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6B7280'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Cropping Viewport with Circular Mask */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{
                width: `${VIEWPORT_SIZE}px`,
                height: `${VIEWPORT_SIZE}px`,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '16px',
                backgroundColor: '#111111',
                touchAction: 'none', // Prevents page scrolling on mobile swipe
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)'
              }}
            >
              {/* Scaled and Panned Image */}
              {imageObject && (
                <img
                  src={rawImageSrc}
                  alt="Crop preview"
                  draggable={false}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: `${imageObject.naturalWidth}px`,
                    height: `${imageObject.naturalHeight}px`,
                    maxWidth: 'none',
                    maxHeight: 'none',
                    transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${currentScale})`,
                    transformOrigin: 'center center',
                    pointerEvents: 'none'
                  }}
                />
              )}

              {/* Circular Overlay Guide showing the avatar circle */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  borderRadius: '50%',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
                  border: '2px solid rgba(255, 255, 255, 0.9)'
                }}
              />
            </div>

            {/* Instruction Tip */}
            <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '10px 0 14px 0', textAlign: 'center' }}>
              Drag to reposition • Use slider to zoom
            </p>

            {/* Zoom Slider Control */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}
            >
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                disabled={zoom <= 1}
                className="btn-ghost"
                style={{
                  padding: '4px',
                  background: 'none',
                  border: 'none',
                  cursor: zoom > 1 ? 'pointer' : 'default',
                  opacity: zoom > 1 ? 1 : 0.4
                }}
              >
                <ZoomOut size={16} />
              </button>

              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={{
                  flex: 1,
                  accentColor: '#111111',
                  cursor: 'pointer'
                }}
              />

              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                disabled={zoom >= 3}
                className="btn-ghost"
                style={{
                  padding: '4px',
                  background: 'none',
                  border: 'none',
                  cursor: zoom < 3 ? 'pointer' : 'default',
                  opacity: zoom < 3 ? 1 : 0.4
                }}
              >
                <ZoomIn size={16} />
              </button>
            </div>

            {/* Modal Actions */}
            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={handleCancelCrop}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmCrop}
                className="btn btn-primary btn-sm"
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Check size={14} />
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
