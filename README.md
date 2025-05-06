# SUNO PROXY
## A Suno API interface
<p align="center">
  <img src="./public/suno_proxy.webp" alt="Suno proxy" />
</p>

---
### Demo:
- API entrypoint: https://api.suno-proxy.click/
- Documentation: https://api.suno-proxy.click/docs
- Status page: https://suno-proxy.click
---
This is an application that serves as an interface or proxy to retrieve data from an external website (Suno, a music generation service). The project consists of two main parts:
# Backend (API server):
* Handles requests to the external API to retrieve information about:
    - Playlists (playlistController.ts)
    - Individual songs/clips (songController.ts)
    - User profiles (userController.ts)
    - Trending lists (trendingController.ts)
* Implements a caching system to optimize performance
* Includes an API call monitoring system (apiMonitor.ts) that:
    - Logs call statistics (successes, errors, timeouts, etc.)
    - Maintains an error history
    - Saves this data for analysis
---
# Frontend (monitoring-ui):
* User interface to visualize API performance
* Includes custom React hooks:
    - useTimeWindow.ts to manage the temporal display of data
    - useAutoRefresh.ts to automatically refresh data
    - useVisibleData.ts to optimize the display of data points
* Displays charts and statistics on API calls
* Shows recent errors and their distribution
---
# Features
* The project emphasizes reliability and performance, with mechanisms such as:
    - Validation of identifiers (UUID for songs, integers for pages, strings for lists, etc.)
    - Retry logic for requests with fetchWithRetry, automatic retry timer adaptation to avoid rate limit
    - Caching of recentlyently requested results
    - Detailed monitoring of API performance
    - Error and exception handling

This application facilitates access to Suno's data while providing a monitoring layer to track the health and performance of interactions with the external API.



## Installation

### Prerequisites
- [Node.js]([node.js]) v18 or higher
- [npm](https://www.npmjs.com/) (comes with Node.js)
- (Optional) [Redis](https://redis.io/) if you want to enable caching

Install the dependencies and devDependencies and start the server.

```sh
instructions
```

For production environments...

```sh
npm install --production
NODE_ENV=production node app
```

### 1. Clone the repository
```sh
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

### 2. Install dependencies
```sh
npm install
```

### 3. Build the project
```sh
npm run build
```

### 4. Configure environment variables
Create a `.env` file at the root of the project (example):
```
PORT=3000
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=http://localhost:3000
LIST_URL=https://api.suno.ai/playlists/
```

### 5. Start the server
```sh
npm start
```

The server will be available at [http://localhost:3000](http://localhost:3000).

---

### Development

- To start the backend in watch mode:
  ```sh
  npm run dev:backend
  ```
- To start the monitoring frontend (in another terminal):
  ```sh
  npm run dev:frontend
  ```

---

### Production

- Build and start:
  ```sh
  npm run build
  npm start
  ```

---

Replace the placeholder repo URL with your actual repository URL.  
You can now copy-paste this block into your README under the **Installation** section!


## Scripts

Suno proxy actually supports the following commands.
Instructions on how to use them in your own application are linked below.

| Scripts | Usage | Description
| ------ | ------ | ------ |
| start | npm run start | Start the app (production) |
| build | npm run build | Build the app |
| copy:public | npm copy:public | Copy data from src/public/ to dist/public |



## Docker

You can easily build and run Suno Proxy in a Docker container.

### 1. Build the Docker image

```sh
docker build -t youruser/suno-proxy:latest .
```

### 2. Run the Docker container

```sh
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name suno-proxy \
  youruser/suno-proxy:latest
```

- The app will be available at [http://localhost:3000](http://localhost:3000).
- Make sure to provide a valid `.env` file with your configuration (see the example in the installation section).

### Notes

- If you want to use Redis, make sure to run a Redis container or connect to an existing Redis instance, and set `REDIS_URL` accordingly in your `.env`.
- You can change the mapped port (`-p 3000:3000`) if needed.

---

Replace `youruser` with your Docker Hub username or your preferred image name.

## License
⚠️ This code is provided for demonstration purposes only. Any reuse, copying, or distribution without written permission is strictly prohibited.

[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen.)

   [markdown-it]: <https://github.com/markdown-it/markdown-it>
   [node.js]: <http://nodejs.org>
   [express]: <http://expressjs.com>
