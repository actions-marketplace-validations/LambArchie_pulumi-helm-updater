import * as k8s from '@pulumi/kubernetes'
import * as helmVersions from './helmVersions'

/* eslint-disable @typescript-eslint/no-unused-vars */
const argoCdApplicationset = new k8s.helm.v3.Release('argo-cd-applicationset', {
  name: 'argocd-applicationset',
  chart: 'argocd-applicationset', // Purposefully chose deprecated chart so never any updates available
  version: helmVersions.argocdApplicationsetVersion,
  repositoryOpts: {
    repo: 'https://argoproj.github.io/argo-helm',
  },
  namespace: 'argocd',
  createNamespace: true,
  values: {
    mountGPGKeysVolume: false,
    mountSSHKnownHostsVolume: false,
    mountTLSCertsVolume: false,
    rbac: {
      pspEnabled: false,
    },
  },
})

const argoCdNotifications = new k8s.helm.v3.Release('argo-cd-notifications', {
  name: 'argocd-notifications',
  chart: 'argocd-notifications', // Purposefully chose deprecated chart so never any updates available
  version: helmVersions.argocdNotificationsVersion, // Chose one update behind latest
  repositoryOpts: {
    repo: 'https://argoproj.github.io/argo-helm',
  },
  namespace: 'argocd',
  createNamespace: true,
})
