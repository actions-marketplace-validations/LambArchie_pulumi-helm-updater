import * as core from '@actions/core'
import axios from 'axios'
import { load, YAMLException } from 'js-yaml'
import { compareBuild, valid } from 'semver'
import { HelmRelease, HelmReleaseUpdate, HelmRepoIndex } from './types'

export const parseHelmRepoIndex = (currentRelease: HelmRelease, repoIndex: HelmRepoIndex) => {
  const { chart } = currentRelease
  const currentVersion = valid(currentRelease.version)
  if (currentVersion === null) {
    core.error(`Could not parse the current chart version for ${chart}, not checking for updates`)
    return {
      chart,
      currentVersion: currentRelease.version,
      error: true,
      latestVersion: currentRelease.version,
    } as HelmReleaseUpdate
  }
  let latestVersion = currentVersion || ''

  repoIndex.entries[chart].forEach((chartVersion) => {
    const version = valid(chartVersion.version)
    if (version) {
      if (compareBuild(version, latestVersion) === 1) {
        core.debug(`Chart ${chart}, found newer release ${version}. Currently ${latestVersion}`)
        latestVersion = version
      } else {
        core.debug(`Chart ${chart}, found older or same version as current latest. Found was ${version} and current latest is ${latestVersion}`)
      }
    } else {
      core.warning(`Chart ${chart} contains chart version ${chartVersion.version} which the version number is not semver compatible so skipping version`)
    }
  })

  if (currentVersion === latestVersion) {
    core.info(`No updates available for chart ${chart}, staying on version ${currentVersion}`)
  } else {
    core.info(`Update is available for chart ${chart}, current version is ${currentVersion} but latest version is ${latestVersion}`)
  }

  return {
    chart,
    currentVersion,
    error: false,
    latestVersion,
  } as HelmReleaseUpdate
}

export const checkHelmUpdates = async (currentHelmRelease: HelmRelease) => {
  const chartUrl = `${currentHelmRelease.repo}/index.yaml`
  core.debug(`Requesting ${chartUrl}`)

  try {
    const request = await axios.get(chartUrl)
    core.debug(`Parsing ${chartUrl}`)
    const chartYaml = load(request.data) as HelmRepoIndex
    return parseHelmRepoIndex(currentHelmRelease, chartYaml)
  } catch (err) {
    if (axios.isAxiosError(err)) {
      core.error(`Failed to download the helm repo index from ${currentHelmRelease.repo} for ${currentHelmRelease.chart}`)
      if (err.response) {
        core.error(`Server responded in non 2xx range on request to ${chartUrl}`)
      }
      core.debug(err.request)
      core.debug(err.message)
    } else if (err instanceof YAMLException) {
      core.error(`Failed to parse the download helm repo index from ${currentHelmRelease.repo} for ${currentHelmRelease.chart}`)
    } else {
      throw err
    }
  }

  core.error(`Failed to download or parse the repo index from ${currentHelmRelease.repo} for ${currentHelmRelease.chart} so skipping update checking for chart`)
  return {
    chart: currentHelmRelease.chart,
    currentVersion: currentHelmRelease.version,
    error: true,
    latestVersion: currentHelmRelease.version,
  } as HelmReleaseUpdate
}
