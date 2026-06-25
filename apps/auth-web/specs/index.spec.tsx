import React from 'react';
import { render } from '@testing-library/react';
import Page from '../src/app/page';

// 1. ✨ Mock Next.js Navigation and Redirect hooks to prevent crashes
jest.mock('next/navigation', () => ({
  redirect: jest.fn(), // Intercept Next.js server redirects
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

describe('Page', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Page />);
    expect(baseElement).toBeTruthy();
  });
});
