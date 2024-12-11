// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
  })
);

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock service worker registration
global.navigator.serviceWorker = {
  register: jest.fn().mockResolvedValue({
    pushManager: {
      subscribe: jest.fn().mockResolvedValue({}),
      getSubscription: jest.fn().mockResolvedValue(null),
    },
  }),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  document.body.innerHTML = '';
});
