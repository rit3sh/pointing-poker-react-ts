# GitHub Actions Deployment to Azure

This guide explains how to set up GitHub Actions to deploy your Pointing Poker application to Azure.

## Prerequisites

1. GitHub repository with your code
2. Azure account with App Services created
3. GitHub Actions workflow file (.github/workflows/azure-deploy.yml)

## Setup Steps

### 1. Create Azure Publish Profiles

You need to create publish profiles for both your client and server apps:

```bash
# Get client publish profile
az webapp deployment list-publishing-profiles --resource-group pointing-poker-rg --name pointing-poker-client --xml > client-publish-profile.xml

# Get server publish profile
az webapp deployment list-publishing-profiles --resource-group pointing-poker-rg --name pointing-poker-server --xml > server-publish-profile.xml
```

### 2. Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add the following secrets:
   - `AZURE_CLIENT_PUBLISH_PROFILE`: Content of client-publish-profile.xml
   - `AZURE_SERVER_PUBLISH_PROFILE`: Content of server-publish-profile.xml

### 3. Push Your Code

Push your code to the main branch to trigger the GitHub Actions workflow:

```bash
git add .
git commit -m "Set up GitHub Actions deployment"
git push
```

### 4. Monitor the Deployment

1. Go to your GitHub repository
2. Navigate to Actions tab
3. You should see your workflow running
4. Once completed, your app will be deployed to Azure

## Troubleshooting

If you encounter issues with the deployment:

1. Check the GitHub Actions logs for errors
2. Verify that your secrets are correctly set up
3. Check the Azure App Service logs:
   ```bash
   az webapp log tail --resource-group pointing-poker-rg --name pointing-poker-client
   ```

### Common Issues

1. **Missing dependencies**: Make sure all dependencies are installed before deployment
2. **Port configuration**: Ensure your app listens on the port provided by the PORT environment variable
3. **Node.js version**: Verify that your app is compatible with the Node.js version on Azure

## Updating the Deployment

If you need to make changes to your deployment process:

1. Edit the `.github/workflows/azure-deploy.yml` file
2. Commit and push your changes
3. The new workflow will be used for future deployments 