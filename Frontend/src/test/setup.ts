import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('html-encoding-sniffer', () => {
  return {
    default: vi.fn(() => 'utf8'), // Mock the default export of html-encoding-sniffer
  };
});
