param(
    [ValidateSet('private', 'unlisted', 'public')]
    [string]$Privacy = 'public',
    [string]$Date = ''
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$OutputEncoding = [Console]::OutputEncoding
& chcp 65001 | Out-Null
$youtubeDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$videoDirectory = Split-Path -Parent $youtubeDirectory
$logDirectory = Join-Path $youtubeDirectory 'daily-logs'
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
$logFile = Join-Path $logDirectory ("daily-{0}.log" -f (Get-Date -Format 'yyyy-MM-dd-HHmmss'))

Push-Location $videoDirectory
try {
    if (-not (Test-Path (Join-Path $videoDirectory 'node_modules'))) {
        & npm install 2>&1 | Tee-Object -FilePath $logFile
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    $arguments = @((Join-Path $videoDirectory 'create_daily_videos.js'), '--privacy', $Privacy)
    if ($Date) { $arguments += @('--date', $Date) }
    & node @arguments 2>&1 | Tee-Object -FilePath $logFile -Append
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} catch {
    $_ | Out-String | Tee-Object -FilePath $logFile -Append
    exit 1
} finally {
    Pop-Location
}
