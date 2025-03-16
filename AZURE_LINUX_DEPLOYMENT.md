# Azure App Service (Linux) Deployment Guide

This guide explains how to deploy the Pointing Poker application to Azure App Service on Linux.

## Prerequisites

1. An Azure account with an active subscription
2. Azure CLI installed locally

## Deployment Steps

### 1. Create Azure Resources

```bash
# Login to Azure
az login

# Create a resource group
az group create --name pointing-poker-rg --location eastus

# Create App Service plan (Linux)
az appservice plan create --name pointing-poker-plan --resource-group pointing-poker-rg --sku B1 --is-linux

# Create Web App for client
az webapp create --resource-group pointing-poker-rg --plan pointing-poker-plan --name pointing-poker-client --runtime "NODE:18-lts"

# Create Web App for server
az webapp create --resource-group pointing-poker-rg --plan pointing-poker-plan --name pointing-poker-server --runtime "NODE:18-lts"
```

### 2. Configure Web Apps

```bash
# Configure client app settings
az webapp config appsettings set --resource-group pointing-poker-rg --name pointing-poker-client --settings WEBSITE_NODE_DEFAULT_VERSION=18-lts SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Configure server app settings
az webapp config appsettings set --resource-group pointing-poker-rg --name pointing-poker-server --settings WEBSITE_NODE_DEFAULT_VERSION=18-lts SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

### 3. Deploy the Client

#### Option 1: Deploy using ZIP Deploy

1. Build your application:
```bash
npm run build
```

2. Add the necessary server files to the dist directory:
   - server.js - A simple Express server to serve the static files
   - package.json - With Express as a dependency and a start script
   - web.config - For IIS configuration (optional for Linux)

3. Create a ZIP file of the dist directory:
```bash
cd dist
zip -r ../dist.zip *
cd ..
```

4. Deploy using Azure CLI:
```bash
az webapp deployment source config-zip --resource-group pointing-poker-rg --name pointing-poker-client --src dist.zip
```

#### Option 2: Deploy using FTP

1. Get the FTP deployment credentials:
```bash
az webapp deployment list-publishing-credentials --resource-group pointing-poker-rg --name pointing-poker-client
```

2. Use an FTP client to upload all files from the dist directory to the /home/site/wwwroot directory.

### 4. Verify Deployment

After deployment, you can access your application at:
- Client: https://pointing-poker-client.azurewebsites.net

## Troubleshooting

- Check the logs:
```bash
az webapp log tail --resource-group pointing-poker-rg --name pointing-poker-client
```

- If you see "Application Error" or the app doesn't start:
  - Make sure server.js is properly configured
  - Check that package.json has the correct dependencies and start script
  - Verify that the Node.js version is compatible

- If you need to SSH into the container:
```bash
az webapp ssh --resource-group pointing-poker-rg --name pointing-poker-client
``` 