param storageAccountName string

resource sa 'Microsoft.Storage/storageAccounts@2023-01-01' existing = {
  name: storageAccountName
}

output storageConnectionString string = 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${listKeys(sa.id, sa.apiVersion).keys[0].value};EndpointSuffix=${environment().suffixes.storage}'

