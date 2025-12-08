@description('Location for Key Vault.')
param location string

@description('Name prefix.')
param namePrefix string

@description('Admin object IDs with full permissions.')
param adminObjectIds array

var keyVaultName = toLower('${namePrefix}-kv')

resource kv 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: false
    accessPolicies: [
      for objId in adminObjectIds: {
        tenantId: subscription().tenantId
        objectId: objId
        permissions: {
          secrets: [
            'get'
            'set'
            'list'
            'delete'
            'recover'
            'backup'
            'restore'
          ]
        }
      }
    ]
  }
}

output keyVaultName string = keyVaultName
output keyVaultId string = kv.id

