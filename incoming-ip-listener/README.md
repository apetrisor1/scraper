# What this does

This listener is a simple Express server you can run on your own machine to log the IP's
of incoming requests from the Lambda proxies.

# Prerequisites

## Install ngrok 

Macos: ```brew install ngrok/ngrok/ngrok```

Linux: ```snap install ngrok```

# Usage

1. Start server: ```node index.js```
2. Start ngrok: ```ngrok http 8000```
3. Copy the http tunnel url from terminal (example: ```http://3e57-188-24-63-199.ngrok.io```)
```
Forwarding                    http://3e57-188-24-63-199.ngrok.io -> http://localhost:8000
```

4. Add this line to the main route's controller in your proxy lambda:

```
await axios({ method: "GET", url: 'http://3e57-188-24-63-199.ngrok.io' })
```

5. Watch the terminal and look at incoming IP's.
Call the entry lambda, which does a round-robin through the proxy lambdas.