# Azure Deployment Guide for Pointing Poker

This guide explains how to deploy the Pointing Poker application to Azure.

## Prerequisites

1. An Azure account with an active subscription
2. Azure CLI installed locally
3. GitHub account (for GitHub Actions deployment)

## Deployment Steps

### 1. Create Azure Resources

```bash
# Login to Azure
az login

# Create a resource group
az group create --name pointing-poker-rg --location eastus

# Create App Service plan
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

### 3. Set up GitHub Actions Deployment

1. Get the publish profiles for both web apps:

```bash
# Get client publish profile
az webapp deployment list-publishing-profiles --resource-group pointing-poker-rg --name pointing-poker-client --xml > client-publish-profile.xml

# Get server publish profile
az webapp deployment list-publishing-profiles --resource-group pointing-poker-rg --name pointing-poker-server --xml > server-publish-profile.xml
```

2. Add the publish profiles as GitHub secrets:
   - Go to your GitHub repository
   - Navigate to Settings > Secrets and variables > Actions
   - Add a new repository secret named `AZURE_CLIENT_PUBLISH_PROFILE` with the content of client-publish-profile.xml
   - Add a new repository secret named `AZURE_SERVER_PUBLISH_PROFILE` with the content of server-publish-profile.xml

3. Push the code to GitHub to trigger the deployment:

```bash
git add .
git commit -m "Add Azure deployment configuration"
git push
```

### 4. Verify Deployment

After the GitHub Actions workflow completes, you can access your applications at:
- Client: https://pointing-poker-client.azurewebsites.net
- Server: https://pointing-poker-server.azurewebsites.net

## Troubleshooting

- Check the GitHub Actions logs for any deployment errors
- Review the Azure App Service logs:
  ```bash
  az webapp log tail --resource-group pointing-poker-rg --name pointing-poker-client
  az webapp log tail --resource-group pointing-poker-rg --name pointing-poker-server
  ```

## Cleanup

To remove all resources when no longer needed:

```bash
az group delete --name pointing-poker-rg --yes
``` 