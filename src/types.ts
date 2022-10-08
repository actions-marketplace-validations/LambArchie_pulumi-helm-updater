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

export interface PulumiResource {
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
}

export interface PulumiStackPreview {
  steps: {
    op: 'delete' | 'same' | 'update'
    oldState: PulumiResource
    newState: PulumiResource
  }[]
}

export interface PulumiStackExport {
  deployment: {
    resources: PulumiResource[]
  }
  version: string
}
