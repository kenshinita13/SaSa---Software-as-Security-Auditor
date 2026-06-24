import { spawn } from 'child_process';
import path from 'path';
import { ScanFinding } from './owaspClassifier';

/**
 * Spawns the Python security engine as a subprocess.
 * The Python script outputs a JSON array of findings to stdout.
 *
 * @param targetUrl - The URL to scan
 * @returns Array of raw findings from all Python scanners
 */
export async function spawnPythonEngine(targetUrl: string): Promise<ScanFinding[]> {
  return new Promise((resolve, reject) => {
    const pythonBin = process.env.PYTHON_BIN || 'python';
    const enginePath = path.resolve(
      __dirname,
      '../../..',
      process.env.PYTHON_ENGINE_PATH || '../python-engine/main.py',
    );

    const args = ['--url', targetUrl, '--output', 'json'];
    const proc = spawn(pythonBin, [enginePath, ...args]);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        console.error(`[PythonBridge] Engine exited with code ${code}: ${stderr}`);
        // Resolve empty — don't fail the whole scan if Python errors
        resolve([]);
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as ScanFinding[];
        resolve(parsed);
      } catch {
        console.error('[PythonBridge] Failed to parse Python output:', stdout);
        resolve([]);
      }
    });

    proc.on('error', (err) => {
      console.error('[PythonBridge] Failed to spawn Python process:', err);
      reject(err);
    });

    // Safety timeout — kill Python after 45 seconds
    setTimeout(() => {
      proc.kill();
      console.warn('[PythonBridge] Python engine timed out, killed.');
      resolve([]);
    }, 45_000);
  });
}
