export PULUMI_CONFIG_PASSPHRASE=""
pulumi stack export --stack dev > export.json
pulumi preview --stack dev --show-sames --json > preview.json
