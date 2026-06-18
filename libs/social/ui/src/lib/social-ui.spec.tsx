import { render } from '@testing-library/react';

import SocialUi from './social-ui';

describe('SocialUi', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<SocialUi />);
    expect(baseElement).toBeTruthy();
  });
});
