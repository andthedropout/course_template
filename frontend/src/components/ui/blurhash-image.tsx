import { useEffect, useRef } from 'react';
import { decode } from 'blurhash';

interface BlurhashImageProps {
  blurhash: string;
  width?: number;
  height?: number;
  className?: string;
}

export function BlurhashImage({
  blurhash,
  width = 128,
  height = 72,
  className
}: BlurhashImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !blurhash) return;

    try {
      const pixels = decode(blurhash, width, height);
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const imageData = ctx.createImageData(width, height);
      imageData.data.set(pixels);
      ctx.putImageData(imageData, 0, 0);
    } catch (error) {
      console.error('Failed to decode blurhash:', error);
    }
  }, [blurhash, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ imageRendering: 'auto' }}
    />
  );
}
