// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Real integration testing setup - no mocks
// TestSprite will handle real API calls, real database operations, and real service testing

// Only keep essential test environment setup
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Real testing environment - let TestSprite handle the rest
console.log('🧪 TestSprite Integration Testing Environment Ready');
console.log('📡 Will test real APIs, real database, real services');
console.log('🔍 No mocks - real integration testing enabled');
