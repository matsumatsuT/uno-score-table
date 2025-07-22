.PHONY: up down build dev clean logs

# Start the application with Docker Compose
start:
	docker compose start

# Stop the application
stop:
	docker compose stop
	