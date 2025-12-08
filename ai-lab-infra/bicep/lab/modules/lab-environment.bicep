@description('Tenant ID of the lab owner.')
param tenantId string

@description('Environment ID (e.g. env-123).')
param environmentId string

@description('Tier id (student/starter/professional/enterprise-lite).')
param tierId string

@description('Region for lab resources.')
param location string = 'southindia'

@description('Base name prefix.')
param namePrefix string = 'ailab'

var rgName = '${namePrefix}-${tenantId}-${environmentId}'

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: rgName
  location: location
}

// Storage account in lab RG
module storage 'modules/storage.bicep' = {
  name: 'storage'
  scope: rg
  params: {
    namePrefix: '${namePrefix}${environmentId}'
    location: location
  }
}

// Optional: AI Search, enabled for select tiers
var enableAiSearch = contains([
  'starter'
  'professional'
  'enterprise-lite'
], tierId)

module aiSearch 'modules/ai-search.bicep' = if (enableAiSearch) {
  name: 'aisearch'
  scope: rg
  params: {
    namePrefix: '${namePrefix}${environmentId}'
    location: location
  }
}

// Optional: user-assigned identity for lab workloads
module identity 'modules/managed-identity.bicep' = {
  name: 'lab-identity'
  scope: rg
  params: {
    namePrefix: '${namePrefix}${environmentId}'
    location: location
  }
}

output resourceGroupName string = rgName
output storageAccountName string = storage.outputs.storageAccountName
output searchServiceName string = enableAiSearch ? aiSearch.outputs.searchServiceName : ''
output managedIdentityId string = identity.outputs.id

