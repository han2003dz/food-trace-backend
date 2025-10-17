## 🚀 Project Setup and Run Instructions

### 🛠 Development

To run the project in development mode:

1. **Start the Docker containers**

   ```bash
   docker-compose -f docker-compose.local.yml up
   ```

2. **Handle entity changes in models**

   - If you modify any entity files:

     - Generate a new migration:

       ```bash
       npm run migration:generate --name=your-migration-name
       ```

     - If needed, delete the `build/` folder to avoid issues.
     - Run the migration:

       ```bash
       npm run migration:rundev
       ```

3. **Start the development server**

   ```bash
   npm run start:dev
   ```

4. **Start the queue (if using Bull or similar job queues)**

   ```bash
   npm run start:queue
   ```

---

### 🚢 Production

Follow these steps to deploy the application using Docker Compose:

1. **Clone the repository and navigate to project directory**

   ```bash
   git clone <repository-url>
   cd unich-presale-backend
   ```

2. **Create and configure environment file**

   ```bash
   cp .env.example .env
   # Edit .env file with your production settings
   ```

3. **Update traefik config**

First, create the required network:

```bash
docker network create its-nestjs-network
```

Create and secure acme.json for SSL certificates:

```bash
touch acme.json
chmod 600 acme.json
```

```bash
Update `update_your_email_here` to your email
Update `update_you_domain_here` to your domain
# This information is for traefik to automatically generate cert with certbot

```

4. **Configure domain to point to server ip where you deploy backend**

   ```bash
   When pointing correctly, the reverse-proxy container will automatically register the certificate with the information you configured above.
   ```

5. **Build and start the containers**

   ```bash
   # Build the images first
   docker compose build

   # Start all services in detached mode
   docker compose up -d
   ```

6. **Verify deployment**

   ```bash
   # Check running containers
   docker compose ps

   # View logs
   docker compose logs -f
   ```

The application should now be running on the configured port (default: 3333).

### 🔐 API Rate Limiting

The API is rate-limited to **20 requests per second** using the following configuration:

```yaml
secure:
  rateLimit:
    ttl: 1000 # Time to live in milliseconds
    limit: 20 # Maximum number of requests within the TTL
```

If you need to change the rate limit, you can modify this configuration in the `default.yaml` file located in the `config/` folder.

---
