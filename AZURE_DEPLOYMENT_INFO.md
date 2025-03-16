# Pointing Poker - Azure Deployment

This document provides information about the Azure deployment of the Pointing Poker application.

## Deployment Architecture

The application is deployed to Azure using the following architecture:

1. **Client Application**: 
   - Deployed to: https://pointing-poker-client.azurewebsites.net
   - Hosted on: Azure App Service (Node.js)
   - Serves the React frontend application

2. **Server Application**:
   - Deployed to: https://pointing-poker-server.azurewebsites.net
   - Hosted on: Azure App Service (Node.js)
   - Provides the Socket.IO backend for real-time communication

## Environment Configuration

The application uses environment variables to handle different deployment environments:

- `.env.development`: Configuration for local development
- `.env.production`: Configuration for production deployment

Key environment variables:
- `VITE_SOCKET_URL`: URL of the Socket.IO server

## Deployment Process

The application is deployed using GitHub Actions. The workflow is defined in `.github/workflows/azure-deploy.yml`.

The deployment process:
1. Builds the client application
2. Adds necessary server files to the dist folder
3. Installs dependencies in the dist folder
4. Deploys the client to Azure
5. Builds and deploys the server to Azure

## CORS Configuration

The server is configured to allow CORS requests from:
- http://localhost:5173 (local development)
- https://pointing-poker-client.azurewebsites.net (production)

## Troubleshooting

If you encounter issues with the deployment:

1. Check the GitHub Actions logs for errors
2. Verify that the environment variables are correctly set
3. Check the Azure App Service logs:
   ```bash
   az webapp log tail --resource-group pointing-poker-rg --name pointing-poker-client
   az webapp log tail --resource-group pointing-poker-rg --name pointing-poker-server
   ```

## Local Development

To run the application locally:

1. Start the server:
   ```bash
   cd server
   npm install
   npm run dev
   ```

2. Start the client:
   ```bash
   npm install
   npm run dev
   ```

The client will be available at http://localhost:5173 and will connect to the server at http://localhost:3001. 