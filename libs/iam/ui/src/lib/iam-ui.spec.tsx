import { render } from '@testing-library/react';

import IamUi from './iam-ui';

describe('IamUi', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<IamUi />);
    expect(baseElement).toBeTruthy();
  });
});
