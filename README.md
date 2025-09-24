<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1hfZXb8WO1Pi9b7eJ08-LO7M0sj3DthLz

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy the [.env.example](file:///Users/paulchang/Library/Mobile%20Documents/com~apple~CloudDocs/PDF/Ebees/Project/Wynn%20x%20MIF/ai-changecloth/.env.example) file to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Add your API key to the `.env` file:
     ```
     GEMINI_API_KEY=your_actual_api_key_here
     ```

3. Run the app:
   ```bash
   npm run dev
   ```

## Features

- Select from 10 traditional Chinese costume patterns
- AI-powered clothing transformation
- Background selection
- Custom frame options
- Download your final artwork