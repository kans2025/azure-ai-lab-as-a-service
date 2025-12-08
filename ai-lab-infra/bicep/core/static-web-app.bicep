@description('Location for Static Web App. (Some regions are limited; southindia is fine for global routing).')
param location string

@description('Name prefix.')
param namePrefix string

var staticWebAppName = toLower('${namePrefix}-swa')

resource swa 'Microsoft.Web/staticSites@2022-03-01' = {
  name: staticWebAppName
  location: location
  properties: {
    sku: {
      name: 'Free'
      tier: 'Free'
    }
    repositoryUrl: '__PLACEHOLDER_GITHUB_REPO_URL__' // optional metadata
  }
}

output staticWebAppName string = staticWebAppName

