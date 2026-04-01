'use client';

import { useEffect, useRef, useCallback } from 'react';

interface ProductBlobViewerWrapperProps {
  containerId: string;
  modelPath?: string;
  autoRotate?: boolean;
  enableInteraction?: boolean;
  enableColorCustomizer?: boolean;
  showAllParts?: boolean;
  quality?: 'low' | 'medium' | 'high';
  style?: React.CSSProperties;
  className?: string;
  onViewerReady?: (viewer: ViewerInstance) => void;
  onColorChange?: (colors: Record<string, string>) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ViewerInstance = any;

export default function ProductBlobViewerWrapper({
  containerId,
  modelPath = '/assets/blob.glb',
  autoRotate = true,
  enableInteraction = true,
  enableColorCustomizer = true,
  showAllParts = true,
  quality = 'medium',
  style,
  className,
  onViewerReady,
  onColorChange,
}: ProductBlobViewerWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ViewerInstance | null>(null);

  const destroyViewer = useCallback(() => {
    if (viewerRef.current) {
      try {
        viewerRef.current.destroy();
      } catch (e) {
        console.warn('Viewer destroy error:', e);
      }
      viewerRef.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initViewer() {
      if (!containerRef.current || !mounted) return;

      // Wait a frame to ensure DOM is fully updated after remount
      await new Promise((r) => requestAnimationFrame(r));
      if (!mounted || !containerRef.current) return;

      const { default: ProductBlobViewer } = await import('./product-blob-viewer.js');

      if (!mounted || !containerRef.current) return;

      try {
        const viewer = new ProductBlobViewer(containerId, {
          modelPath,
          autoRotate,
          enableInteraction,
          enableColorCustomizer,
          showAllParts,
          quality,
          onColorChange,
        });
        viewerRef.current = viewer;
        if (onViewerReady) {
          onViewerReady(viewer);
        }
      } catch (err) {
        // silently handled
      }
    }

    initViewer();

    return () => {
      mounted = false;
      destroyViewer();
    };
  }, [containerId, modelPath, autoRotate, enableInteraction, enableColorCustomizer, showAllParts, quality, onViewerReady, onColorChange, destroyViewer]);

  return (
    <div
      ref={containerRef}
      id={containerId}
      style={{ width: '100%', height: '100%', ...style }}
      className={className}
    />
  );
}
