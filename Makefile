# DevHub - Development Makefile

.PHONY: help install dev build start stop clean logs test

# Default target
help: ## Show this help message
	@echo "DevHub Development Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development commands
install: ## Install all dependencies
	@echo "Installing dependencies..."
	cd server && npm install
	cd client && npm install

dev: ## Start development environment
	@echo "Starting development environment..."
	docker-compose -f docker-compose.dev.yml up --build

dev-detached: ## Start development environment in background
	@echo "Starting development environment in background..."
	docker-compose -f docker-compose.dev.yml up --build -d

# Production commands
build: ## Build production images
	@echo "Building production images..."
	docker-compose build

start: ## Start production environment
	@echo "Starting production environment..."
	docker-compose up -d

stop: ## Stop all services
	@echo "Stopping all services..."
	docker-compose down
	docker-compose -f docker-compose.dev.yml down

# Utility commands
clean: ## Clean up containers and volumes
	@echo "Cleaning up..."
	docker-compose down -v --remove-orphans
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	docker system prune -f

logs: ## Show logs for all services
	@echo "Showing logs..."
	docker-compose logs -f

logs-server: ## Show server logs
	@echo "Showing server logs..."
	docker-compose logs -f server

logs-client: ## Show client logs
	@echo "Showing client logs..."
	docker-compose logs -f client

# Database commands
db-reset: ## Reset database
	@echo "Resetting database..."
	docker-compose exec mongodb mongosh --eval "db.dropDatabase()"

db-backup: ## Backup database
	@echo "Backing up database..."
	docker-compose exec mongodb mongodump --out /backup

# Testing commands
test: ## Run all tests
	@echo "Running tests..."
	cd server && npm test
	cd client && npm test

test-server: ## Run server tests
	@echo "Running server tests..."
	cd server && npm test

test-client: ## Run client tests
	@echo "Running client tests..."
	cd client && npm test

# Status commands
status: ## Show status of all services
	@echo "Service status:"
	docker-compose ps

# Quick development setup
setup: install ## Complete development setup
	@echo "Setting up development environment..."
	cp server/.env.example server/.env
	cp client/.env.example client/.env
	@echo "Environment files created. Please edit them with your configuration."
	@echo "Then run 'make dev' to start the development environment."
 
