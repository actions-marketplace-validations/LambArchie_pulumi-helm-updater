# Pulumi Helm Updater

This is a GitHub Action/Node Script which reads your pulumi stack state and checks if any of the charts in that stack can be updated.

Currently this only supports [helm.v3.Release](https://www.pulumi.com/registry/packages/kubernetes/api-docs/helm/v3/release/) and not [helm.v3.Chart](https://www.pulumi.com/registry/packages/kubernetes/api-docs/helm/v3/chart/) as I couldn't find a nice way to get the current chart version.

## Usage

```yaml
- uses: LambArchie/pulumi-helm-updater@v1
  with:
    # Which pulumi stack to check for helm release updates
    # Set to your pulumi stack name
    stack_name: services

    # Set to the folder which contains your target 'Pulumi.yaml'
    # Defaults to repo root
    stack_location: pulumi/

    # Set to the file location of an already exported pulumi stack
    # To export run 'pulumi stack export'
    # If set do not set either stack_name or stack_location
    # as they will not be used
    # Recommend doing this way if your stack requires configuration before accessing
    stack_file: export.json

    # What if any output to disk should occur
    #  'none' - Disable writing to disk (default)
    #  'js'   - Output in a format JavaScript can understand
    #           Format is 'export const releaseVersion = '1.2.3'
    #           Example can be seen in example/helmVersions.ts
    # Custom formats can be done via the action output
    # Default: none
    write_format: js

    # What location should be written to if write_format
    # is not set to 'none'
    # Path is relative to repo root
    write_location: helmVersions.ts
```

### Outputs

This action outputs `latest_versions` which is a JSON object in the following format.

```jsonc
[
  {
    "chart": "chart-name",
    "currentVersion": "1.2.3",
    "error": false,
    "latestVersion": "2.0.0"
  }
]
```

If error is true latestVersion will ALWAYS equal currentVersion as this action failed to determine the latest release for that chart.  
Reason latestVersion isn't missing is because I felt it was better for latestVersion to always be present than sometimes missing.

## Examples

### Use stack name

```yaml
- uses: LambArchie/pulumi-helm-updater@v1
  with:
    # Set to your pulumi stack name
    stack_name: services
```

### Use stack file

```yaml
- uses: LambArchie/pulumi-helm-updater@v1
  with:
    # Set to the file contain the output of 'pulumi stack export'
    stack_file: export.json
```

### Advanced Output

```yaml
- uses: LambArchie/pulumi-helm-updater@v1
  id: helm-updates
  with:
    stack_name: services

    # Leaving at default as using action output instead
    write_format: none

- run: echo "${{ steps.helm-updates.outputs.latest_versions }} > out.txt"
```
