# Azure Deployment Troubleshooting

If you're seeing the "Your web app is running and waiting for your content" message, follow these steps:

## Option 1: Deploy using FTP

1. **Prepare your files**:
   - Make sure you have built your application with `npm run build`
   - The `dist` folder should contain all the necessary files

2. **Upload to Azure**:
   - Connect to your Azure Web App using FTP
   - Upload ALL files from the `dist` directory to the `/site/wwwroot` directory
   - Make sure to include the updated `web.config`, `server.js`, and `package.json` files

3. **Configure App Settings in Azure Portal**:
   - Go to your App Service in the Azure Portal
   - Navigate to Configuration > Application settings
   - Add these settings:
     - `WEBSITE_NODE_DEFAULT_VERSION` = `~18`
     - `SCM_DO_BUILD_DURING_DEPLOYMENT` = `true`

4. **Restart your App Service**:
   - In the Azure Portal, go to your App Service
   - Click on "Restart" in the top menu

## Option 2: Deploy using ZIP Deploy

1. **Create a ZIP file**:
   - Compress all files in the `dist` directory into a ZIP file

2. **Deploy using Azure Portal**:
   - Go to your App Service in the Azure Portal
   - Navigate to Deployment Center
   - Choose "ZIP Deploy"
   - Upload your ZIP file

3. **Restart your App Service**:
   - In the Azure Portal, go to your App Service
   - Click on "Restart" in the top menu

## Option 3: Use the Azure CLI

If you have the Azure CLI installed, you can use this command:

```bash
az webapp deployment source config-zip --resource-group <your-resource-group> --name <your-app-name> --src dist.zip
```

## Troubleshooting

If you're still seeing issues:

1. **Check the logs**:
   - In the Azure Portal, go to your App Service
   - Navigate to "Log stream" to see real-time logs

2. **Verify the default document**:
   - In the Azure Portal, go to your App Service
   - Navigate to Configuration > Default documents
   - Make sure "index.html" is in the list and at the top

3. **Try the Node.js approach**:
   - If the static site approach isn't working, the included `server.js` file will serve your app using Express
   - Make sure your App Service is configured to use Node.js 