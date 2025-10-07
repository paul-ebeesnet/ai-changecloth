# 後端服務部署指南

## 重要提醒：Vercel 部署限制

⚠️ **重要**: 由於 Vercel 是無伺服器平台，**無法直接運行此後端服務**。您必須將後端服務部署到其他支持長時間運行進程的平台。

### Vercel 部署限制說明：
1. Vercel 不支持長時間運行的後端服務（如您的 Node.js Express 服務器）
2. FTP 上傳功能需要持續運行的後端服務來維持連接
3. 如果僅部署到 Vercel，FTP 功能將無法工作

## 部署選項

### 選項 1: 部署到雲伺服器 (推薦)

#### 1. 準備伺服器
- 選擇雲服務提供商 (AWS, DigitalOcean, Linode, 阿里雲, 腾訊雲等)
- 創建一個 Ubuntu 20.04+ 伺服器實例
- 確保安全組/防火牆允許端口 3001 的入站連接

#### 2. 安裝依賴
```bash
# 更新系統
sudo apt update && sudo apt upgrade -y

# 安裝 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安裝 PM2 (進程管理器)
sudo npm install -g pm2
```

#### 3. 部署應用
```bash
# 克隆或上傳代碼到伺服器
git clone <your-repo-url>
cd ai-changecloth/backend

# 安裝依賴
npm install

# 創建環境變數文件
cp .env.example .env
# 編輯 .env 文件，填入 FTP 配置和其他必要設置
nano .env
```

#### 4. 配置 PM2
```bash
# 啟動應用
pm2 start server.js --name ai-changecloth-backend

# 設置開機自啟
pm2 startup
pm2 save
```

#### 5. 設置反向代理 (可選但推薦)
使用 Nginx 設置 SSL 和反向代理：

```bash
# 安裝 Nginx
sudo apt install nginx -y

# 創建 Nginx 配置
sudo nano /etc/nginx/sites-available/ai-changecloth
```

Nginx 配置示例：
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替換為你的域名

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

啟用配置：
```bash
sudo ln -s /etc/nginx/sites-available/ai-changecloth /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. 在前端設置環境變數
在 Vercel 項目設置中添加環境變數：
- `REACT_APP_BACKEND_URL`: https://your-domain.com (或 http://your-server-ip:3001)

### 選項 2: 部署到 Render

#### 1. 在 Render 上創建 Web Service
- 訪問 https://render.com
- 點擊 "New" -> "Web Service"
- 連接到你的 GitHub 倉庫

#### 2. 配置設置
- Name: ai-changecloth-backend
- Region: 選擇離你最近的區域
- Branch: main (或你的默認分支)
- Root Directory: backend
- Environment: Node
- Build Command: npm install
- Start Command: npm start
- Instance Type: Free (或選擇適合的付費方案)

#### 3. 添加環境變數
在 "Advanced" 部分添加環境變數：
- FTP_HOST
- FTP_PORT
- FTP_USER
- FTP_PASSWORD

#### 4. 創建部署
點擊 "Create Web Service" 開始部署。

#### 5. 在前端設置環境變數
Render 會為你的服務提供一個 URL，類似於：
`https://ai-changecloth-backend.onrender.com`

在 Vercel 項目設置中添加環境變數：
- `REACT_APP_BACKEND_URL`: https://ai-changecloth-backend.onrender.com

### 選項 3: 部署到 Heroku

#### 1. 創建 Heroku 應用
- 訪問 https://heroku.com
- 創建新應用
- 連接到你的 GitHub 倉庫

#### 2. 配置部署
- 選擇 `/backend` 目錄
- 設置環境變數 (FTP 配置等)
- 啟用自動部署

#### 3. 在前端設置環境變數
Heroku 會為你的應用提供一個 URL，類似於：
`https://your-app-name.herokuapp.com`

在 Vercel 項目設置中添加環境變數：
- `REACT_APP_BACKEND_URL`: https://your-app-name.herokuapp.com

## 環境變數配置

確保在部署環境中設置以下環境變數：

```bash
# FTP 配置
FTP_HOST=ebeesnet.com
FTP_PORT=21
FTP_USER=your_ftp_username
FTP_PASSWORD=your_ftp_password

# 服務端口
PORT=3001
```

## 監控和日誌

### 使用 PM2 監控 (雲伺服器)
```bash
# 查看應用狀態
pm2 status

# 查看日誌
pm2 logs ai-changecloth-backend

# 重啟應用
pm2 restart ai-changecloth-backend
```

### 使用 Render 監控
- 在 Render 儀表板中查看部署狀態
- 點擊服務查看實時日誌
- 設置通知以獲取部署更新

### 使用 Heroku 監控
- 使用 `heroku logs --tail` 查看實時日誌
- 在 Heroku 儀表板中查看應用狀態

## 故障排除

### 常見問題

1. **FTP 連接失敗**
   - 檢查 FTP 憑證是否正確
   - 確保 FTP 服務器可從部署環境訪問
   - 檢查防火牆設置

2. **應用無法啟動**
   - 檢查 PM2 日誌: `pm2 logs ai-changecloth-backend`
   - 確保所有環境變數已正確設置
   - 檢查端口是否被佔用

3. **內存不足**
   - 升級伺服器配置
   - 調整 Node.js 內存限制

4. **Vercel 部署後無法上傳**
   - 確保已部署後端服務到獨立平台
   - 確保 `REACT_APP_BACKEND_URL` 環境變數已正確設置
   - 測試後端服務 URL 是否可訪問

### 日誌查看

```bash
# PM2 日誌
pm2 logs

# 系統日誌
journalctl -u nginx -f  # Nginx 日誌
tail -f /var/log/nginx/access.log  # Nginx 訪問日誌
tail -f /var/log/nginx/error.log   # Nginx 錯誤日誌
```