import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { editTool } from '../../src/tools/edit';

describe('editTool', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codemax-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('replaces text in file', async () => {
    const filePath = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(filePath, 'hello world', 'utf-8');
    const result = await editTool.execute({ filePath, oldString: 'world', newString: 'there' });
    expect(result.success).toBe(true);
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('hello there');
  });

  it('reports error for missing file', async () => {
    const result = await editTool.execute({ filePath: '/nonexistent/file.txt', oldString: 'a', newString: 'b' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('reports error when oldString not found', async () => {
    const filePath = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(filePath, 'hello', 'utf-8');
    const result = await editTool.execute({ filePath, oldString: 'xyz', newString: 'abc' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('replaceAll replaces all occurrences', async () => {
    const filePath = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(filePath, 'a b a c a', 'utf-8');
    const result = await editTool.execute({ filePath, oldString: 'a', newString: 'x', replaceAll: true });
    expect(result.success).toBe(true);
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('x b x c x');
  });

  it('replaces only first occurrence by default', async () => {
    const filePath = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(filePath, 'a b a c a', 'utf-8');
    await editTool.execute({ filePath, oldString: 'a', newString: 'x' });
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('x b a c a');
  });

  it('reports net line change', async () => {
    const filePath = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(filePath, 'line1\nline2\nline3', 'utf-8');
    const result = await editTool.execute({ filePath, oldString: 'line2', newString: 'line2\nnew line' });
    expect(result.success).toBe(true);
    expect(result.output).toContain('+1');
  });
});
