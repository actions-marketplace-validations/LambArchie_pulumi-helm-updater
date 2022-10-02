import { spawnSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import * as core from '@actions/core'
import { HelmRelease, PulumiStack } from './types'

export const getStack = (stackName: string, stackFile: string) => {
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
    if (!existsSync(stackFile)) {
      core.setFailed(`Failed to read from file ${stackFile}, therefore quitting as cannot read pulumi stack export`)
      process.exit()
    }
    output = readFileSync(stackFile, 'utf-8')
  }

  try {
    const stack = JSON.parse(output)
    if (stackFile) {
      return {
        deployment: stack.checkpoint.latest,
      } as PulumiStack
    }
    return stack as PulumiStack
  } catch (err) {
    if (err instanceof SyntaxError) {
      core.setFailed(`Failed to parse the pulumi stack ${stackName}`)
      process.exit()
    }
    throw err
  }
}

export const parseStack = (pulumiStack: PulumiStack) => {
  const helmReleases: HelmRelease[] = []
  pulumiStack.deployment.resources.forEach((resource) => {
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
