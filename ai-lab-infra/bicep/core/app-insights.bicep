@description('Location for Application Insights.')
param location string

@description('Name prefix.')
param namePrefix string

@description('Log Analytics workspace ID.')
param workspaceId string

var appInsightsName = '${namePrefix}-appi'

resource appi 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: workspaceId
  }
}

output appInsightsName string = appInsightsName

