# AI 古裝青花瓷換裝秀

將您的照片變為獨一無二的水墨風格古裝藝術品。

## 功能特色

- 使用 AI 技術將現代照片轉換為傳統中國水墨畫風格的古裝造型
- 支援相機拍照和照片上傳
- 自動生成 QR Code 便於分享
- 支援多種圖片托管方案 (FTP, Cloudinary)

## 開發環境設置

### 前置要求

- Node.js (v18 或更高版本)
- npm 或 yarn

### 安裝依賴

```bash
npm install
```

### 環境變數設置

複製 [.env.example](file:///Users/paulchang/Library/Mobile%20Documents/com~apple~CloudDocs/PDF/Ebees/Project/Wynn%20x%20MIF/ai-changecloth/.env.example) 文件並重命名為 .env，然後填入必要的環境變數：

```bash
cp .env.example .env
```

需要設置的環境變數：
- `GEMINI_API_KEY`: Google AI Studio 的 API 金鑰
- `REACT_APP_BACKEND_URL`: 部署後端服務的 URL (用於生產環境，可選)
- `CLOUDINARY_CLOUD_NAME`: Cloudinary 雲名稱 (用於 Vercel 部署，推薦)

### 開發模式運行

```bash
# 啟動前端開發伺服器
npm run dev

# 在另一個終端中啟動後端伺服器
cd backend
npm install
npm run dev
```

## API 配額管理

### Google Gemini API 配額限制

Google Gemini API 免費版有以下限制：
- 每分鐘請求數量限制
- 每日請求數量限制
- 輸入 token 數量限制

當遇到配額限制時，應用會顯示相應的錯誤信息並提供解決方案。

### 解決配額限制的建議

1. **切換到 OpenRouter**：
   - 在應用設定中切換 API 提供商到 OpenRouter
   - OpenRouter 通常提供更高的免費配額

2. **輪換 API 金鑰**：
   - 創建多個 Google AI Studio 帳戶獲取多個 API 金鑰
   - 在應用中輪換使用不同的金鑰

3. **升級到付費計劃**：
   - Google AI Studio 提供付費計劃以獲得更高配額

4. **等待配額重置**：
   - Google Gemini API 配额通常在每日 UTC 時間重置

## 部署指南

### 部署到 Vercel (前端)

1. 將代碼推送到 GitHub 倉庫
2. 在 Vercel 上導入項目
3. 設置環境變數：
   - `GEMINI_API_KEY`: 你的 Google AI Studio API 金鑰
   - `CLOUDINARY_CLOUD_NAME`: 你的 Cloudinary 雲名稱 (推薦)
   - `REACT_APP_BACKEND_URL`: 你的後端服務 URL (可選)

### Cloudinary 設置 (推薦用於 Vercel 部署)

Cloudinary 是一個雲端圖片和視頻管理平台，與 Vercel 等無伺服器環境完美配合。

1. 註冊 Cloudinary 帳戶: https://cloudinary.com/
2. 登入儀表板獲取你的 `Cloud Name`
3. 在環境變數中設置 `CLOUDINARY_CLOUD_NAME`
4. 創建一個上傳預設 (Upload Preset)：
   - 進入 Settings > Upload
   - 點擊 "Add upload preset"
   - 設置名稱為 `ai_changecloth`
   - 設置為 "Unsigned"
   - 保存預設

### 部署後端服務

由於 Vercel 是無伺服器平台，無法直接運行後端服務，你需要將後端服務部署到支持長期運行進程的平台：

#### 選項 1: 部署到雲伺服器 (如 AWS EC2, DigitalOcean, etc.)

1. 將後端代碼部署到雲伺服器
2. 安裝依賴：
   ```bash
   cd backend
   npm install
   ```
3. 使用 PM2 或類似工具運行後端服務：
   ```bash
   npm install -g pm2
   pm2 start server.js --name ai-changecloth-backend
   ```
4. 設置防火牆和安全組以允許訪問端口 3001
5. 在前端環境變數中設置 `REACT_APP_BACKEND_URL` 為你的伺服器 URL

#### 選項 2: 部署到 Render 或類似平台

1. 在 Render 上創建一個 Web Service
2. 連接到你的 GitHub 倉庫
3. 設置根目錄為 `/backend`
4. 設置構建命令為 `npm install`
5. 設置啟動命令為 `npm start`
6. 添加環境變數 (FTP 配置等)
7. 在前端環境變數中設置 `REACT_APP_BACKEND_URL` 為 Render 提供的 URL

#### 選項 3: 使用 Serverless 函數 (需要修改代碼)

如果需要完全無伺服器的解決方案，需要將 FTP 上傳功能重構為使用支持的雲存儲服務 (如 AWS S3, Cloudinary 等)。

## 故障排除

### FTP 上傳在 Vercel 部署中失敗

這是預期行為。Vercel 是無伺服器平台，不支持長期運行的後端服務。請確保：

1. 你已將後端服務部署到支持的平台，或
2. 使用 Cloudinary 作為替代方案 (推薦)

### Google API 配額限制

如果遇到配額限制錯誤：

1. 切換到 OpenRouter 提供商
2. 等待配額重置（通常在每日 UTC 時間）
3. 輪換使用多個 API 金鑰
4. 考慮升級到付費計劃

### 相機在 iPad 上無法使用

請確保：
1. 使用 Safari 瀏覽器
2. 已授予相機權限
3. 沒有其他應用正在使用相機

### 圖片生成失敗

可能的原因：
1. API 金鑰無效或地區限制
2. 網絡連接問題
3. 圖片格式不支持

## 技術棧

- 前端: React, TypeScript, Vite
- 後端: Node.js, Express
- AI: Google Gemini API
- 圖片處理: Sharp (縮圖生成)
- FTP: basic-ftp
- 雲存儲: Cloudinary (推薦用於 Vercel)
- 部署: Vercel (前端), 自託管 (後端)