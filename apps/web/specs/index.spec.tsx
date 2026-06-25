import React from 'react';
import { render } from '@testing-library/react';
import Page from '../src/app/page';

// 1. Mock Next.js Navigation hooks to prevent "Router not mounted" crashes
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

// 2. ✨ The JSDOM Hack: Force-delete and replace window.location
beforeAll(() => {
  // Cast window as a custom writable type to bypass JSDOM's read-only restriction
  const writableWindow = window as unknown as { location: unknown };

  delete writableWindow.location; // Wipes out the JSDOM proxy
  
  writableWindow.location = {
    href: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    origin: 'http://localhost:3000',
  }; // Replaces with our plain, writable mock object!
});

describe('Page', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Page />);
    expect(baseElement).toBeTruthy();
  });
});