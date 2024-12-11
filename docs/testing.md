# Testing Guide

## Overview
This guide covers the testing infrastructure for the WSPR web application, including unit tests, integration tests, and end-to-end tests.

## Test Structure
```
client/src/tests/
├── setup.ts              # Test environment setup
├── hooks/               # Hook tests
│   └── useWebRTC.test.ts # WebRTC hook tests
├── services/            # Service tests
│   └── pushNotification.test.ts # PWA service tests
└── e2e/                # End-to-end tests
    ├── call.spec.ts    # Video call tests
    └── pwa.spec.ts     # PWA feature tests
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### End-to-End Tests
```bash
# Install Playwright browsers
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/call.spec.ts

# Run tests with UI mode
npx playwright test --ui

# Run tests on specific browser
npx playwright test --project=chromium
```

## Test Coverage Requirements
- Unit Tests: Minimum 80% coverage
- E2E Tests: All critical user flows covered
- Component Tests: All interactive components tested

### Coverage Metrics
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## Writing Tests

### Unit Test Template
```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Component/Hook/Service Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something specific', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### E2E Test Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup
  });

  test('should complete user flow', async ({ page }) => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Mocking

### WebRTC Mocks
```typescript
const mockPeerConnection = {
  createOffer: vi.fn(),
  setLocalDescription: vi.fn(),
  onicecandidate: null,
};

vi.spyOn(window, 'RTCPeerConnection').mockImplementation(() => mockPeerConnection);
```

### Service Worker Mocks
```typescript
const mockServiceWorker = {
  register: vi.fn(),
  ready: Promise.resolve({
    pushManager: {
      subscribe: vi.fn(),
    },
  }),
};

Object.defineProperty(window, 'navigator', {
  value: { serviceWorker: mockServiceWorker },
  writable: true,
});
```

### Service Worker and Notification Mocks
```typescript
// Mock Notification API
class NotificationMock {
  static permission = 'default';
  static async requestPermission() {
    return 'granted';
  }
}

// @ts-ignore
global.Notification = NotificationMock;

// Mock Service Worker Registration
const mockRegistration = {
  pushManager: {
    subscribe: vi.fn().mockResolvedValue({
      toJSON: () => ({
        endpoint: 'mock-endpoint',
        keys: { p256dh: 'mock-p256dh', auth: 'mock-auth' },
      }),
    }),
    getSubscription: vi.fn().mockResolvedValue(null),
  },
  showNotification: vi.fn().mockResolvedValue(undefined),
} as unknown as ServiceWorkerRegistration;

// Mock Service Worker
const mockServiceWorker = {
  register: vi.fn().mockResolvedValue(mockRegistration),
  ready: Promise.resolve(mockRegistration),
};

Object.defineProperty(window, 'navigator', {
  value: { 
    serviceWorker: mockServiceWorker,
    permissions: {
      query: vi.fn().mockResolvedValue({ state: 'granted' }),
    },
  },
  writable: true,
});
```

## Test Environment

### Browser Support
- Chrome/Chromium
- Firefox
- Safari
- Mobile Chrome
- Mobile Safari

### Device Testing
- Desktop (1920x1080)
- Tablet (iPad)
- Mobile (iPhone 12, Pixel 5)

## Continuous Integration

### GitHub Actions Workflow
The CI pipeline runs all tests on:
- Pull requests to main branch
- Push to main branch
- Nightly builds

### Test Reports
- Coverage reports uploaded as artifacts
- Playwright trace viewer for failed E2E tests
- HTML test reports for local development

## Best Practices

### General Guidelines
1. Follow AAA pattern (Arrange, Act, Assert)
2. One assertion per test when possible
3. Clear test descriptions
4. Proper test isolation
5. Meaningful test data

### Writing E2E Tests
1. Use data-testid for element selection
2. Handle async operations properly
3. Test real user flows
4. Include error scenarios
5. Test across different viewports

### Mocking Guidelines
1. Mock external services
2. Mock browser APIs when needed
3. Use realistic mock data
4. Reset mocks between tests
5. Document mock behavior

## Debugging Tests

### Unit Tests
```bash
# Run specific test with debug output
npm run test:debug

# Debug in VS Code
1. Set breakpoints
2. Use JavaScript Debug Terminal
3. Run npm test
```

### E2E Tests
```bash
# Run with debug mode
npx playwright test --debug

# Save traces
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

## Common Issues and Solutions

### WebRTC Tests
- Issue: MediaStream not available
  Solution: Mock getUserMedia API

- Issue: ICE candidate timing
  Solution: Use fake timers

### PWA Tests
- Issue: Service Worker registration
  Solution: Mock registration process

- Issue: Push notification permission
  Solution: Mock Notification.requestPermission

## Push Notification Testing
```typescript
import { pushNotificationService } from '../services/pushNotification';

describe('PushNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct configuration', async () => {
    await pushNotificationService.initialize(mockRegistration);
    expect(mockRegistration.pushManager.subscribe).toBeDefined();
  });

  it('should handle subscription errors', async () => {
    const mockError = new Error('Subscription failed');
    mockRegistration.pushManager.subscribe = vi.fn().mockRejectedValue(mockError);

    await expect(pushNotificationService.initialize(mockRegistration))
      .rejects.toThrow('Subscription failed');
  });

  it('should display notifications', async () => {
    await pushNotificationService.showNotification({
      title: 'Test',
      body: 'Test notification',
    });

    expect(mockRegistration.showNotification).toHaveBeenCalledWith(
      'Test',
      expect.objectContaining({
        body: 'Test notification',
      })
    );
  });
});
```

## Performance Testing

### Metrics to Monitor
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- First Input Delay (FID)

### Load Testing
```bash
# Run k6 load tests
k6 run load-tests/video-call.js

# Run with specific scenarios
k6 run --scenario baseline load-tests/video-call.js
