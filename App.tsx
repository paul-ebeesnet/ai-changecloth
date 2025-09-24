import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AppState } from './types';
import { BACKGROUND_IMAGES, FRAME_IMAGES, COSTUME_PATTERN_IMAGES } from './constants';
import { fileToBase64, compositeWithBackground, compositeWithFrame, removeGreenBackground } from './utils/imageUtils';
import { transformImageWithGemini } from './services/geminiService';
import LoadingOverlay from './components/LoadingOverlay';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedCostumePattern, setSelectedCostumePattern] = useState<string | null>(null);
  const [costumeImage, setCostumeImage] = useState<string | null>(null);
  const [compositedImage, setCompositedImage] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleError = (message: string, error?: any) => {
    console.error(message, error);
    setError(message);
    setAppState(AppState.ERROR);
    setLoadingMessage('');
  };

  const resetState = () => {
    setAppState(AppState.WELCOME);
    setError(null);
    setLoadingMessage('');
    setOriginalImage(null);
    setSelectedCostumePattern(null);
    setCostumeImage(null);
    setCompositedImage(null);
    setFinalImage(null);
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
      case AppState.SELECTING_COSTUME:
        // 从选择服装返回到欢迎页面
        setAppState(AppState.WELCOME);
        setOriginalImage(null);
        break;
      case AppState.SELECTING_BACKGROUND:
        // 从选择背景返回到选择服装
        setAppState(AppState.SELECTING_COSTUME);
        setCostumeImage(null);
        break;
      case AppState.SELECTING_FRAME:
        // 从选择画框返回到选择背景
        setAppState(AppState.SELECTING_BACKGROUND);
        setCompositedImage(null);
        break;
      case AppState.FINAL_RESULT:
        // 从最终结果返回到选择画框
        setAppState(AppState.SELECTING_FRAME);
        setFinalImage(null);
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
        setAppState(AppState.PROCESSING_COSTUME); // A bit of a lie, but shows loading
        const base64 = await fileToBase64(file);
        setOriginalImage(base64);
        setAppState(AppState.SELECTING_COSTUME);
        setLoadingMessage('');
      } catch (err) {
        handleError('讀取檔案失敗', err);
      }
    }
  };

  const startCamera = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      setAppState(AppState.CAMERA_PREVIEW);
    } catch (err) {
      handleError('無法開啟相機', err);
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
        setAppState(AppState.SELECTING_COSTUME);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      }
    }
  };

  const handleCostumeSelect = (patternUrl: string) => {
    setSelectedCostumePattern(patternUrl);
    setAppState(AppState.PROCESSING_COSTUME);
  };

  const processCostumeChange = useCallback(async () => {
    if (!originalImage || !selectedCostumePattern) return;
    try {
      setLoadingMessage('AI 正在為您設計水墨風格古裝...');
      const transformedFromAI = await transformImageWithGemini(originalImage, selectedCostumePattern);
      
      setLoadingMessage('AI 換裝完成，正在進行綠幕去背處理...');
      const transparentImage = await removeGreenBackground(transformedFromAI);

      setCostumeImage(transparentImage);
      setAppState(AppState.SELECTING_BACKGROUND);
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'AI 圖片處理失敗', err);
    }
  }, [originalImage, selectedCostumePattern]);

  useEffect(() => {
    if (appState === AppState.PROCESSING_COSTUME && originalImage && selectedCostumePattern) {
      processCostumeChange();
    }
  }, [appState, originalImage, selectedCostumePattern, processCostumeChange]);

  const selectBackground = async (bgUrl: string) => {
    if (!costumeImage) return;
    try {
        setLoadingMessage('正在合成背景...');
        // 不再设置为PROCESSING_COSTUME状态，避免重新触发AI处理
        const composited = await compositeWithBackground(bgUrl, costumeImage);
        setCompositedImage(composited);
        setAppState(AppState.SELECTING_FRAME);
    } catch(err){
        handleError('背景合成失敗', err);
    }
  };

  const selectFrame = async (frameUrl: string) => {
    if (!compositedImage) return;
     try {
        setLoadingMessage('正在加上畫框...');
        // 不再设置为PROCESSING_COSTUME状态，避免重新触发AI处理
        const final = await compositeWithFrame(compositedImage, frameUrl);
        setFinalImage(final);
        setAppState(AppState.FINAL_RESULT);
    } catch(err){
        handleError('畫框合成失敗', err);
    }
  };
  
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
    switch (appState) {
      case AppState.WELCOME:
        return (
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">AI 古裝青花瓷換裝秀</h1>
            <p className="text-lg text-gray-300 mb-8">將您的照片變為獨一無二的藝術品</p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
                  上傳照片
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                <button onClick={startCamera} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
                  開啟相機
                </button>
            </div>
          </div>
        );
      case AppState.CAMERA_PREVIEW:
        return (
           <div className="flex flex-col items-center gap-4 w-full max-w-2xl mx-auto">
             <BackButton />
             <video ref={videoRef} autoPlay playsInline className="rounded-lg w-full h-auto shadow-lg"></video>
             <button onClick={capturePhoto} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full text-lg shadow-xl">拍照</button>
           </div>
        );
      case AppState.SELECTING_COSTUME:
        return (
          <div className="w-full flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-shrink-0 lg:w-1/3 w-full text-center">
              <BackButton />
              <h2 className="text-2xl font-bold mb-4">您的照片</h2>
              {originalImage && <img src={originalImage} alt="Your submission" className="rounded-lg shadow-2xl mx-auto max-h-[60vh] object-contain"/>}
            </div>
            <div className="flex-grow lg:w-2/3 w-full">
              <h2 className="text-2xl font-bold mb-4">步驟 1: 選擇您喜愛的服飾款式</h2>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                {COSTUME_PATTERN_IMAGES.map(pattern => (
                  <img 
                    key={pattern} 
                    src={pattern} 
                    alt="Costume pattern option" 
                    onClick={() => handleCostumeSelect(pattern)} 
                    className="rounded-md cursor-pointer hover:opacity-80 transition-all ring-2 ring-transparent hover:ring-cyan-400 hover:scale-105 aspect-square object-cover"
                  />
                ))}
              </div>
            </div>
          </div>
        );
      case AppState.SELECTING_BACKGROUND:
        return (
          <div className="w-full flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-shrink-0 lg:w-1/2 w-full text-center">
                <BackButton />
                <h2 className="text-2xl font-bold mb-4">步驟 2: 選擇背景</h2>
                {costumeImage && <img src={costumeImage} alt="AI Transformed" className="rounded-lg shadow-2xl mx-auto max-h-[60vh] object-contain"/>}
            </div>
            <div className="flex-grow lg:w-1/2 w-full">
                <h3 className="text-xl mb-4">背景選項</h3>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                    {BACKGROUND_IMAGES.map(bg => (
                        <img key={bg} src={bg} alt="Background option" onClick={() => selectBackground(bg)} className="rounded-md cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-transparent hover:ring-blue-400"/>
                    ))}
                </div>
            </div>
          </div>
        );
      case AppState.SELECTING_FRAME:
        return (
            <div className="w-full flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-shrink-0 lg:w-1/2 w-full text-center">
                <BackButton />
                <h2 className="text-2xl font-bold mb-4">步驟 3: 選擇畫框</h2>
                {compositedImage && <img src={compositedImage} alt="Composited with background" className="rounded-lg shadow-2xl mx-auto max-h-[60vh] object-contain"/>}
            </div>
            <div className="flex-grow lg:w-1/2 w-full">
                <h3 className="text-xl mb-4">畫框選項</h3>
                <div className="grid grid-cols-1 gap-4 bg-gray-700 p-4 rounded-lg">
                    {FRAME_IMAGES.map(frame => (
                         <div key={frame} onClick={() => selectFrame(frame)} className="cursor-pointer p-2 rounded-md hover:bg-gray-600 transition-colors flex justify-center items-center">
                            <img src={frame} alt="Frame option" className="max-h-32"/>
                         </div>
                    ))}
                </div>
            </div>
          </div>
        );
      case AppState.FINAL_RESULT:
        return (
            <div className="text-center flex flex-col items-center gap-6">
                 <BackButton />
                 <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">恭喜！您的作品已完成</h1>
                 {finalImage && <img src={finalImage} alt="Final masterpiece" className="rounded-xl shadow-2xl max-w-full md:max-w-2xl"/>}
                 <p className="text-lg">您的作品已準備就緒，可以下載了！</p>
                 <div className="flex flex-col md:flex-row gap-4 justify-center mt-4">
                    <button onClick={handleDownload} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105">
                        下載圖片
                    </button>
                    <button onClick={resetState} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105">
                        再玩一次
                    </button>
                </div>
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