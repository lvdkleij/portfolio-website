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