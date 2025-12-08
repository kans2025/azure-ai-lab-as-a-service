@description('Location for Cosmos DB account.')
param location string

@description('Name prefix for Cosmos DB account.')
param namePrefix string = 'ailab'

@description('Logical database name for the control plane.')
param databaseName string = 'ailab-control'

@description('If true, deploy as serverless. If false, you can set throughput per container.')
param useServerless bool = true

@description('Default TTL (in seconds) for Environments container; -1 disables TTL.')
@minValue(-1)
param environmentsDefaultTtl int = 60 * 60 * 24 * 60 // 60 days

@description('Default TTL (in seconds) for UsageSnapshots container; -1 disables TTL.')
@minValue(-1)
param usageDefaultTtl int = 60 * 60 * 24 * 90 // 90 days

var accountName = toLower('${namePrefix}cosmos')

resource cosmos 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: accountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    capabilities: useServerless ? [
      {
        name: 'EnableServerless'
      }
    ] : []
  }
}

resource sqlDb 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-05-15' = {
  name: '${cosmos.name}/${databaseName}'
  properties: {
    resource: {
      id: databaseName
    }
  }
}

// Users – pk /tenantId
resource users 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  name: '${sqlDb.name}/Users'
  properties: {
    resource: {
      id: 'Users'
      partitionKey: {
        paths: [
          '/tenantId'
        ]
        kind: 'Hash'
      }
      defaultTtl: -1
    }
  }
}

// Subscriptions – pk /tenantId
resource subscriptions 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  name: '${sqlDb.name}/Subscriptions'
  properties: {
    resource: {
      id: 'Subscriptions'
      partitionKey: {
        paths: [
          '/tenantId'
        ]
        kind: 'Hash'
      }
      defaultTtl: -1
    }
  }
}

// TierDefinitions – pk /id
resource tierDefinitions 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  name: '${sqlDb.name}/TierDefinitions'
  properties: {
    resource: {
      id: 'TierDefinitions'
      partitionKey: {
        paths: [
          '/id'
        ]
        kind: 'Hash'
      }
      defaultTtl: -1
    }
  }
}

// Environments – pk /tenantId
resource environments 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  name: '${sqlDb.name}/Environments'
  properties: {
    resource: {
      id: 'Environments'
      partitionKey: {
        paths: [
          '/tenantId'
        ]
        kind: 'Hash'
      }
      defaultTtl: environmentsDefaultTtl
    }
  }
}

// UsageSnapshots – pk /tenantId
resource usageSnapshots 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  name: '${sqlDb.name}/UsageSnapshots'
  properties: {
    resource: {
      id: 'UsageSnapshots'
      partitionKey: {
        paths: [
          '/tenantId'
        ]
        kind: 'Hash'
      }
      defaultTtl: usageDefaultTtl
    }
  }
}

// AIExperiments – pk /id
resource aiExperiments 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = {
  name: '${sqlDb.name}/AIExperiments'
  properties: {
    resource: {
      id: 'AIExperiments'
      partitionKey: {
        paths: [
          '/id'
        ]
        kind: 'Hash'
      }
      defaultTtl: -1
    }
  }
}

output accountName string = cosmos.name
output accountEndpoint string = cosmos.properties.documentEndpoint
output databaseId string = databaseName

