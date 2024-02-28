# Dockerized Node.js Application

This is a Dockerized Node.js application with a PostgreSQL database, orchestrated using Docker Compose.

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

- The Node.js application exposes a REST API at http://localhost:3000.
- The available endpoints include:
  - `/v1/tools/lookup`: Lookup IP addresses for a given domain.
  - `/v1/tools/validate`: Validate an IP address.
  - `/v1/history`: View recent lookup history.
  - `/health`: Check the health status of the application.
- Prometheus metrics are exposed at http://localhost:3000/metrics.
