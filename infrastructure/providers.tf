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
  features {
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }
  use_oidc = true
}

provider "cloudflare" {}