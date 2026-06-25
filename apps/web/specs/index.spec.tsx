import React from 'react';
import { render } from '@testing-library/react';
import Page from '../src/app/page';

// 1. ✨ Mock Next.js Navigation hooks to prevent "Router not mounted" crashes
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return {
      get: jest.fn((key: string) => null),
    };
  },
}));

// 2. ✨ Mock window.location to prevent JSDOM navigation crashes
beforeAll(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { href: '', assign: jest.fn(), replace: jest.fn() },
  });
});

describe('Page', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Page />);
    expect(baseElement).toBeTruthy();
  });
});
