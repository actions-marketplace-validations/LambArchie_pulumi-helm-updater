import { spawnSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import * as core from '@actions/core'
import { HelmRelease, PulumiResource, PulumiStackPreview, PulumiStackExport } from './types'

export const getStack = (stackName: string, stackFile: string) => {
  const stackFileFormat = core.getInput('stack_file_format', { required: false })
  let output: string

  if (stackName) {
    const stackLocation = core.getInput('stack_location', { required: false })
    core.debug(`Stack location was set to ${stackLocation}`)
    const cwd = stackLocation || undefined

    const commandOutput = spawnSync('pulumi', ['stack', 'export', '--stack', stackName], { cwd, encoding: 'utf-8', shell: true })
    if (commandOutput.status !== 0) {
      core.error(`Failed to export the pulumi stack ${stackName}`)
      core.setFailed(commandOutput.stderr)
      process.exit()
    }

    if (commandOutput.stderr) {
      core.warning(`The following warning occured on the stack export
${commandOutput.stderr}`)
    }

    output = commandOutput.stdout
  } else {
    core.debug(`Using stack format ${stackFileFormat}`)
    if (!existsSync(stackFile)) {
      core.setFailed(`Failed to read from file ${stackFile}, therefore quitting as cannot read pulumi stack export`)
      process.exit()
    }
    output = readFileSync(stackFile, 'utf-8')
  }

  try {
    const stack = JSON.parse(output)
    if (stackFile) {
      switch (stackFileFormat) {
        case 'export':
          return stack as PulumiStackExport
        case 'preview':
          return stack as PulumiStackPreview
        default:
          core.setFailed(`Stack Format ${stackFileFormat} isn't recongised`)
          process.exit()
      }
    }
    return stack as PulumiStackExport
  } catch (err) {
    if (err instanceof SyntaxError) {
      core.setFailed(`Failed to parse the pulumi stack ${stackName}`)
      process.exit()
    }
    throw err
  }
}

export const parseStack = (pulumiStack: PulumiStackPreview | PulumiStackExport) => {
  const helmReleases: HelmRelease[] = []
  let resources: PulumiResource[]

  if ('deployment' in pulumiStack) {
    // Stack Export
    if (pulumiStack.version !== '3') {
      core.setFailed('Unrecognised Pulumi Stack Version')
      process.exit()
    }
    resources = pulumiStack.deployment.resources
  } else if ('steps' in pulumiStack) {
    // Preview
    resources = pulumiStack.steps.map(step => step.newState)
  } else {
    core.setFailed('Unrecognised Stack Format Type')
    process.exit()
  }

  resources.forEach((resource) => {
    // Currently don't support kubernetes:helm.sh/v3:Chart as couldn't find a repliable way
    // to get the current version
    if (resource.type === 'kubernetes:helm.sh/v3:Release') {
      core.debug(`Matched resource which has a URN of ${resource.urn}`)
      const releaseInfo = {
        chart: resource.outputs.status.chart,
        repo: resource.outputs.repositoryOpts.repo,
        version: resource.outputs.status.version,
      }
      helmReleases.push(releaseInfo)
    } else {
      core.debug(`Not matching resource of type ${resource.type}, URN is ${resource.urn}`)
    }
  })
  return helmReleases
}
