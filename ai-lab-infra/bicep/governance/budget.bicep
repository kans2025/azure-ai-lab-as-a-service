@description('Prefix for budget name.')
param namePrefix string

@description('Monthly budget amount in target currency.')
param amount int

@description('Email contacts for budget alerts.')
param contactEmails array

var budgetName = '${namePrefix}-monthly-budget'

// NOTE: This module is meant to be deployed at subscription() scope.

resource budget 'Microsoft.Consumption/budgets@2021-10-01' = {
  name: budgetName
  scope: subscription().id
  properties: {
    category: 'Cost'
    amount: amount
    timeGrain: 'Monthly'
    timePeriod: {
      startDate: dateTimeAdd(utcNow(), '-P1D')
      endDate: dateTimeAdd(utcNow(), 'P365D')
    }
    notifications: {
      Actual_GreaterThan_80_Percent: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 80
        contactEmails: contactEmails
        thresholdType: 'Actual'
      }
      Actual_GreaterThan_100_Percent: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 100
        contactEmails: contactEmails
        thresholdType: 'Actual'
      }
    }
  }
}

