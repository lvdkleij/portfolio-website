# Did not enable vnet in the end because the automatically created load balancer 
# costs about 22 euro per month, which I don't want to spend for this project
# instead, the resources are protected by RBAC and other limits which I adhere as sufficent

# resource "azurerm_virtual_network" "vnet_portfolio_prod" {
#   name                = "vnet-portfolio-prod"
#   location            = data.azurerm_resource_group.rg_portfolio_prod.location
#   resource_group_name = data.azurerm_resource_group.rg_portfolio_prod.name
#   address_space       = ["10.0.0.0/16"]
# }

# resource "azurerm_subnet" "snet_container_apps_prod" {
#   name                 = "snet-container-apps-prod"
#   resource_group_name  = data.azurerm_resource_group.rg_portfolio_prod.name
#   virtual_network_name = azurerm_virtual_network.vnet_portfolio_prod.name
#   address_prefixes     = ["10.0.1.0/24"]

#   service_endpoint {
#     service = "Microsoft.CognitiveServices"
#   }

#   service_endpoint {
#     service = "Microsoft.KeyVault"
#   }

#   delegation {
#     name = "container-apps"

#     service_delegation {
#       name = "Microsoft.App/environments"

#       actions = [
#         "Microsoft.Network/virtualNetworks/subnets/join/action"
#       ]
#     }
#   }
# }

# resource "azurerm_network_security_group" "nsg_container_apps_prod" {
#   name                = "nsg-container-apps-prod"
#   location            = data.azurerm_resource_group.rg_portfolio_prod.location
#   resource_group_name = data.azurerm_resource_group.rg_portfolio_prod.name
# }

# resource "azurerm_subnet_network_security_group_association" "container_apps" {
#   subnet_id                 = azurerm_subnet.snet_container_apps_prod.id
#   network_security_group_id = azurerm_network_security_group.nsg_container_apps_prod.id
# }