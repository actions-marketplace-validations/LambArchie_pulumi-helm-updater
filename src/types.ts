export interface HelmRelease {
  chart: string
  repo: string
  version: string
}

export interface HelmReleaseUpdate {
  chart: string
  currentVersion: string
  error: boolean
  latestVersion: string
}

export interface HelmRepoIndex {
  apiVersion: string
  entries: {
    [key: string]: {
      appVersion?: string
      digest: string
      version: string
    }[]
  }
  generated: string
}

export interface PulumiStack {
  deployment: {
    resources: {
      outputs: {
        repositoryOpts: {
          repo: string
        }
        status: {
          chart: string
          version: string
        }
      }
      type: string
      urn: string
    }[]
  }
}
