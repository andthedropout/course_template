import { useState, useCallback, useRef } from 'react';
import * as tus from 'tus-js-client';
import {
  initBunnyUpload,
  confirmBunnyUpload,
  checkBunnyVideoStatus,
  BunnyVideo,
  BunnyUploadInit,
} from '@/api/courses';

export type UploadState = 'idle' | 'initializing' | 'uploading' | 'confirming' | 'processing' | 'ready' | 'error';

export interface UploadProgress {
  bytesUploaded: number;
  bytesTotal: number;
  percentage: number;
}

export interface UseBunnyUploadReturn {
  uploadState: UploadState;
  progress: UploadProgress;
  error: string | null;
  video: BunnyVideo | null;
  upload: (file: File, title?: string) => Promise<BunnyVideo | null>;
  cancel: () => void;
  reset: () => void;
}

export function useBunnyUpload(): UseBunnyUploadReturn {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState<UploadProgress>({
    bytesUploaded: 0,
    bytesTotal: 0,
    percentage: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [video, setVideo] = useState<BunnyVideo | null>(null);

  const tusUploadRef = useRef<tus.Upload | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setUploadState('idle');
    setProgress({ bytesUploaded: 0, bytesTotal: 0, percentage: 0 });
    setError(null);
    setVideo(null);
    tusUploadRef.current = null;
  }, []);

  const cancel = useCallback(() => {
    if (tusUploadRef.current) {
      tusUploadRef.current.abort();
      tusUploadRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    reset();
  }, [reset]);

  const pollForReady = useCallback(async (videoId: number): Promise<BunnyVideo | null> => {
    const maxAttempts = 60; // 5 minutes at 5-second intervals
    const pollInterval = 5000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const status = await checkBunnyVideoStatus(videoId);

        if (status.status === 'ready') {
          // Fetch the full video object
          const result = await confirmBunnyUpload(videoId);
          setVideo(result);
          setUploadState('ready');
          return result;
        }

        if (status.status === 'failed') {
          throw new Error('Video processing failed');
        }

        // Still processing, wait and try again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (err) {
        if (attempt === maxAttempts - 1) {
          throw err;
        }
      }
    }

    throw new Error('Video processing timed out');
  }, []);

  const upload = useCallback(async (file: File, title?: string): Promise<BunnyVideo | null> => {
    reset();
    setUploadState('initializing');

    try {
      // Initialize upload on backend
      const videoTitle = title || file.name.replace(/\.[^/.]+$/, '');
      const initData: BunnyUploadInit = await initBunnyUpload(videoTitle);

      setUploadState('uploading');
      setProgress({ bytesUploaded: 0, bytesTotal: file.size, percentage: 0 });

      // Create TUS upload
      return new Promise((resolve, reject) => {
        const tusUpload = new tus.Upload(file, {
          endpoint: initData.tus_upload_url,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          chunkSize: 5 * 1024 * 1024, // 5MB chunks
          metadata: {
            filename: file.name,
            filetype: file.type,
          },
          headers: {
            ...initData.tus_headers,
          },
          onError: (err) => {
            setError(err.message || 'Upload failed');
            setUploadState('error');
            reject(err);
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
            setProgress({ bytesUploaded, bytesTotal, percentage });
          },
          onSuccess: async () => {
            try {
              // Confirm upload with backend
              setUploadState('confirming');
              await confirmBunnyUpload(initData.video_id);

              // Poll for processing completion
              setUploadState('processing');
              const result = await pollForReady(initData.video_id);
              resolve(result);
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Processing failed';
              setError(errorMessage);
              setUploadState('error');
              reject(err);
            }
          },
        });

        tusUploadRef.current = tusUpload;

        // Start fresh upload (don't try to resume stale uploads that may have expired on Bunny)
        tusUpload.start();
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload initialization failed';
      setError(errorMessage);
      setUploadState('error');
      return null;
    }
  }, [reset, pollForReady]);

  return {
    uploadState,
    progress,
    error,
    video,
    upload,
    cancel,
    reset,
  };
}
