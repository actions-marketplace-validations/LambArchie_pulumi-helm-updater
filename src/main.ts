import * as core from '@actions/core'
import { checkHelmUpdates } from './helm'
import { getStack, parseStack } from './stack'
import { writeAsJS } from './write'

const run = async () => {
  try {
    const stackName = core.getInput('stack_name', { required: false })
    const stackFile = core.getInput('stack_file', { required: false })
    if (stackName && stackFile) {
      core.setFailed('Both stack_name and stack_file were set, quitting')
      process.exit()
    } else if (stackName) {
      core.info(`Using pulumi stack ${stackName}`)
    } else if (stackFile) {
      core.info(`Using already exported pulumi stack in file ${stackFile}`)
    } else {
      core.setFailed('Neither stack_name or stack_file were set, quitting')
      process.exit()
    }

    const pulumiStack = getStack(stackName, stackFile)
    const currentHelmReleases = parseStack(pulumiStack)

    Promise.all(currentHelmReleases.map(release => checkHelmUpdates(release))).then((releases) => {
      core.setOutput('latest_versions', JSON.stringify(releases))

      const writeFormat = core.getInput('write_format', { required: false })
      const writeLocation = core.getInput('write_location', { required: false })

      switch (writeFormat) {
        case 'js':
          writeAsJS(releases, writeLocation); break
        case 'none':
          core.info('Not writting to disk as format is none'); break
        default:
          core.warning(`Unrecognised option for write_format ${writeFormat}`); break
      }
    })
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
