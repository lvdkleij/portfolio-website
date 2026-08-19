data "azurerm_resource_group" "rg_portfolio_prod" {
  name = "rg-portfolio-prod"
}

data "azurerm_client_config" "current" {}

resource "azurerm_log_analytics_workspace" "log_portfolio_prod" {
  name                = "log-portfolio-prod"
  location            = data.azurerm_resource_group.rg_portfolio_prod.location
  resource_group_name = data.azurerm_resource_group.rg_portfolio_prod.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}
resource "random_string" "key_vault_suffix" {
  length  = 6
  upper   = false
  lower   = true
  numeric = true
  special = false
}
resource "azurerm_key_vault" "kv_portfolio_prod" {
  #checkov:skip=CKV2_AZURE_32: Normally I would set up a private endpoint. However, for this simple portfolio project I'll use public network + vnet to save costs.
  name                       = "kv-portfolio-prod-${random_string.key_vault_suffix.result}"
  location                   = data.azurerm_resource_group.rg_portfolio_prod.location
  resource_group_name        = data.azurerm_resource_group.rg_portfolio_prod.name
  rbac_authorization_enabled = true
  tenant_id                  = data.azurerm_client_config.current.tenant_id

  soft_delete_retention_days = 14
  purge_protection_enabled   = true

  sku_name = "standard"

  network_acls {
    default_action             = "Deny"
    virtual_network_subnet_ids = [azurerm_subnet.snet_container_apps_prod.id]
    bypass                     = "None"
  }
}