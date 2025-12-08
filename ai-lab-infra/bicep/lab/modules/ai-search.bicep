@description('Name prefix for AI Search service.')
param namePrefix string

@description('Location.')
param location string

var searchServiceName = toLower(substr('${namePrefix}-search', 0, 60))

resource search 'Microsoft.Search/searchServices@2023-11-01' = {
  name: searchServiceName
  location: location
  sku: {
    name: 'basic'
  }
  properties: {
    replicaCount: 1
    partitionCount: 1
    hostingMode: 'default'
    semanticSearch: 'free'
  }
}

output searchServiceName string = search.name
output searchServiceId string = search.id

