import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AppState } from './types';
import { FIXED_BACKGROUND, FIXED_FRAME, getRandomPattern } from './constants';
import { fileToBase64, compositeWithBackground, compositeWithFrame, removeGreenBackground } from './utils/imageUtils';
import { transformImageWithAI } from './services/aiService';
import { uploadToCloudinary, uploadToFTP, uploadViaPHP, generateQRCodeFromDataUrl } from './services/ftpUploadService';
import LoadingOverlay from './components/LoadingOverlay';
import Settings from './components/Settings';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isRegionSupported, setIsRegionSupported] = useState<boolean | null>(null);
  const [cameraSupported, setCameraSupported] = useState<boolean | null>(null);

  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [randomPattern, setRandomPattern] = useState<string | null>(null);
  const [costumeImage, setCostumeImage] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{ imageUrl: string; qrCodeUrl: string; thumbnailUrl?: string } | null>(null);

  // Add effect to log uploadResult changes
  useEffect(() => {
    console.log('uploadResult state changed:', uploadResult);
    if (uploadResult) {
      console.log('uploadResult details:', {
        hasThumbnailUrl: !!uploadResult.thumbnailUrl,
        thumbnailUrl: uploadResult.thumbnailUrl,
        imageUrl: uploadResult.imageUrl
      });
    }
  }, [uploadResult]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 检测用户所在地区是否支持Gemini API
  useEffect(() => {
    const checkRegionSupport = async () => {
      try {
        // 这是一个简化的地理位置检测方法
        // 实际应用中可能需要更精确的地理位置服务
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const supportedRegions = ['US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'BE', 'LU', 'AT', 'CH', 'JP', 'KR', 'SG', 'AU', 'NZ'];
        setIsRegionSupported(supportedRegions.includes(data.country_code));
      } catch (err) {
        // 如果无法检测地理位置，默认假设不支持
        setIsRegionSupported(false);
      }
    };

    checkRegionSupport();
  }, []);

  // 检测相机支持情况
  useEffect(() => {
    const checkCameraSupport = () => {
      const isiPad = navigator.userAgent.match(/iPad/i) !== null;
      const isiOS = navigator.userAgent.match(/iPhone|iPad|iPod/i) !== null;
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      // Safari on iOS/iPadOS 通常支持相机
      if ((isiPad || isiOS) && isSafari) {
        setCameraSupported(true);
      } 
      // Chrome on iOS 实际上是 Safari 的包装，支持有限
      else if ((isiPad || isiOS) && !isSafari) {
        setCameraSupported(false);
      }
      // 其他情况检查浏览器支持
      else {
        setCameraSupported(!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
      }
    };

    checkCameraSupport();
  }, []);

  const handleError = (message: string, error?: any) => {
    console.error(message, error);
    
    // 提供更详细的错误信息
    let detailedMessage = message;
    if (error) {
      if (error.name === 'NotAllowedError') {
        detailedMessage = '相機訪問被拒絕。請確保已授予相機權限，並刷新頁面重試。在iPad上，請確保您點擊了允許相機訪問的提示。';
      } else if (error.name === 'NotFoundError') {
        detailedMessage = '未找到相機設備。請確認您的設備有相機並已正確連接。iPad可能需要特定的相機配置。';
      } else if (error.name === 'NotReadableError') {
        detailedMessage = '相機正在被其他應用程式使用。請關閉其他使用相機的應用程式後重試。在iPad上，請完全關閉其他相機應用。';
      } else if (error.name === 'OverconstrainedError') {
        detailedMessage = '相機不支援所需的設定。iPad相機可能需要不同的解析度設定。';
      } else if (error.name === 'SecurityError') {
        detailedMessage = '由於安全限制，無法訪問相機。請確保您在安全的HTTPS環境下運行（本地開發環境除外）。iPad上的Chrome可能需要特殊權限。';
      } else if (error.message) {
        detailedMessage = `${message}: ${error.message}`;
      }
    }
    
    setError(detailedMessage);
    setAppState(AppState.ERROR);
    setLoadingMessage('');
  };

  const resetState = () => {
    setAppState(AppState.WELCOME);
    setError(null);
    setLoadingMessage('');
    setOriginalImage(null);
    setRandomPattern(null);
    setCostumeImage(null);
    setFinalImage(null);
    setUploadResult(null);
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
  };

  // 返回按钮处理函数
  const handleGoBack = () => {
    switch (appState) {
      case AppState.CAMERA_PREVIEW:
        // 从相机预览返回到欢迎页面
        setAppState(AppState.WELCOME);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        break;
      case AppState.PHOTO_CONFIRMATION:
        // 从照片确认返回到欢迎页面
        setAppState(AppState.WELCOME);
        setOriginalImage(null);
        break;
      case AppState.FINAL_RESULT:
        // 从最终结果返回到欢迎页面
        resetState();
        break;
      default:
        // 默认返回欢迎页面
        resetState();
    }
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setLoadingMessage('正在讀取照片...');
        const base64 = await fileToBase64(file);
        setOriginalImage(base64);
        setAppState(AppState.PHOTO_CONFIRMATION);
        setLoadingMessage('');
      } catch (err) {
        handleError('讀取檔案失敗', err);
      }
    }
  };

  const startCamera = async () => {
    try {
      // 检查浏览器是否支持getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // 特别处理iPad上的情况
        const isiPad = navigator.userAgent.match(/iPad/i) !== null;
        const isiOS = navigator.userAgent.match(/iPhone|iPad|iPod/i) !== null;
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        console.log('Camera support check:', {
          hasMediaDevices: !!navigator.mediaDevices,
          hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
          isiPad,
          isiOS,
          isSafari,
          userAgent: navigator.userAgent
        });
        
        if (isiPad || isiOS) {
          if (isSafari) {
            throw new Error('Safari瀏覽器應支援相機功能。請確保您已授予相機權限，並刷新頁面重試。');
          } else {
            throw new Error('iPad或iOS設備上的Chrome瀏覽器可能不完全支援相機功能。建議使用Safari瀏覽器，或通過「上傳照片」功能選擇現有照片。');
          }
        } else {
          throw new Error('您的瀏覽器不支援相機功能。請使用最新版本的Chrome、Firefox或Safari。');
        }
      }
      
      // 为移动设备优化相机配置
      let constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'user' // 优先使用前置摄像头，移除width和height约束以提高兼容性
        }
      };
      
      // 特别针对iOS设备进行优化
      const isiOS = navigator.userAgent.match(/iPhone|iPad|iPod/i) !== null;
      if (isiOS) {
        // iOS设备上移除width/height约束以提高兼容性
        constraints = {
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
      }
      
      console.log('Requesting camera with constraints:', constraints);
      streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
      
      // 添加调试信息
      console.log('Camera stream acquired:', streamRef.current);
      console.log('Stream tracks:', streamRef.current.getTracks());
      
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        
        // iOS设备特殊处理：等待视频元数据加载完成后播放
        if (isiOS) {
          const playVideo = () => {
            if (videoRef.current) {
              // Add a small delay to ensure the stream is ready
              setTimeout(() => {
                console.log('Attempting to play video on iOS');
                videoRef.current!.play().catch(err => {
                  console.error('iOS video play error:', err);
                  // Try setting the video to autoplay and muted
                  videoRef.current!.autoplay = true;
                  videoRef.current!.muted = true;
                  videoRef.current!.play().catch(err2 => {
                    console.error('Second attempt to play video failed:', err2);
                    handleError('無法播放視頻流，請檢查：\n1. 已授予相機權限\n2. 沒有其他應用正在使用相機\n3. 嘗試刷新頁面\n4. 如果問題持續，請使用Safari瀏覽器', err2);
                  });
                });
              }, 300);
            }
          };
          
          // Try to play immediately
          playVideo();
          
          // Also try to play after metadata is loaded
          videoRef.current.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded');
            playVideo();
          });
          
          // 添加播放事件监听
          videoRef.current.addEventListener('play', () => {
            console.log('Video playing successfully');
          });
          
          // Add error listener
          videoRef.current.addEventListener('error', (err) => {
            console.error('Video element error:', err);
          });
        } else {
          // For non-iOS devices, ensure autoplay and muted
          videoRef.current.autoplay = true;
          videoRef.current.muted = true;
        }
      }
      setAppState(AppState.CAMERA_PREVIEW);
    } catch (err: any) {
      console.error('Camera error:', err);
      
      // 提供更详细的错误信息
      let detailedMessage = '無法開啟相機';
      if (err) {
        if (err.name === 'NotAllowedError') {
          detailedMessage = '相機訪問被拒絕。請確保已授予相機權限，並刷新頁面重試。在iPad上，請確保您點擊了允許相機訪問的提示。';
        } else if (err.name === 'NotFoundError') {
          detailedMessage = '未找到相機設備。請確認您的設備有相機並已正確連接。iPad可能需要特定的相機配置。';
        } else if (err.name === 'NotReadableError') {
          detailedMessage = '相機正在被其他應用程式使用。請關閉其他使用相機的應用程式後重試。在iPad上，請完全關閉其他相機應用。';
        } else if (err.name === 'OverconstrainedError') {
          detailedMessage = '相機不支援所需的設定。iPad相機可能需要不同的解析度設定。';
        } else if (err.name === 'SecurityError') {
          detailedMessage = '由於安全限制，無法訪問相機。請確保您在安全的HTTPS環境下運行（本地開發環境除外）。iPad上的Chrome可能需要特殊權限。';
        } else if (err.message) {
          detailedMessage = `無法開啟相機: ${err.message}`;
        }
      }
      
      handleError(detailedMessage, err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setOriginalImage(dataUrl);
        setAppState(AppState.PHOTO_CONFIRMATION);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      }
    }
  };

  const handlePhotoConfirm = () => {
    // 生成隨機圖案
    const pattern = getRandomPattern();
    setRandomPattern(pattern);
    setAppState(AppState.PROCESSING_COSTUME);
  };

  const processCostumeChange = useCallback(async () => {
    if (!originalImage || !randomPattern) return;
    try {
      setLoadingMessage('AI 正在為您設計水墨風格古裝...');
      const transformedFromAI = await transformImageWithAI(originalImage, randomPattern);
      
      // Increment API usage counter
      const savedSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
      if (savedSettings.apiKey) {
        const usageStats = JSON.parse(localStorage.getItem('apiUsageStats') || '{}');
        usageStats[savedSettings.apiKey] = (usageStats[savedSettings.apiKey] || 0) + 1;
        localStorage.setItem('apiUsageStats', JSON.stringify(usageStats));
      }
      
      setLoadingMessage('AI 換裝完成，正在進行綠幕去背處理...');
      const transparentImage = await removeGreenBackground(transformedFromAI);

      setLoadingMessage('正在合成背景...');
      const composited = await compositeWithBackground(FIXED_BACKGROUND, transparentImage);
      
      setLoadingMessage('正在加上畫框...');
      const final = await compositeWithFrame(composited, FIXED_FRAME);
      
      setFinalImage(final);
      setAppState(AppState.FINAL_RESULT);
    } catch (err: any) {
      // Handle region restriction error with a user-friendly message
      if (err.message && err.message.includes("地區暫時不支持")) {
        handleError(err.message, err);
      } 
      // Handle quota exceeded error
      else if (err.message && (err.message.includes("配額已用完") || err.message.includes("quota") || err.message.includes("RESOURCE_EXHAUSTED"))) {
        handleError('API 配額已用完。請嘗試以下解決方案：\n1. 等待幾分鐘後重試\n2. 在設定中切換到 OpenRouter 提供商\n3. 升級您的 Google AI API 計劃', err);
      }
      else {
        handleError(err instanceof Error ? err.message : 'AI 圖片處理失敗', err);
      }
    }
  }, [originalImage, randomPattern]);

  useEffect(() => {
    if (appState === AppState.PROCESSING_COSTUME && originalImage && randomPattern) {
      processCostumeChange();
    }
  }, [appState, originalImage, randomPattern, processCostumeChange]);

  // Add a new function to automatically upload when final result is ready
  const autoUploadAndGenerateQR = useCallback(async () => {
    if (!finalImage || appState !== AppState.FINAL_RESULT) {
      console.log('Auto upload conditions not met:', { 
        hasFinalImage: !!finalImage, 
        appState: appState,
        expectedState: AppState.FINAL_RESULT
      });
      return;
    }
    
    console.log('Auto uploading final image');
    // Automatically trigger upload when final result is ready
    await handleFTPUpload();
  }, [finalImage, appState]);

  // Add this new effect to automatically upload when final result is ready
  useEffect(() => {
    console.log('Checking auto upload conditions:', {
      appState: appState,
      appStateName: AppState[appState],
      hasFinalImage: !!finalImage,
      hasUploadResult: !!uploadResult,
      uploadResult: uploadResult
    });
    
    // Add more detailed logging
    if (appState === AppState.FINAL_RESULT) {
      console.log('In FINAL_RESULT state:');
      console.log('- finalImage present:', !!finalImage);
      console.log('- uploadResult present:', !!uploadResult);
      if (uploadResult) {
        console.log('- uploadResult.thumbnailUrl present:', !!uploadResult.thumbnailUrl);
        console.log('- uploadResult.thumbnailUrl value:', uploadResult.thumbnailUrl);
      }
    }
    
    if (appState === AppState.FINAL_RESULT && finalImage && !uploadResult) {
      console.log('Triggering auto upload');
      autoUploadAndGenerateQR();
    } else if (appState === AppState.FINAL_RESULT && finalImage && uploadResult) {
      console.log('Upload already completed, not triggering again');
      // Add additional check to verify thumbnail URL
      if (uploadResult.thumbnailUrl) {
        console.log('Thumbnail URL is present in uploadResult:', uploadResult.thumbnailUrl);
      } else {
        console.log('Thumbnail URL is missing from uploadResult');
      }
    } else if (appState === AppState.FINAL_RESULT && !finalImage) {
      console.log('In final result state but no final image available');
    } else if (appState !== AppState.FINAL_RESULT) {
      console.log('Not in final result state');
    }
  }, [appState, finalImage, uploadResult, autoUploadAndGenerateQR]);

  const handleDownload = () => {
    if (finalImage) {
      const link = document.createElement('a');
      link.href = finalImage;
      link.download = `ai-artwork-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Add this new function for FTP upload
  const handleFTPUpload = async () => {
    if (!finalImage) {
      console.log('No final image to upload');
      return;
    }
    
    try {
      setLoadingMessage('正在上傳圖片到伺服器...');
      const filename = `ai-artwork-${Date.now()}.png`;
      
      console.log('Starting upload process for:', filename);
      console.log('Final image data size:', finalImage.length, 'characters');
      
      // Log environment information
      console.log('Environment info:', {
        nodeEnv: process.env.NODE_ENV,
        backendUrl: process.env.REACT_APP_BACKEND_URL,
        cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
        isProduction: process.env.NODE_ENV === 'production'
      });
      
      try {
        // Check if we're in a production environment (Vercel deployment)
        if (process.env.NODE_ENV === 'production') {
          console.log('Running in production environment (Vercel), trying PHP API first');
          
          // First try PHP API upload (works with Vercel deployments)
          try {
            console.log('Trying PHP API upload...');
            const result = await uploadViaPHP(finalImage, filename);
            console.log('PHP API upload successful:', result);
            console.log('Upload result details:', {
              hasResult: !!result,
              hasThumbnailUrl: !!result.thumbnailUrl,
              thumbnailUrl: result.thumbnailUrl,
              imageUrl: result.imageUrl
            });
            setUploadResult(result);
            setLoadingMessage('');
            return;
          } catch (phpError) {
            console.warn('PHP API upload failed:', phpError);
            // Log more details about the error
            if (phpError instanceof Error) {
              console.error('PHP API error details:', {
                name: phpError.name,
                message: phpError.message,
                stack: phpError.stack
              });
            }
            // Don't throw here, continue to other options
          }
          
          // Check if backend URL is configured
          const backendUrl = process.env.REACT_APP_BACKEND_URL;
          console.log('Backend URL configured:', backendUrl ? 'yes' : 'no');
          
          if (!backendUrl) {
            // In production without backend URL, show a specific message
            console.log('No backend URL configured, trying Cloudinary as alternative');
          }
          
          // Check if Cloudinary is configured as an alternative
          const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
          console.log('Cloudinary configured:', cloudinaryCloudName ? 'yes' : 'no');
          
          if (cloudinaryCloudName) {
            console.log('Trying Cloudinary upload...');
            const result = await uploadToCloudinary(finalImage, filename);
            console.log('Cloudinary upload successful:', result);
            console.log('Upload result details:', {
              hasResult: !!result,
              hasThumbnailUrl: !!result.thumbnailUrl,
              thumbnailUrl: result.thumbnailUrl,
              imageUrl: result.imageUrl
            });
            setUploadResult(result);
            setLoadingMessage('');
            return;
          }
        } else {
          console.log('Running in development environment');
          
          // In development, first try to use the backend server if available
          try {
            console.log('Trying FTP upload to backend server...');
            const result = await uploadToFTP(finalImage, filename);
            console.log('FTP upload successful:', result);
            console.log('Upload result details:', {
              hasResult: !!result,
              hasThumbnailUrl: !!result.thumbnailUrl,
              thumbnailUrl: result.thumbnailUrl,
              imageUrl: result.imageUrl
            });
            setUploadResult(result);
            setLoadingMessage('');
            return;
          } catch (ftpError) {
            console.warn('FTP upload failed:', ftpError);
            // Continue to other options
          }
        }
        
        // Fallback - try PHP API in development as well (for testing)
        try {
          console.log('Trying PHP API upload as fallback...');
          const result = await uploadViaPHP(finalImage, filename);
          console.log('PHP API upload successful:', result);
          console.log('Upload result details:', {
            hasResult: !!result,
            hasThumbnailUrl: !!result.thumbnailUrl,
            thumbnailUrl: result.thumbnailUrl,
            imageUrl: result.imageUrl
          });
          setUploadResult(result);
          setLoadingMessage('');
          return;
        } catch (phpError) {
          console.warn('PHP API upload failed:', phpError);
        }
        
        // If all methods fail, use fallback
        console.log('All upload methods failed, using QR code fallback');
        setLoadingMessage('上傳失敗，正在生成 QR Code...');
        
        // Fallback - generate QR code with helpful message
        const result = await generateQRCodeFromDataUrl(finalImage);
        console.log('QR code fallback generated:', result);
        console.log('Upload result details:', {
          hasResult: !!result,
          hasThumbnailUrl: !!result.thumbnailUrl,
          thumbnailUrl: result.thumbnailUrl,
          imageUrl: result.imageUrl
        });
        setUploadResult(result);
        setLoadingMessage('');
      } catch (err) {
        console.error('Upload process failed:', err);
        // Fallback - generate QR code with helpful message
        try {
          console.log('Generating QR code fallback due to error...');
          const result = await generateQRCodeFromDataUrl(finalImage);
          console.log('QR code fallback generated:', result);
          console.log('Upload result details:', {
            hasResult: !!result,
            hasThumbnailUrl: !!result.thumbnailUrl,
            thumbnailUrl: result.thumbnailUrl,
            imageUrl: result.imageUrl
          });
          setUploadResult(result);
          setLoadingMessage('');
        } catch (qrError) {
          console.error('QR code generation failed:', qrError);
          handleError('上傳圖片失敗', err);
        }
      }
    } catch (err) {
      console.error('Upload process failed:', err);
      handleError('上傳圖片失敗', err);
    }
  };

  // 返回按钮组件
  const BackButton = () => (
    <button 
      onClick={handleGoBack}
      className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors mb-4 flex items-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
      </svg>
      返回
    </button>
  );

  const renderContent = () => {
    // 如果检测到地区不支持，显示提示信息
    if (isRegionSupported === false) {
      return (
        <div className="text-center bg-yellow-900/50 p-8 rounded-lg max-w-2xl">
          <h2 className="text-3xl font-bold text-yellow-400 mb-4">地區訪問限制</h2>
          <p className="text-lg text-yellow-200 mb-4">
            抱歉，您目前所在的地區暫時不支持AI換裝功能。這是因為Google Generative AI服務的地區限制政策。
          </p>
          <p className="text-md text-yellow-300 mb-6">
            您可以嘗試以下解決方案：
            <br/>1. 使用VPN連接到支持的地區（如美國、歐洲等）
            <br/>2. 請在支持的地區的朋友幫您生成圖片
            <br/>3. 聯繫管理員了解更多信息
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            重新檢測地區
          </button>
        </div>
      );
    }

    // 检测设备类型
    const isiPad = navigator.userAgent.match(/iPad/i) !== null;
    const isiOS = navigator.userAgent.match(/iPhone|iPad|iPod/i) !== null;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    switch (appState) {
      case AppState.SETTINGS:
        return (
          <Settings 
            onBack={() => setAppState(AppState.WELCOME)} 
            onSave={() => setAppState(AppState.WELCOME)} 
          />
        );
      case AppState.WELCOME:
        return (
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">AI 古裝青花瓷換裝秀</h1>
            <p className="text-lg text-gray-300 mb-8">將您的照片變為獨一無二的藝術品</p>
            {isRegionSupported === true && (
              <div className="bg-green-900/30 text-green-300 p-2 rounded mb-4 inline-block">
                ✓ 您的地區支持AI功能
              </div>
            )}
            
            {/* 为iPad用户显示特殊提示 */}
            {isiPad && (
              <div className="bg-blue-900/30 text-blue-300 p-4 rounded-lg mb-6">
                <h3 className="font-bold text-lg mb-2">iPad用戶提示</h3>
                <div className="text-left space-y-2">
                  {isSafari ? (
                    <>
                      <p className="mb-2">✓ 您正在使用Safari瀏覽器，應支援相機功能</p>
                      <p className="text-sm">如相機無法使用，請確保：</p>
                      <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
                        <li>已授予相機權限（設置 → Safari → 相機）</li>
                        <li>刷新頁面後再次嘗試</li>
                        <li>關閉其他使用相機的應用程式</li>
                      </ol>
                    </>
                  ) : (
                    <>
                      <p className="mb-2">⚠ 您正在使用Chrome瀏覽器，iPad上的相機支援可能有限</p>
                      <p className="text-sm">建議：</p>
                      <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
                        <li>切換到Safari瀏覽器獲得最佳體驗</li>
                        <li>或點擊「上傳照片」選擇現有照片</li>
                      </ol>
                    </>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
                  上傳照片
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                {/* 根据浏览器类型调整相机按钮 */}
                <button 
                  onClick={startCamera} 
                  className={`${(isiPad || isiOS) && !isSafari ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-cyan-600 hover:bg-cyan-700'} text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105`}
                >
                  {(isiPad || isiOS) && !isSafari ? '相機（可能不支援）' : '開啟相機'}
                </button>
            </div>
            
            {/* 为移动设备显示通用提示 */}
            {isMobile && !isiPad && (
              <div className="mt-4 text-sm text-gray-400">
                <p>行動裝置用戶：如相機無法使用，請點擊「上傳照片」選擇現有照片</p>
              </div>
            )}
            
            <div className="mt-6">
              <button 
                onClick={() => setAppState(AppState.SETTINGS)}
                className="text-gray-400 hover:text-gray-200 text-sm flex items-center justify-center mx-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.533 1.533 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                設定
              </button>
            </div>
          </div>
        );
      case AppState.CAMERA_PREVIEW:
        return (
           <div className="flex flex-col items-center gap-4 w-full max-w-2xl mx-auto">
             <BackButton />
             <video 
               ref={videoRef} 
               autoPlay 
               playsInline 
               muted
               className="rounded-lg w-full h-auto shadow-lg"
             ></video>
             <button onClick={capturePhoto} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full text-lg shadow-xl">拍照</button>
           </div>
        );
      case AppState.PHOTO_CONFIRMATION:
        return (
          <div className="text-center flex flex-col items-center gap-6">
            <BackButton />
            <h2 className="text-3xl font-bold mb-4">確認您的照片</h2>
            {originalImage && (
              <img 
                src={originalImage} 
                alt="您的照片" 
                className="rounded-lg shadow-2xl max-w-full md:max-w-2xl max-h-[60vh] object-contain"
              />
            )}
            <p className="text-lg text-gray-300 mb-6">請確認這張照片是否正確，確認後將使用隨機圖案為您生成古裝藝術照</p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button 
                onClick={handlePhotoConfirm} 
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105"
              >
                確認生成
              </button>
              <button 
                onClick={() => setAppState(AppState.WELCOME)} 
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105"
              >
                重新選擇
              </button>
            </div>
          </div>
        );
      case AppState.FINAL_RESULT:
        return (
            <div className="text-center flex flex-col items-center gap-6">
                 <BackButton />
                 <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">恭喜！您的作品已完成</h1>
                 
                 {/* Show thumbnail and QR code side by side */}
                 {uploadResult ? (
                   <div className="flex flex-col md:flex-row items-center justify-center gap-8 mt-4">
                     {/* Thumbnail Display */}
                     <div className="flex flex-col items-center">
                       <h2 className="text-xl font-bold mb-4">您的作品</h2>
                       <ThumbnailDisplay 
                         thumbnailUrl={uploadResult.thumbnailUrl} 
                         fallbackImageUrl={finalImage} 
                       />
                     </div>
                     
                     {/* QR Code Display */}
                     <div className="flex flex-col items-center">
                       <h2 className="text-xl font-bold mb-4">分享您的作品</h2>
                       <img src={uploadResult.qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                       <p className="text-md mt-2">掃描 QR Code 分享您的作品</p>
                     </div>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center gap-4 mt-4">
                     <p className="text-lg">正在上傳圖片並生成 QR Code...</p>
                     {loadingMessage && <p className="text-md">{loadingMessage}</p>}
                   </div>
                 )}
            </div>
        );
      case AppState.ERROR:
        return (
          <div className="text-center bg-red-900/50 p-8 rounded-lg">
            <BackButton />
            <h2 className="text-3xl font-bold text-red-400 mb-4">發生錯誤</h2>
            <p className="text-lg text-red-200 mb-6">{error}</p>
            <button onClick={resetState} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg">
              重試
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const showLoading = appState === AppState.PROCESSING_COSTUME;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 md:p-8">
      {showLoading && <LoadingOverlay message={loadingMessage} />}
      <main className="container mx-auto flex items-center justify-center">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;

const ThumbnailDisplay: React.FC<{ 
  thumbnailUrl?: string | null; 
  fallbackImageUrl?: string | null 
}> = ({ thumbnailUrl, fallbackImageUrl }) => {
  const [useThumbnail, setUseThumbnail] = useState<boolean>(true);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Reset state when URL changes
  useEffect(() => {
    setUseThumbnail(true);
    setImageLoaded(false);
    setImageError(false);
  }, [thumbnailUrl]);
  
  if (!fallbackImageUrl) {
    return null;
  }
  
  const imageUrl = useThumbnail && thumbnailUrl ? thumbnailUrl : fallbackImageUrl;
  const isThumbnail = useThumbnail && !!thumbnailUrl;
  
  console.log('ThumbnailDisplay rendering:', { 
    useThumbnail, 
    thumbnailUrl, 
    fallbackImageUrl,
    imageUrl,
    isThumbnail
  });
  
  return (
    <div className="relative">
      <img 
        ref={imageRef}
        key={`thumbnail-display-${imageUrl}`}
        src={imageUrl} 
        alt={isThumbnail ? "Final masterpiece thumbnail" : "Final masterpiece"} 
        className="rounded-xl shadow-2xl max-w-full md:max-w-2xl"
        style={{ 
          display: 'block',
          border: imageError ? '2px solid red' : imageLoaded ? '2px solid green' : '2px solid gray'
        }}
        onError={(e) => {
          console.log('❌ ThumbnailDisplay image failed to load:', e);
          console.log('Failed URL:', imageUrl);
          
          const imgElement = e.target as HTMLImageElement;
          console.log('Image element properties:', {
            src: imgElement.src,
            naturalWidth: imgElement.naturalWidth,
            naturalHeight: imgElement.naturalHeight,
            complete: imgElement.complete
          });
          
          if (isThumbnail && thumbnailUrl) {
            console.log('Switching to fallback image');
            setUseThumbnail(false);
          }
          
          setImageError(true);
          setImageLoaded(false);
        }}
        onLoad={(e) => {
          console.log('✅ ThumbnailDisplay image loaded successfully');
          const imgElement = e.target as HTMLImageElement;
          console.log('Image dimensions:', {
            width: imgElement.naturalWidth,
            height: imgElement.naturalHeight
          });
          
          setImageLoaded(true);
          setImageError(false);
        }}
      />
      
      {/* Overlay to indicate this is a thumbnail */}
      {isThumbnail && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          縮圖預覽
        </div>
      )}
    </div>
  );
}
