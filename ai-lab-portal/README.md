# AI LAB AS A SERVICE – Portal (ai-lab-portal)

Vite + React SPA for students and corporate users to:

- Sign in with Azure Entra ID
- Select AI lab tiers
- View and manage lab environments
- Run guided AI experiments

## Configuration

Create a `.env` file:

```bash
VITE_API_BASE_URL="__PLACEHOLDER_FUNCTIONS_API_URL__"
VITE_AZURE_AD_CLIENT_ID="__PLACEHOLDER_AZURE_AD_APP_CLIENT_ID__"
VITE_AZURE_AD_TENANT_ID="__PLACEHOLDER_TENANT_ID__"
VITE_BACKEND_API_APP_ID_URI="api://__PLACEHOLDER_BACKEND_APP_ID__"
