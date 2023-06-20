import { promises as fs } from 'fs'
import path from 'path'
import { fileExists } from '../file-exists'
import { recursiveReadDir } from '../recursive-readdir'

export type TypeScriptIntent = { firstTimeSetup: boolean }

export async function getTypeScriptIntent(
  baseDir: string,
  intentDirs: string[],
  tsconfigPath: string
): Promise<TypeScriptIntent | false> {
  const resolvedTsConfigPath = path.join(baseDir, tsconfigPath)

  // The integration turns on if we find a `tsconfig.json` in the user's
  // project.
  const hasTypeScriptConfiguration = await fileExists(resolvedTsConfigPath)
  if (hasTypeScriptConfiguration) {
    const content = await fs
      .readFile(resolvedTsConfigPath, { encoding: 'utf8' })
      .then(
        (txt) => txt.trim(),
        () => null
      )
    return { firstTimeSetup: content === '' || content === '{}' }
  }

  // Next.js also offers a friendly setup mode that bootstraps a TypeScript
  // project for the user when we detect TypeScript files. So, we need to check
  // the `pages/` directory for a TypeScript file.
  // Checking all directories is too slow, so this is a happy medium.
  const tsFilesRegex = /.*\.(ts|tsx)$/
  const excludedRegex = /(node_modules|.*\.d\.ts$)/
  for (const dir of intentDirs) {
    const typescriptFiles = await recursiveReadDir(
      dir,
      (name) => tsFilesRegex.test(name),
      (name) => excludedRegex.test(name)
    )
    if (typescriptFiles.length) {
      return { firstTimeSetup: true }
    }
  }

  return false
}