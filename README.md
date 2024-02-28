## Introduction

This project provides a Dockerized Node.js application showcasing basic functionalities and database interaction.

## Prerequisites

Before running this application, make sure you have the following installed on your system:

- Docker
- Docker Compose

## Getting Started

To run this application locally, follow these steps:

1. Clone this repository to your local machine:

   ```bash
   git clone https://github.com/LuSicong22/stakefish.git
   ```

2. Navigate to the project directory:
   ```bash
    cd stakefish
   ```
3. Set up environment variables:

   - Create a .env file in the root directory of the project.

   - Add the following environment variables to the .env file, replacing placeholders with your actual database credentials:

   ```bash
    DB_USER=your_db_user
    DB_HOST=your_db_host
    DB_NAME=your_db_name
    DB_PASSWORD=your_db_password
   ```

4. Build and start the Docker containers:

```bash
docker-compose up -d --build
```

4. Access your Node.js application in a web browser at http://localhost:3000.

## Directory Structure

- `src/`: Contains the Node.js application source code.
- `Dockerfile`: Defines instructions for building the Docker image.
- `docker-compose.yml`: Defines services, networks, and volumes for Docker Compose.

## Usage

The available endpoints include:

- `GET /`: Returns basic information about the application version, current date, and whether it's running under Kubernetes.
- `GET /v1/tools/lookup`: Takes a domain parameter and performs a DNS lookup, returning details and storing them in the database if successful.
- `POST /v1/tools/validate`: Takes an ip parameter and validates its format.
- `GET /v1/history`: Retrieves the last 20 entries from the database containing DNS lookup history.
- `GET /metrics`: Exposes Prometheus metrics for monitoring.
- `GET /health`: Returns a simple "OK" message for health checks.
