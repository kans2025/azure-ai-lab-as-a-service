@description('Azure region for control-plane resources.')
param location string = 'southindia'

@description('Name prefix for all control-plane resources.')
param namePrefix string = 'ailab'

@description('Admin email for alerts / budgets.')
param adminEmail string

@description('Object IDs (AAD) with admin access to Key Vault.')
param adminObjectIds array = [
  '__PLACEHOLDER_OBJECT_ID_ADMIN_1__'
]

//
// Core platform modules
//

module logAnalytics 'bicep/core/log-analytics.bicep' = {
  name: '${namePrefix}-loganalytics'
  params: {
    location: location
    namePrefix: namePrefix
  }
}

module appInsights 'bicep/core/app-insights.bicep' = {
  name: '${namePrefix}-appinsights'
  params: {
    location: location
    namePrefix: namePrefix
    workspaceId: logAnalytics.outputs.workspaceId
  }
}

module cosmos 'bicep/core/cosmosdb.bicep' = {
  name: '${namePrefix}-cosmos'
  params: {
    location: location
    namePrefix: namePrefix
    databaseName: 'ailab-control'
    useServerless: true
  }
}

module keyvault 'bicep/core/keyvault.bicep' = {
  name: '${namePrefix}-kv'
  params: {
    location: location
    namePrefix: namePrefix
    adminObjectIds: adminObjectIds
  }
}

module openai 'bicep/core/openai.bicep' = {
  name: '${namePrefix}-openai'
  params: {
    location: location
    namePrefix: namePrefix
  }
}

module functions 'bicep/core/functions-app.bicep' = {
  name: '${namePrefix}-func'
  params: {
    location: location
    namePrefix: namePrefix
    appInsightsName: appInsights.outputs.appInsightsName
  }
}

module staticWebApp 'bicep/core/static-web-app.bicep' = {
  name: '${namePrefix}-swa'
  params: {
    location: location
    namePrefix: namePrefix
  }
}

// Simple subscription-level budget for the POC
module budget 'bicep/governance/budget.bicep' = {
  name: '${namePrefix}-budget'
  // Budget must be deployed at subscription scope. For RG-scope deployment, you can
  // set scope in the module call from a subscription-level deployment.
  scope: subscription()
  params: {
    namePrefix: namePrefix
    amount: 100  // __PLACEHOLDER_POC_BUDGET_AMOUNT__
    contactEmails: [
      adminEmail
    ]
  }
}

output cosmosEndpoint string = cosmos.outputs.accountEndpoint
output cosmosDatabaseName string = cosmos.outputs.databaseId
output keyVaultName string = keyvault.outputs.keyVaultName
output functionsAppName string = functions.outputs.functionsAppName
output staticWebAppName string = staticWebApp.outputs.staticWebAppName
output openaiEndpoint string = openai.outputs.endpoint
output openaiAccountName string = openai.outputs.accountName

