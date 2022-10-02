import { existsSync, readFileSync, writeFileSync } from 'fs'
import * as core from '@actions/core'
import { HelmReleaseUpdate } from './types'

const toCamelCase = (str: string) => str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())

export const writeAsJS = (updates: HelmReleaseUpdate[], location: string) => {
  core.debug(`Writing JS file to ${location}`)
  if (!existsSync(location)) {
    core.setFailed(`Failed to read from file ${location} so not writing to it (please ensure it exists first)`)
    process.exit()
  }

  const fileData = readFileSync(location, 'utf-8')

  Promise.all(fileData.split('\n').map((line, lineNum) => {
    const lineSplit: string[] = line.split(' ')
    // export const chartNameVersion = '1.2.3'
    if (lineSplit.length >= 5 && lineSplit[0] === 'export' && lineSplit[1] === 'const' && lineSplit[3] === '=') {
      const lineChart = lineSplit[2]
      const updateFailure = updates.every((update) => {
        // JS variables can't use - so making camelCase + add Version after for better imports
        if (`${toCamelCase(update.chart)}Version` === lineChart) {
          const versionUpdate = `'${update.latestVersion}'`
          if (versionUpdate === lineSplit[4]) {
            core.debug(`Chart ${lineChart} is already on latest version ${update.latestVersion}`)
          } else {
            lineSplit[4] = versionUpdate
            core.debug(`Updated line for chart ${lineChart} to version ${update.latestVersion}`)
          }
          return false
        }
        return true
      })
      if (updateFailure) {
        core.info(`Did not find release ${lineChart} in this pulumi stack so did not check it for updates`)
        return line
      }
    } else {
      core.debug(`Line ${lineNum} skipped due to not meeting all conditions`)
      return line
    }
    return lineSplit.join(' ')
  })).then((newLines) => {
    const newFile = newLines.join('\n')
    writeFileSync(location, newFile, 'utf-8')
  })
}
