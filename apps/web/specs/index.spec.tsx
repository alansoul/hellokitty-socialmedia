import React from 'react';
import { render } from '@testing-library/react';
import Page from '../src/app/page';

// ✨ Mock the Next.js App Router so Jest doesn't crash!
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(), // Fake the push function
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('Page', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Page />);
    expect(baseElement).toBeTruthy();
  });
});
