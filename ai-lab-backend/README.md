# AI LAB AS A SERVICE – Backend (Azure Functions v4)

This repository implements the control-plane backend for the AI Lab SaaS POC:

- Identity: `/me`
- Tiers: `/tiers`
- Subscriptions: `/subscriptions` (GET, POST)
- Environments (labs): `/environments`, `/environments/{id}` (GET, POST, DELETE)
- AI Experiments: `/experiments`, `/experiments/{id}`, `/experiments/{id}/run`
- Usage: `/usage/credits`, `/usage/history`

## Configuration

Set the following application settings (locally in `local.settings.json`, in Azure as App Settings):

- `COSMOS_ENDPOINT` = `__PLACEHOLDER__`
- `COSMOS_KEY` = `__PLACEHOLDER__`
- `COSMOS_DATABASE_NAME` = `ailab-control`
- `OPENAI_ENDPOINT` = `__PLACEHOLDER__`
- `OPENAI_API_KEY` = `__PLACEHOLDER__`
- `OPENAI_DEPLOYMENT_NAME` = `__PLACEHOLDER__`
- `ALLOWED_AUDIENCE` = `api://__PLACEHOLDER_BACKEND_APP_ID__`
- `LAB_RESOURCE_GROUP_PREFIX` = `rg-ailab`
- `DEFAULT_REGION` = `southindia`

## Local Development

```bash
npm install
npm run build
func start

