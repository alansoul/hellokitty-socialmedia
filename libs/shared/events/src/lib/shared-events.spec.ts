import { sharedEvents } from './shared-events';

describe('sharedEvents', () => {
  it('should work', () => {
    expect(sharedEvents()).toEqual('shared-events');
  });
});
