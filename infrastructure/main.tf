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
  #checkov:skip=CKV_AZURE_189: Container Apps needs public access to load the origin certificate. RBAC limits access to the environment identity.
  #checkov:skip=CKV2_AZURE_32: A private endpoint requires a VNet, which adds unnecessary cost for this portfolio site.
  #checkov:skip=CKV_AZURE_109: Container Apps has no fixed outbound IP without a VNet, so an IP allowlist would not work. Access still requires Entra ID and RBAC.
  name                       = "kv-portfolio-prod-${random_string.key_vault_suffix.result}"
  location                   = data.azurerm_resource_group.rg_portfolio_prod.location
  resource_group_name        = data.azurerm_resource_group.rg_portfolio_prod.name
  rbac_authorization_enabled = true
  tenant_id                  = data.azurerm_client_config.current.tenant_id

  soft_delete_retention_days    = 14
  purge_protection_enabled      = true
  public_network_access_enabled = true

  sku_name = "standard"

  network_acls {
    bypass         = "None"
    default_action = "Allow"
  }
}
