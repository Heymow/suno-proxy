# SUNOLYTICS
## A Suno API interface
---
This is an application that serves as an interface or proxy to interact with an external API (likely related to Suno, a music generation service). The project consists of two main parts:
## Backend (API server):
* Handles requests to the external API to retrieve information about:
    - Playlists (playlistController.ts)
    - Individual songs/clips (songController.ts)
    - User profiles (userController.ts)
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

* The project emphasizes reliability and performance, with mechanisms such as:
    - Validation of identifiers (UUID for songs)
    - Retry logic for requests with fetchWithRetry
    - Caching of frequently requested results
    - Detailed monitoring of API performance
    - Error and exception handling

This application facilitates access to Suno's data while providing a monitoring layer to track the health and performance of interactions with the external API.



## Installation

Sunolytics requires [Node.js](https://nodejs.org/) v10+ to run.

Install the dependencies and devDependencies and start the server.

```sh
instructions
```

For production environments...

```sh
npm install --production
NODE_ENV=production node app
```

## Scripts

Sunolytics actually supports the following commands.
Instructions on how to use them in your own application are linked below.

| Scripts | Usage |
| ------ | ------ |
| script 1 | usage |
| script 2 | usage |

## Installation


Open your favorite Terminal and run these commands.

First Tab:

```sh
command
```

Second Tab:

```sh
command --watch
```

(optional) Third:

```sh
command test
```

#### Building for source

For production release:

```sh
command build --prod
```

Generating pre-built zip archives for distribution:

```sh
command build dist --prod
```

## Docker

Sunolytics is very easy to install and deploy in a Docker container.

By default, the Docker will expose port 8080, so change this within the
Dockerfile if necessary. When ready, simply use the Dockerfile to
build the image.

```sh
cd dir
docker build -t <youruser>/sunolytics:${package.json.version} .
```

This will create the sunolytics image and pull in the necessary dependencies.
Be sure to swap out `${package.json.version}` with the actual
version of Sunolytics.

Once done, run the Docker image and map the port to whatever you wish on
your host. In this example, we simply map port 8000 of the host to
port 8080 of the Docker (or whatever port was exposed in the Dockerfile):

```sh
docker run -d -p 8000:8080 --restart=always --cap-add=SYS_ADMIN --name=sunolytics <youruser>/sunolytics:${package.json.version}
```

> Note: `--capt-add=SYS-ADMIN` is required for PDF rendering.

Verify the deployment by navigating to your server address in
your preferred browser.

```sh
127.0.0.1:8000
```

## License
⚠️ This code is provided for demonstration purposes only. Any reuse, copying, or distribution without written permission is strictly prohibited.

[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen.)

   [markdown-it]: <https://github.com/markdown-it/markdown-it>
   [node.js]: <http://nodejs.org>
   [express]: <http://expressjs.com>