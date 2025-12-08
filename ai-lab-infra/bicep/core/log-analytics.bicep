@description('Location for Log Analytics workspace.')
param location string

@description('Name prefix.')
param namePrefix string

var workspaceName = '${namePrefix}-law'

resource workspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: workspaceName
  location: location
  properties: {
    retentionInDays: 30
    features: {
      legacy: 0
      searchVersion: 1
    }
  }
}

output workspaceId string = workspace.id
output workspaceName string = workspaceName

