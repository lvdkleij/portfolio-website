data "azurerm_resource_group" "rg_portfolio_prod" {
  name = "rg-portfolio-prod"
}

resource "azurerm_log_analytics_workspace" "log_portfolio_prod" {
  name                = "log-portfolio-prod"
  location            = data.azurerm_resource_group.rg_portfolio_prod.location
  resource_group_name = data.azurerm_resource_group.rg_portfolio_prod.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

