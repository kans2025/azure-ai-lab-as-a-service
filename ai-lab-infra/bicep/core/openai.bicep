@description('Location for Azure OpenAI resource.')
param location string

@description('Name prefix.')
param namePrefix string

var accountName = toLower('${namePrefix}-aoai')

resource openai 'Microsoft.CognitiveServices/accounts@2023-10-01' = {
  name: accountName
  location: location
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  properties: {
    apiProperties: {
      statisticsEnabled: true
    }
  }
}

output accountName string = accountName
output endpoint string = openai.properties.endpoint

