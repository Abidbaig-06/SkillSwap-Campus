import React, { useState, useEffect } from 'react';

/**
 * Universal Avatar image component that safely displays profile photos,
 * automatically falling back to the default campus silhouette if the image
 * is missing, invalid, or fails to load.
 */
export default function AvatarImage({
  src,
  alt = 'Student avatar',
  className = 'avatar',
  style = {},
  size = 40,
  fallback = './avatars/default_avatar.svg',
  onClick = undefined
}) {
  const [currentSrc, setCurrentSrc] = useState(src || fallback);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(src || fallback);
    setHasError(false);
  }, [src, fallback]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(fallback);
    }
  };

  const dimension = typeof size === 'number' ? `${size}px` : size;

  return (
    <img
      src={hasError || !currentSrc ? fallback : currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      onClick={onClick}
      style={{
        width: dimension,
        height: dimension,
        borderRadius: '50%',
        objectFit: 'cover',
        display: 'inline-block',
        backgroundColor: '#F3F4F6',
        ...style
      }}
    />
  );
}

