import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users for 3 minutes
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users for 3 minutes
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    errors: ['rate<0.1'], // Error rate should be less than 10%
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export default function () {
  // Test subscription endpoint
  const subscribeRes = http.post(`${BASE_URL}/push/subscribe`, {
    endpoint: `https://fcm.googleapis.com/fcm/send/${__VU}`,
    keys: {
      p256dh: 'test-p256dh-key',
      auth: 'test-auth-key',
    },
  });
  
  check(subscribeRes, {
    'subscription successful': (r) => r.status === 201,
  }) || errorRate.add(1);

  sleep(1);

  // Test notification sending
  const notifyRes = http.post(`${BASE_URL}/push/notify`, {
    title: 'Load Test Notification',
    body: `Test message from VU ${__VU}`,
    userId: `test-user-${__VU}`,
  });

  check(notifyRes, {
    'notification sent': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test unsubscribe
  const unsubscribeRes = http.post(`${BASE_URL}/push/unsubscribe`, {
    endpoint: `https://fcm.googleapis.com/fcm/send/${__VU}`,
  });

  check(unsubscribeRes, {
    'unsubscribe successful': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
}
