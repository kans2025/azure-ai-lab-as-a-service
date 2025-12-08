@description('Name prefix for storage account.')
param namePrefix string

@description('Location.')
param location string

var storageAccountName = toLower(substr('${namePrefix}sa', 0, 24))

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

output storageAccountName string = storageAccountName
output storageAccountId string = sa.id

