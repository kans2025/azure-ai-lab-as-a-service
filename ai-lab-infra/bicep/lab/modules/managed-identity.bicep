@description('Name prefix for managed identity.')
param namePrefix string

@description('Location.')
param location string

var miName = '${namePrefix}-mi'

resource mi 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: miName
  location: location
}

output identityName string = miName
output principalId string = mi.properties.principalId
output clientId string = mi.properties.clientId
output id string = mi.id

