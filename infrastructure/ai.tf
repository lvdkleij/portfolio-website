resource "azurerm_cognitive_account" "aif_portfolio_prod" {
  #checkov:skip=CKV2_AZURE_22: Microsoft-managed encryption is sufficient for this non-regulated portfolio workload.
  name                          = "aif-portfolio-prod"
  location                      = data.azurerm_resource_group.rg_portfolio_prod.location
  resource_group_name           = data.azurerm_resource_group.rg_portfolio_prod.name
  kind                          = "AIServices"
  sku_name                      = "S0"
  project_management_enabled    = true
  custom_subdomain_name         = "aif-portfolio-prod"
  local_auth_enabled            = false
  public_network_access_enabled = false

  identity {
    type = "SystemAssigned"
  }
}


resource "azurerm_cognitive_account_project" "aif_proj_portfolio_prod" {
  name                 = "aif_proj_portfolio_prod"
  cognitive_account_id = azurerm_cognitive_account.aif_portfolio_prod.id
  location             = data.azurerm_resource_group.rg_portfolio_prod.location
  description          = "Project used to manage AI services used by portfolio website"
  display_name         = "Portfolio Project"

  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_cognitive_deployment" "aif_cd_portfolio_prod" {
  name                 = "aif_cd_portfolio_prod"
  cognitive_account_id = azurerm_cognitive_account.aif_portfolio_prod.id

  model {
    format  = "OpenAI"
    name    = "gpt-4.1-mini"
    version = "2025-04-14"
  }

  sku {
    name     = "GlobalStandard"
    capacity = 1
  }
  dynamic_throttling_enabled = false

  version_upgrade_option = "NoAutoUpgrade"
}