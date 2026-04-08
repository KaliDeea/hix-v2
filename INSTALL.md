# HiX Platform Installation Guide (Ubuntu 24.04)

This guide provides step-by-step instructions for installing the Hartlepool Industrial Exchange (HiX) platform on a clean Ubuntu 24.04 VM.

## 1. System Requirements
- Ubuntu 24.04 LTS
- Minimum 2GB RAM
- Node.js 20.x or higher
- Nginx (for reverse proxy)

## 2. Install Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx build-essential
```

## 3. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 4. Clone and Setup Application
```bash
git clone <your-repo-url> hix-platform
cd hix-platform
npm install
```

## 5. Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_key
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
APP_URL=https://your-domain.com
NODE_ENV=production
```

## 6. Build the Application
```bash
npm run build
```

## 7. Setup Process Manager (PM2)
```bash
sudo npm install -g pm2
pm2 start server.ts --interpreter tsx --name hix-app
pm2 save
pm2 startup
```

## 8. Configure Nginx
Create a new Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/hix
```
Add the following:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/hix /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 9. SSL Setup (Optional but Recommended)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```
