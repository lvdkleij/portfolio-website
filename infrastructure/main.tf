terraform {
  # Configure the Azure Provider and version
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 5.0.0"
    }
  }

  # Configure the backend to store the terraform state file in Azure Storage
  backend "azurerm" {
    resource_group_name  = "rg-portfolio-prod"
    storage_account_name = "stportfolioprod"
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
    use_oidc             = true
  }
}

provider "azurerm" {
  features {}
  use_oidc = true
}

resource "azurerm_resource_group" "rg_portfolio_prod" {
  name     = "rg-portfolio-prod"
  location = "West Europe"
}

resource "azurerm_log_analytics_workspace" "log_portfolio_prod" {
  name                = "log-portfolio-prod"
  location            = azurerm_resource_group.rg_portfolio_prod.location
  resource_group_name = azurerm_resource_group.rg_portfolio_prod.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_container_app_environment" "cae_portfolio_prod" {
  name                       = "cae-portfolio-prod"
  location                   = azurerm_resource_group.rg_portfolio_prod.location
  resource_group_name        = azurerm_resource_group.rg_portfolio_prod.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.log_portfolio_prod.id
}

resource "azurerm_container_app" "ca_portfolio_frontend_prod" {
  name                         = "ca-portfolio-frontend-prod"
  container_app_environment_id = azurerm_container_app_environment.cae_portfolio_prod.id
  resource_group_name          = azurerm_resource_group.rg_portfolio_prod.name
  revision_mode                = "Single"

  ingress {
    external_enabled = true
    target_port      = 80
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
  template {
    min_replicas               = 0
    max_replicas               = 1
    cooldown_period_in_seconds = 60

    container {
      name   = "frontend"
      image  = "mcr.microsoft.com/k8se/quickstart:latest"
      cpu    = 0.25
      memory = "0.5Gi"
    }
  }
}
