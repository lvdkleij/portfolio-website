resource "azurerm_container_app_environment" "cae_portfolio_prod" {
  name                       = "cae-portfolio-prod"
  location                   = data.azurerm_resource_group.rg_portfolio_prod.location
  resource_group_name        = data.azurerm_resource_group.rg_portfolio_prod.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.log_portfolio_prod.id
  logs_destination           = "log-analytics"

  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_role_assignment" "container_apps_key_vault_secrets" {
  scope                = azurerm_key_vault.kv_portfolio_prod.id
  role_definition_name = "Key Vault Secrets User"
  principal_id = (
    azurerm_container_app_environment
    .cae_portfolio_prod
    .identity[0]
    .principal_id
  )
}

##################
##################
####
#### Backend App
####
##################
##################

resource "azurerm_container_app" "ca_portfolio_backend_prod" {
  name                         = "ca-portfolio-backend-prod"
  container_app_environment_id = azurerm_container_app_environment.cae_portfolio_prod.id
  resource_group_name          = data.azurerm_resource_group.rg_portfolio_prod.name
  revision_mode                = "Single"

  ingress {
    external_enabled = false
    target_port      = 8080

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas               = 0
    max_replicas               = 1
    cooldown_period_in_seconds = 120

    container {
      name = "backend"
      # 'image' is only used for initial creation of the container. 
      # Image updates happen in the backend-deploy.yml
      image  = "lakleij/portfolio-backend:latest"
      cpu    = 0.5
      memory = "1Gi"
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].container[0].image
    ]
  }

  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_role_assignment" "backend_foundry_agent_consumer" {
  scope                = azurerm_cognitive_account.aif_portfolio_prod.id
  role_definition_name = "Cognitive Services User"
  principal_id         = azurerm_container_app.ca_portfolio_backend_prod.identity[0].principal_id
}

##################
##################
####
#### Frontend App
####
##################
##################

resource "azurerm_container_app" "ca_portfolio_frontend_prod" {
  name                         = "ca-portfolio-frontend-prod"
  container_app_environment_id = azurerm_container_app_environment.cae_portfolio_prod.id
  resource_group_name          = data.azurerm_resource_group.rg_portfolio_prod.name
  revision_mode                = "Single"

  ingress {
    external_enabled = true
    target_port      = 8080
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas               = 0
    max_replicas               = 1
    cooldown_period_in_seconds = 600

    container {
      name = "frontend"
      # 'image' is only used for initial creation of the container. 
      # Image updates happen in the frontend-deploy.yml
      image  = "lakleij/portfolio-frontend:latest"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        # Because the backend and frontend Container Apps share the same environment,
        # the frontend can privately reach the backend through its internal ingress.
        name  = "BACKEND_BASE_URL"
        value = "http://ca-portfolio-backend-prod"
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].container[0].image
    ]
  }
}



# ### Custom Domain via Cloudflare

locals {
  cloudflare_origin_certificate_name = "cloudflare-origin-frontend"

  cloudflare_origin_certificate_secret_id = format(
    "%s/secrets/%s",
    trimsuffix(azurerm_key_vault.kv_portfolio_prod.vault_uri, "/"),
    local.cloudflare_origin_certificate_name
  )
}

resource "azurerm_container_app_environment_certificate" "frontend_origin" {
  name                         = "cloudflare-origin-frontend"
  container_app_environment_id = azurerm_container_app_environment.cae_portfolio_prod.id

  certificate_key_vault {
    identity            = "System"
    key_vault_secret_id = local.cloudflare_origin_certificate_secret_id
  }

  depends_on = [
    azurerm_role_assignment.container_apps_key_vault_secrets
  ]
}


# # 

variable "domain_name" {
  type    = string
  default = "lucasvanderkleij.dev"
}

variable "cloudflare_zone_id" {
  type      = string
  sensitive = true
}

resource "cloudflare_dns_record" "frontend_chat" {
  zone_id = var.cloudflare_zone_id
  name    = "chat"
  type    = "CNAME"
  content = azurerm_container_app.ca_portfolio_frontend_prod.ingress[0].fqdn
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "frontend_chat_verification" {
  zone_id = var.cloudflare_zone_id
  name    = "asuid.chat"
  type    = "TXT"
  content = azurerm_container_app.ca_portfolio_frontend_prod.custom_domain_verification_id
  ttl     = 300
}

resource "azurerm_container_app_custom_domain" "frontend_chat" {
  name             = "chat.${var.domain_name}"
  container_app_id = azurerm_container_app.ca_portfolio_frontend_prod.id
  container_app_environment_certificate_id = (
    azurerm_container_app_environment_certificate.frontend_origin.id
  )
  certificate_binding_type = "SniEnabled"

  depends_on = [
    cloudflare_dns_record.frontend_chat,
    cloudflare_dns_record.frontend_chat_verification
  ]
}

resource "cloudflare_bot_management" "strict" {
  zone_id = var.cloudflare_zone_id

  fight_mode = true

  ai_bots_protection      = "block"
  content_bots_protection = "disabled"
  crawler_protection      = "enabled"

  enable_js = true

  cf_robots_variant     = "policy_only"
  is_robots_txt_managed = true
}

resource "cloudflare_ruleset" "country_allowlist" {
  zone_id     = var.cloudflare_zone_id
  name        = "Country allowlist"
  kind        = "zone"
  phase       = "http_request_firewall_custom"
  description = "Only permit traffic from approved Western European countries"

  rules = [{
    ref         = "block_countries_outside_allowlist"
    description = "Block traffic outside BE, ES, IT, PT, GB, NL, LU, FR and DE"
    expression  = "(not ip.src.country in {\"BE\" \"ES\" \"IT\" \"PT\" \"GB\" \"NL\" \"LU\" \"FR\" \"DE\"})"
    action      = "block"
    enabled     = true
  }]
}

resource "cloudflare_ruleset" "rate_limit" {
  zone_id     = var.cloudflare_zone_id
  name        = "Zone rate limiting"
  description = "Limit excessive requests per client IP"
  kind        = "zone"
  phase       = "http_ratelimit"

  rules = [{
    ref         = "rate_limit_by_ip"
    description = "Block clients exceeding 45 requests per 10 seconds"
    expression  = "(not cf.client.bot)"
    action      = "block"
    enabled     = true

    ratelimit = {
      characteristics     = ["cf.colo.id", "ip.src"]
      period              = 10
      requests_per_period = 45
      mitigation_timeout  = 10
    }
  }]
}

resource "cloudflare_zone_setting" "tls_1_3" {
  zone_id    = var.cloudflare_zone_id
  setting_id = "tls_1_3"
  value      = "on"
}

resource "cloudflare_zone_setting" "automatic_https_rewrites" {
  zone_id    = var.cloudflare_zone_id
  setting_id = "automatic_https_rewrites"
  value      = "on"
}

resource "cloudflare_zone_setting" "ssl" {
  zone_id    = var.cloudflare_zone_id
  setting_id = "ssl"
  value      = "strict"
}

resource "cloudflare_zone_setting" "always_use_https" {
  zone_id    = var.cloudflare_zone_id
  setting_id = "always_use_https"
  value      = "on"
}
