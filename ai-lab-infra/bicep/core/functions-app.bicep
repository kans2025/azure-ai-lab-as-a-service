@description('Location for Functions app.')
param location string

@description('Name prefix.')
param namePrefix string

@description('Application Insights name for logging.')
param appInsightsName string

var storageAccountName = toLower(substr('${namePrefix}funcsa', 0, 24))
var functionsAppName = '${namePrefix}-funcapp'

resource sa 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
  }
}

resource appi 'Microsoft.Insights/components@2020-02-02' existing = {
  name: appInsightsName
}

resource funcApp 'Microsoft.Web/sites@2022-09-01' = {
  name: functionsAppName
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: serverFarm.id
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      alwaysOn: true
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: saListKeys.outputs.storageConnectionString
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appi.properties.InstrumentationKey
        }
      ]
    }
    httpsOnly: true
  }
}

resource serverFarm 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: '${namePrefix}-plan'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
}

module saListKeys 'storage-listkeys.bicep' = {
  name: '${namePrefix}-sakeys'
  params: {
    storageAccountName: storageAccountName
  }
}

// helper module to get connection string
// bicep/core/storage-listkeys.bicep
// (include this file in same folder as functions-app.bicep OR inline; to keep things simple:

