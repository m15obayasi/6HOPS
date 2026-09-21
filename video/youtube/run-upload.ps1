param(
    [switch]$DryRun,
    [ValidateSet('private', 'unlisted', 'public')]
    [string]$Privacy = 'private'
)

$ErrorActionPreference = 'Stop'
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$uploader = Join-Path $scriptDirectory 'upload-latest.js'
$logDirectory = Join-Path $scriptDirectory 'logs'
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
$logFile = Join-Path $logDirectory ("upload-{0}.log" -f (Get-Date -Format 'yyyy-MM-dd-HHmmss'))

$arguments = @($uploader, '--privacy', $Privacy)
if ($DryRun) { $arguments += '--dry-run' }

try {
    & node @arguments 2>&1 | Tee-Object -FilePath $logFile
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} catch {
    $_ | Out-String | Tee-Object -FilePath $logFile -Append
    exit 1
}
