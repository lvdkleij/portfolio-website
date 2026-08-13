terraform {
  # Configure the Azure Provider and version
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 5"
    }

    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5"
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

provider "cloudflare" {}


variable "domain_name" {
  type    = string
  default = "lucasvanderkleij.dev"
}

variable "cloudflare_zone_id" {
  type      = string
  sensitive = true
}


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

resource "azurerm_container_app_environment" "cae_portfolio_prod" {
  name                       = "cae-portfolio-prod"
  location                   = data.azurerm_resource_group.rg_portfolio_prod.location
  resource_group_name        = data.azurerm_resource_group.rg_portfolio_prod.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.log_portfolio_prod.id
  logs_destination           = "log-analytics"
}

resource "azurerm_container_app" "ca_portfolio_frontend_prod" {
  name                         = "ca-portfolio-frontend-prod"
  container_app_environment_id = azurerm_container_app_environment.cae_portfolio_prod.id
  resource_group_name          = data.azurerm_resource_group.rg_portfolio_prod.name
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
      name = "frontend"
      # 'image' is only used for initial creation of the container. 
      # Image updates happen in the frontend-deploy.yml
      image  = "lakleij/portfolio-frontend:latest"
      cpu    = 0.25
      memory = "0.5Gi"
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].container[0].image
    ]
  }
}

resource "cloudflare_dns_record" "frontend_apex" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  type    = "A"
  content = azurerm_container_app_environment.cae_portfolio_prod.static_ip_address
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "frontend_apex_verification" {
  zone_id = var.cloudflare_zone_id
  name    = "asuid"
  type    = "TXT"
  content = azurerm_container_app.ca_portfolio_frontend_prod.custom_domain_verification_id
  ttl     = 300
}

resource "azurerm_container_app_custom_domain" "frontend_apex" {
  name             = var.domain_name
  container_app_id = azurerm_container_app.ca_portfolio_frontend_prod.id

  depends_on = [
    cloudflare_dns_record.frontend_apex,
    cloudflare_dns_record.frontend_apex_verification
  ]

  lifecycle {
    ignore_changes = [
      certificate_binding_type,
      container_app_environment_certificate_id
    ]
  }
}

resource "cloudflare_dns_record" "frontend_www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  type    = "CNAME"
  content = azurerm_container_app.ca_portfolio_frontend_prod.ingress[0].fqdn
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "frontend_www_verification" {
  zone_id = var.cloudflare_zone_id
  name    = "asuid.www"
  type    = "TXT"
  content = azurerm_container_app.ca_portfolio_frontend_prod.custom_domain_verification_id
  ttl     = 300
}

resource "azurerm_container_app_custom_domain" "frontend_www" {
  name             = "www.${var.domain_name}"
  container_app_id = azurerm_container_app.ca_portfolio_frontend_prod.id

  depends_on = [
    cloudflare_dns_record.frontend_www,
    cloudflare_dns_record.frontend_www_verification
  ]

  lifecycle {
    ignore_changes = [
      certificate_binding_type,
      container_app_environment_certificate_id
    ]
  }
}