/**
 * Tests for colors utility module
 */

import { colors, log } from '../../src/utils/colors';

describe('colors utility', () => {
  describe('color functions', () => {
    it('should wrap text with ANSI codes for red', () => {
      const result = colors.red('error');
      expect(result).toContain('error');
      expect(result).toContain('\x1b[');
    });

    it('should wrap text with ANSI codes for green', () => {
      const result = colors.green('success');
      expect(result).toContain('success');
      expect(result).toContain('\x1b[');
    });

    it('should wrap text with ANSI codes for yellow', () => {
      const result = colors.yellow('warning');
      expect(result).toContain('warning');
      expect(result).toContain('\x1b[');
    });

    it('should wrap text with ANSI codes for cyan', () => {
      const result = colors.cyan('info');
      expect(result).toContain('info');
      expect(result).toContain('\x1b[');
    });

    it('should wrap text with ANSI codes for bold', () => {
      const result = colors.bold('important');
      expect(result).toContain('important');
      expect(result).toContain('\x1b[');
    });

    it('should wrap text with ANSI codes for dim', () => {
      const result = colors.dim('subtle');
      expect(result).toContain('subtle');
      expect(result).toContain('\x1b[');
    });

    it('should support chaining colors', () => {
      const result = colors.bold(colors.red('bold red'));
      expect(result).toContain('bold red');
    });
  });

  describe('log functions', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log info messages with icon', () => {
      log.info('test info');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log success messages with checkmark', () => {
      log.success('test success');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log warning messages with exclamation', () => {
      log.warn('test warning');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log error messages with X', () => {
      log.error('test error');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should log title with divider', () => {
      log.title('Test Title');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
