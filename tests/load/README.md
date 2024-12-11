# Load Testing for WSPR Web

This directory contains load testing scripts for the WSPR Web application using k6.

## Prerequisites

1. Install k6: https://k6.io/docs/getting-started/installation/

## Running the Tests

### Push Notification Load Test

This test simulates multiple users subscribing to push notifications, receiving notifications, and unsubscribing.

```bash
# Run with default settings (localhost:3000)
k6 run push-notifications.js

# Run against a specific API URL
k6 run -e API_URL=https://your-api-url push-notifications.js
```

### Test Scenarios

The push notification load test includes:

1. Subscription creation
2. Notification sending
3. Unsubscription
4. Error rate monitoring
5. Response time tracking

### Load Profiles

The test runs through several stages:
- 1 minute ramp-up to 50 virtual users
- 3 minutes at 50 virtual users
- 1 minute ramp-up to 100 virtual users
- 3 minutes at 100 virtual users
- 1 minute ramp-down

### Success Criteria

- Error rate < 10%
- 95% of requests complete under 500ms
- All endpoints return expected status codes

## Monitoring Results

During the test, k6 will output:
- Virtual user count
- Request rates
- Error rates
- Response times
- HTTP request statistics

## Troubleshooting

If you encounter issues:
1. Ensure the API server is running
2. Check API_URL is correctly set
3. Verify network connectivity
4. Check server logs for errors
