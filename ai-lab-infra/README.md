# AI LAB AS A SERVICE – Infrastructure (ai-lab-infra)

Bicep codebase for the AI Lab SaaS POC control plane and lab environments.

## Structure

- `main.bicep` – control-plane orchestration:
  - Cosmos DB (`ailab-control` with all containers)
  - Key Vault
  - Azure OpenAI
  - Log Analytics + App Insights
  - Functions App (backend)
  - Static Web App (portal host)
  - Subscription-level budget

- `bicep/core` – reusable modules
- `bicep/lab` – per-environment lab deployment (RG, Storage, optional AI Search, Managed Identity)
- `tiers/` – example parameter files for different tiers

## Deploy control plane (RG scope)

```bash
az group create -n "__PLACEHOLDER_CONTROL_PLANE_RG__" -l southindia

az deployment group create \
  -g "__PLACEHOLDER_CONTROL_PLANE_RG__" \
  -f main.bicep \
  -p namePrefix="ailab" \
     adminEmail="__PLACEHOLDER_ADMIN_EMAIL__" \
     adminObjectIds='[
       "__PLACEHOLDER_OBJECT_ID_ADMIN_1__"
     ]'

