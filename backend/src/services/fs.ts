import * as fs from 'fs/promises';

export async function readFile(filePath: string): Promise<Buffer> {
  return fs.readFile(filePath);
}

export async function writeFile(filePath: string, data: Buffer): Promise<void> {
  return fs.writeFile(filePath, data);
}

export async function deleteFile(filePath: string): Promise<void> {
  return fs.unlink(filePath);
}
