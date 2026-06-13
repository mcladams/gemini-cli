/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { simpleGit } from 'simple-git';
import type { SimpleGit } from 'simple-git';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { load } from 'js-yaml';
import { fdir } from 'fdir';
import chalk from 'chalk';

// --- Types ---

interface ImportOptions {
  source: string;
  targetLocal?: boolean;
  targetWorkspace?: boolean;
  targetGlobal?: boolean;
  isPlugin?: boolean;
  pluginName?: string;
}

interface CapabilityAsset {
  type:
    | 'skill'
    | 'rule'
    | 'workflow'
    | 'subagent'
    | 'mcp'
    | 'hook'
    | 'sidecar'
    | 'plugin';
  sourcePath: string;
  name: string;
  content: string;
  relPath: string;
}

interface ImportManifestEntry {
  timestamp: string;
  type: string;
  name: string;
  source: string;
  target: string;
}

// --- Constants ---

const HOME = process.env['HOME'] || process.env['USERPROFILE'] || '';
const GLOBAL_GEMINI_DIR = path.join(HOME, '.gemini');
const IMPORT_MANIFEST_PATH = path.join(
  GLOBAL_GEMINI_DIR,
  'antigravity-cli',
  'import_manifest.json',
);

// --- Helper Functions ---

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveRelativePointers(
  content: string,
  currentFileFullPath: string,
  sourcePath: string,
): Promise<string> {
  const trimmed = content.trim();
  if (
    trimmed.length < 500 &&
    /^\.?\.\.?[/\\]/.test(trimmed) &&
    trimmed.endsWith('.md') &&
    !trimmed.includes('\n')
  ) {
    const resolvedPath = path.resolve(
      path.dirname(currentFileFullPath),
      trimmed,
    );
    try {
      if (await pathExists(resolvedPath)) {
        console.log(
          chalk.blue(
            `   🔗 Resolving relative pointer: ${trimmed} -> ${resolvedPath}`,
          ),
        );
        const targetContent = await fs.readFile(resolvedPath, 'utf-8');
        return resolveRelativePointers(targetContent, resolvedPath, sourcePath);
      } else {
        console.warn(
          chalk.yellow(`   ⚠️ Pointer target not found: ${resolvedPath}`),
        );
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(
        chalk.yellow(
          `   ⚠️ Error reading pointer target ${resolvedPath}: ${errMsg}`,
        ),
      );
    }
  }
  return content;
}

async function copyAndResolveDirRecursive(
  src: string,
  dest: string,
  sourcePath: string,
  excludeDirs: string[] = ['tests', 'node_modules', '.git'],
) {
  await ensureDir(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (excludeDirs.includes(entry.name)) continue;
      await copyAndResolveDirRecursive(
        srcPath,
        destPath,
        sourcePath,
        excludeDirs,
      );
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (ext === '.md' || ext === '.json') {
        let content = await fs.readFile(srcPath, 'utf-8');
        content = await resolveRelativePointers(content, srcPath, sourcePath);
        await fs.writeFile(destPath, content, 'utf-8');
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

async function logImport(asset: CapabilityAsset, targetPath: string) {
  let manifest: { imports: ImportManifestEntry[] } = { imports: [] };
  try {
    const content = await fs.readFile(IMPORT_MANIFEST_PATH, 'utf-8');
    manifest = JSON.parse(content) as { imports: ImportManifestEntry[] };
  } catch {
    // Ignore missing or malformed manifest file
  }

  manifest.imports.push({
    timestamp: new Date().toISOString(),
    type: asset.type,
    name: asset.name,
    source: asset.sourcePath,
    target: targetPath,
  });

  await ensureDir(path.dirname(IMPORT_MANIFEST_PATH));
  await fs.writeFile(IMPORT_MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

// Merge helper for JSON config files
async function mergeJsonFile(
  destPath: string,
  key: string,
  srcJsonText: string,
) {
  let destJson: Record<string, unknown> = {};
  if (await pathExists(destPath)) {
    try {
      const content = await fs.readFile(destPath, 'utf-8');
      destJson = JSON.parse(content) as Record<string, unknown>;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(
        chalk.yellow(
          `⚠️  Failed to parse existing config at ${destPath}. Overwriting. Details: ${errMsg}`,
        ),
      );
    }
  }

  let srcJson: Record<string, unknown> = {};
  try {
    srcJson = JSON.parse(srcJsonText) as Record<string, unknown>;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid JSON content to merge: ${errMsg}`);
  }

  // Merge the specified key or the entire object
  if (key) {
    const srcData = srcJson[key] !== undefined ? srcJson[key] : srcJson;
    destJson[key] = {
      ...(destJson[key] as Record<string, unknown>),
      ...(srcData as Record<string, unknown>),
    };
  } else {
    destJson = { ...destJson, ...srcJson };
  }

  await ensureDir(path.dirname(destPath));
  await fs.writeFile(destPath, JSON.stringify(destJson, null, 2));
}

function parseAndTranslateMarkdown(
  content: string,
  defaultName: string,
): { content: string; name: string; description: string } {
  const trimmed = content.trim();
  let name = defaultName;
  let description = `Imported capability ${defaultName}`;
  let body = content;

  if (trimmed.startsWith('---')) {
    const parts = trimmed.split('---');
    if (parts.length >= 3) {
      const frontmatterText = parts[1];
      body = parts.slice(2).join('---').trim();
      try {
        const parsed = load(frontmatterText) as Record<string, unknown> | null;
        if (parsed) {
          if (parsed['name'])
            name = String(parsed['name'])
              .toLowerCase()
              .replace(/[^a-z0-9_-]/g, '-');
          if (parsed['description'])
            description = String(parsed['description']);
          // Return as is if name and description are already valid
          if (parsed['name'] && parsed['description']) {
            return { content, name, description };
          }
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`⚠️ Failed to parse YAML frontmatter: ${errMsg}`);
      }
    }
  }

  // Synthesize name from first header if possible
  const headerMatch = body.match(/^#\s+(.+)$/m);
  if (headerMatch) {
    name = headerMatch[1]
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');
  }

  // Synthesize description from first paragraph
  const lines = body.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (
      trimmedLine &&
      !trimmedLine.startsWith('#') &&
      !trimmedLine.startsWith('---') &&
      !trimmedLine.startsWith('>')
    ) {
      description = trimmedLine.slice(0, 150);
      if (trimmedLine.length > 150) {
        description += '...';
      }
      break;
    }
  }

  // Construct new content with standardized frontmatter
  const newFrontmatter = `---\nname: ${name}\ndescription: ${description}\n---`;
  const newContent = `${newFrontmatter}\n\n${body}`;
  return { content: newContent, name, description };
}

// --- Importer Logic ---

export class CapabilityImporter {
  private git: SimpleGit;
  private tempDir: string = '';

  constructor() {
    this.git = simpleGit();
  }

  async run(options: ImportOptions) {
    console.log(chalk.blue(`🚀 Starting import from: ${options.source}`));

    try {
      // 1. Ingest
      const sourcePath = await this.ingest(options.source);

      // Determine default plugin name from repo/folder name if needed
      if (options.isPlugin && !options.pluginName) {
        options.pluginName = path
          .basename(sourcePath)
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '-');
      }

      // 2. Crawl
      const assets = await this.crawl(sourcePath);
      if (assets.length === 0) {
        console.log(
          chalk.yellow(
            '📭 No agent capabilities (skills, rules, workflows, MCP config, hooks, sidecars) found.',
          ),
        );
        return;
      }
      console.log(chalk.green(`🔍 Found ${assets.length} capability assets.`));

      // 3. Safety Check (Interactive Validation)
      const verifiedAssets = await this.safetyCheck(assets, sourcePath);

      // 4. Install
      for (const asset of verifiedAssets) {
        await this.install(asset, options, sourcePath);
      }

      console.log(chalk.bold.green('\n✅ Import completed successfully!'));
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`\n❌ Import failed: ${errMsg}`));
      process.exit(1);
    } finally {
      if (this.tempDir) {
        console.log(
          chalk.dim(`🧹 Cleaning up temporary directory ${this.tempDir}...`),
        );
        await fs.rm(this.tempDir, { recursive: true, force: true });
      }
    }
  }

  private async ingest(source: string): Promise<string> {
    if (
      source.startsWith('http') ||
      source.startsWith('git@') ||
      source.includes('github.com')
    ) {
      // Ensure it has a git prefix or suffix if it is a github url
      let repoUrl = source;
      if (
        source.includes('github.com') &&
        !source.endsWith('.git') &&
        !source.startsWith('git@')
      ) {
        repoUrl = source + '.git';
      }
      this.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gemini-import-'));
      console.log(chalk.dim(`Cloning ${repoUrl} into ${this.tempDir}...`));
      await this.git.clone(repoUrl, this.tempDir);
      return this.tempDir;
    } else {
      const absolutePath = path.resolve(source);
      const stats = await fs.stat(absolutePath);
      if (!stats.isDirectory()) {
        throw new Error('Local source must be a directory.');
      }
      return absolutePath;
    }
  }

  private async crawl(sourcePath: string): Promise<CapabilityAsset[]> {
    const assets: CapabilityAsset[] = [];
    const crawler = new fdir()
      .withFullPaths()
      .withRelativePaths()
      .crawl(sourcePath);

    const output = crawler.sync();

    for (const item of output) {
      const fullPath = path.join(sourcePath, item);
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) continue;

      const ext = path.extname(item);
      const fileName = path.basename(item);
      const dirParts = path.dirname(item).split(path.sep);
      const upperFileName = fileName.toUpperCase();

      // Exclude standard git metadata and node_modules
      if (item.includes('.git/') || item.includes('node_modules/')) continue;

      // 1. Plugin marker
      if (upperFileName === 'PLUGIN.JSON') {
        const content = await fs.readFile(fullPath, 'utf-8');
        assets.push({
          type: 'plugin',
          sourcePath: fullPath,
          name: path.basename(path.dirname(item)),
          content,
          relPath: item,
        });
      }
      // 2. Skills (standard or .skill.md)
      else if (
        upperFileName === 'SKILL.MD' ||
        upperFileName.endsWith('.SKILL.MD')
      ) {
        let content = await fs.readFile(fullPath, 'utf-8');
        content = await resolveRelativePointers(content, fullPath, sourcePath);
        let defaultName = path.basename(path.dirname(item));
        if (
          upperFileName.endsWith('.SKILL.MD') &&
          upperFileName !== 'SKILL.MD'
        ) {
          defaultName = fileName.slice(0, -9); // remove '.skill.md'
        }
        const { content: translatedContent, name: skillName } =
          parseAndTranslateMarkdown(content, defaultName);
        assets.push({
          type: 'skill',
          sourcePath: fullPath,
          name: skillName,
          content: translatedContent,
          relPath: item,
        });
      }
      // 2b. Unstructured instructions -> translated to standard skills
      else if (
        upperFileName === 'CLAUDE.MD' ||
        upperFileName === '.CLAUDECODEDOC' ||
        upperFileName === '.CLAUDECODERC' ||
        upperFileName === 'COPILOT-INSTRUCTIONS.MD' ||
        upperFileName.endsWith('INSTRUCTIONS.MD') ||
        upperFileName.endsWith('INSTRUCTION.MD')
      ) {
        let content = await fs.readFile(fullPath, 'utf-8');
        content = await resolveRelativePointers(content, fullPath, sourcePath);
        const defaultName = path
          .basename(fileName, path.extname(fileName))
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '-');
        const { content: translatedContent, name: skillName } =
          parseAndTranslateMarkdown(content, defaultName);
        assets.push({
          type: 'skill',
          sourcePath: fullPath,
          name: skillName,
          content: translatedContent,
          relPath: item,
        });
      }
      // 3. Rules
      else if (
        upperFileName === 'GEMINI.MD' ||
        upperFileName === 'AGENTS.MD' ||
        (dirParts.includes('rules') && ext === '.md')
      ) {
        let content = await fs.readFile(fullPath, 'utf-8');
        content = await resolveRelativePointers(content, fullPath, sourcePath);
        assets.push({
          type: 'rule',
          sourcePath: fullPath,
          name: path.basename(item, ext),
          content,
          relPath: item,
        });
      }
      // 4. Workflows
      else if (
        (dirParts.includes('workflows') ||
          dirParts.includes('custom-workflows')) &&
        ext === '.md'
      ) {
        let content = await fs.readFile(fullPath, 'utf-8');
        content = await resolveRelativePointers(content, fullPath, sourcePath);
        assets.push({
          type: 'workflow',
          sourcePath: fullPath,
          name: path.basename(item, ext),
          content,
          relPath: item,
        });
      }
      // 5. Custom Subagents
      else if (
        dirParts.includes('agents') &&
        (ext === '.json' || ext === '.md')
      ) {
        let content = await fs.readFile(fullPath, 'utf-8');
        content = await resolveRelativePointers(content, fullPath, sourcePath);
        assets.push({
          type: 'subagent',
          sourcePath: fullPath,
          name: path.basename(item, ext),
          content,
          relPath: item,
        });
      }
      // 6. MCP Config
      else if (upperFileName === 'MCP_CONFIG.JSON') {
        const content = await fs.readFile(fullPath, 'utf-8');
        assets.push({
          type: 'mcp',
          sourcePath: fullPath,
          name: 'mcp_config',
          content,
          relPath: item,
        });
      }
      // 7. Hooks
      else if (upperFileName === 'HOOKS.JSON') {
        const content = await fs.readFile(fullPath, 'utf-8');
        assets.push({
          type: 'hook',
          sourcePath: fullPath,
          name: 'hooks',
          content,
          relPath: item,
        });
      }
      // 8. Sidecars
      else if (upperFileName === 'SIDECAR.JSON') {
        const content = await fs.readFile(fullPath, 'utf-8');
        assets.push({
          type: 'sidecar',
          sourcePath: fullPath,
          name: path.basename(path.dirname(item)),
          content,
          relPath: item,
        });
      }
    }

    return assets;
  }

  private async safetyCheck(
    assets: CapabilityAsset[],
    sourcePath: string,
  ): Promise<CapabilityAsset[]> {
    const executableTypes = ['mcp', 'hook', 'sidecar', 'skill'];
    const sensitiveAssets = assets.filter((a) =>
      executableTypes.includes(a.type),
    );

    if (sensitiveAssets.length > 0) {
      console.log(
        chalk.bold.yellow(
          '\n⚠️  SAFETY WARNING: The following imported files contain scripts, background configurations, or event hooks:',
        ),
      );
      for (const asset of sensitiveAssets) {
        console.log(
          chalk.yellow(
            `   - [${asset.type.toUpperCase()}] ${path.relative(sourcePath, asset.sourcePath)}`,
          ),
        );
      }

      console.log(
        chalk.red(
          '\nCrucial verification is required to avoid execution of arbitrary or malicious scripts on your system.',
        ),
      );

      const rl = readline.createInterface({ input, output });
      try {
        const answer = await rl.question(
          chalk.bold.cyan(
            '\nDo you want to proceed and import these capabilities? (y/N): ',
          ),
        );
        if (answer.trim().toLowerCase() !== 'y') {
          throw new Error('Verification cancelled by user.');
        }
      } finally {
        rl.close();
      }
    }

    return assets;
  }

  private async install(
    asset: CapabilityAsset,
    options: ImportOptions,
    sourceRoot: string,
  ) {
    const targets = [];
    if (options.targetLocal) targets.push('local');
    if (options.targetWorkspace) targets.push('workspace');
    if (options.targetGlobal) targets.push('global');

    if (targets.length === 0) {
      targets.push('workspace');
    }

    for (const target of targets) {
      const destPaths: string[] = [];

      if (options.isPlugin) {
        const pluginName = options.pluginName || 'imported-plugin';
        const baseDirs: string[] = [];
        if (target === 'local') {
          baseDirs.push(
            path.join(process.cwd(), '.gemini', 'plugins', pluginName),
          );
        } else if (target === 'workspace') {
          baseDirs.push(
            path.join(process.cwd(), '.agents', 'plugins', pluginName),
          );
        } else if (target === 'global') {
          baseDirs.push(
            path.join(GLOBAL_GEMINI_DIR, 'config', 'plugins', pluginName),
          );
          baseDirs.push(
            path.join(
              GLOBAL_GEMINI_DIR,
              'antigravity-cli',
              'plugins',
              pluginName,
            ),
          );
        }

        for (const baseDir of baseDirs) {
          if (asset.type === 'plugin')
            destPaths.push(path.join(baseDir, 'plugin.json'));
          else if (asset.type === 'skill')
            destPaths.push(
              path.join(baseDir, 'skills', asset.name, 'SKILL.md'),
            );
          else if (asset.type === 'rule')
            destPaths.push(path.join(baseDir, 'rules', `${asset.name}.md`));
          else if (asset.type === 'workflow')
            destPaths.push(path.join(baseDir, 'workflows', `${asset.name}.md`));
          else if (asset.type === 'subagent')
            destPaths.push(
              path.join(
                baseDir,
                'agents',
                asset.name,
                path.basename(asset.sourcePath),
              ),
            );
          else if (asset.type === 'mcp')
            destPaths.push(path.join(baseDir, 'mcp_config.json'));
          else if (asset.type === 'hook')
            destPaths.push(path.join(baseDir, 'hooks.json'));
          else if (asset.type === 'sidecar')
            destPaths.push(
              path.join(baseDir, 'sidecars', asset.name, 'sidecar.json'),
            );
        }
      } else {
        if (target === 'local') {
          if (asset.type === 'skill')
            destPaths.push(
              path.join(
                process.cwd(),
                '.gemini',
                'skills',
                asset.name,
                'SKILL.md',
              ),
            );
          else if (asset.type === 'rule')
            destPaths.push(
              path.join(process.cwd(), '.gemini', 'rules', `${asset.name}.md`),
            );
          else if (asset.type === 'workflow')
            destPaths.push(
              path.join(
                process.cwd(),
                '.gemini',
                'workflows',
                `${asset.name}.md`,
              ),
            );
        } else if (target === 'workspace') {
          if (asset.type === 'skill')
            destPaths.push(
              path.join(
                process.cwd(),
                '.agents',
                'skills',
                asset.name,
                'SKILL.md',
              ),
            );
          else if (asset.type === 'rule')
            destPaths.push(
              path.join(process.cwd(), '.agents', 'rules', `${asset.name}.md`),
            );
          else if (asset.type === 'workflow')
            destPaths.push(
              path.join(
                process.cwd(),
                '.agents',
                'workflows',
                `${asset.name}.md`,
              ),
            );
          else if (asset.type === 'subagent')
            destPaths.push(
              path.join(
                process.cwd(),
                '.agents',
                'agents',
                asset.name,
                path.basename(asset.sourcePath),
              ),
            );
          else if (asset.type === 'mcp')
            destPaths.push(
              path.join(process.cwd(), '.agents', 'mcp_config.json'),
            );
          else if (asset.type === 'hook')
            destPaths.push(path.join(process.cwd(), '.agents', 'hooks.json'));
          else if (asset.type === 'sidecar')
            destPaths.push(
              path.join(
                process.cwd(),
                '.agents',
                'sidecars',
                asset.name,
                'sidecar.json',
              ),
            );
        } else if (target === 'global') {
          if (asset.type === 'skill') {
            destPaths.push(
              path.join(
                GLOBAL_GEMINI_DIR,
                'config',
                'skills',
                asset.name,
                'SKILL.md',
              ),
            );
            destPaths.push(
              path.join(
                GLOBAL_GEMINI_DIR,
                'antigravity-cli',
                'skills',
                asset.name,
                'SKILL.md',
              ),
            );
          } else if (asset.type === 'rule') {
            if (asset.name.toUpperCase() === 'GEMINI') {
              destPaths.push(path.join(GLOBAL_GEMINI_DIR, 'GEMINI.md'));
              destPaths.push(
                path.join(GLOBAL_GEMINI_DIR, 'antigravity-cli', 'GEMINI.md'),
              );
            } else {
              destPaths.push(
                path.join(
                  GLOBAL_GEMINI_DIR,
                  'config',
                  'rules',
                  `${asset.name}.md`,
                ),
              );
              destPaths.push(
                path.join(
                  GLOBAL_GEMINI_DIR,
                  'antigravity-cli',
                  'rules',
                  `${asset.name}.md`,
                ),
              );
            }
          } else if (asset.type === 'workflow') {
            destPaths.push(
              path.join(
                GLOBAL_GEMINI_DIR,
                'config',
                'workflows',
                `${asset.name}.md`,
              ),
            );
            destPaths.push(
              path.join(
                GLOBAL_GEMINI_DIR,
                'antigravity-cli',
                'workflows',
                `${asset.name}.md`,
              ),
            );
          } else if (asset.type === 'subagent') {
            destPaths.push(
              path.join(
                GLOBAL_GEMINI_DIR,
                'config',
                'agents',
                asset.name,
                path.basename(asset.sourcePath),
              ),
            );
            destPaths.push(
              path.join(
                GLOBAL_GEMINI_DIR,
                'antigravity-cli',
                'agents',
                asset.name,
                path.basename(asset.sourcePath),
              ),
            );
          } else if (asset.type === 'mcp') {
            destPaths.push(
              path.join(GLOBAL_GEMINI_DIR, 'config', 'mcp_config.json'),
            );
            destPaths.push(
              path.join(
                GLOBAL_GEMINI_DIR,
                'antigravity-cli',
                'mcp_config.json',
              ),
            );
          } else if (asset.type === 'hook') {
            destPaths.push(
              path.join(GLOBAL_GEMINI_DIR, 'config', 'hooks.json'),
            );
            destPaths.push(
              path.join(GLOBAL_GEMINI_DIR, 'antigravity-cli', 'hooks.json'),
            );
          } else if (asset.type === 'sidecar') {
            destPaths.push(
              path.join(
                GLOBAL_GEMINI_DIR,
                'config',
                'sidecars',
                asset.name,
                'sidecar.json',
              ),
            );
            destPaths.push(
              path.join(
                GLOBAL_GEMINI_DIR,
                'antigravity-cli',
                'sidecars',
                asset.name,
                'sidecar.json',
              ),
            );
          }
        }
      }

      for (const destPath of destPaths) {
        await ensureDir(path.dirname(destPath));

        if (asset.type === 'mcp') {
          await mergeJsonFile(destPath, 'mcpServers', asset.content);
          console.log(
            chalk.cyan(`   Merged MCP configurations into: ${destPath}`),
          );
        } else if (asset.type === 'hook') {
          await mergeJsonFile(destPath, '', asset.content);
          console.log(chalk.cyan(`   Merged event hooks into: ${destPath}`));
        } else if (asset.type === 'skill') {
          const srcSkillDir = path.dirname(asset.sourcePath);
          const destSkillDir = path.dirname(destPath);
          await copyAndResolveDirRecursive(
            srcSkillDir,
            destSkillDir,
            sourceRoot,
          );
          await fs.writeFile(destPath, asset.content);
          console.log(
            chalk.green(
              `   Staged skill directory [${asset.name}] to: ${destSkillDir}`,
            ),
          );
        } else if (asset.type === 'sidecar') {
          const srcSidecarDir = path.dirname(asset.sourcePath);
          const destSidecarDir = path.dirname(destPath);
          await copyAndResolveDirRecursive(
            srcSidecarDir,
            destSidecarDir,
            sourceRoot,
          );
          console.log(
            chalk.green(
              `   Staged sidecar directory [${asset.name}] to: ${destSidecarDir}`,
            ),
          );
        } else {
          await fs.writeFile(destPath, asset.content);
          console.log(
            chalk.dim(
              `   Staged ${asset.type} [${asset.name}] to: ${destPath}`,
            ),
          );
        }

        await logImport(asset, destPath);
      }
    }
  }
}

// --- CLI Entry Point ---

if (
  process.argv[1] &&
  (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js'))
) {
  const importer = new CapabilityImporter();
  const args = process.argv.slice(2);
  const source = args.find((a) => !a.startsWith('--'));

  if (!source) {
    console.error(
      'Usage: tsx index.ts <source> [--global] [--local] [--plugin] [--workspace]',
    );
    process.exit(1);
  }

  importer.run({
    source,
    targetLocal: args.includes('--local'),
    targetGlobal: args.includes('--global'),
    targetWorkspace: args.includes('--workspace'),
    isPlugin: args.includes('--plugin'),
  });
}
