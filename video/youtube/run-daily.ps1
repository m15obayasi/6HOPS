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
$playwrightDirectory = Join-Path $videoDirectory '.playwright'
$env:PLAYWRIGHT_BROWSERS_PATH = $playwrightDirectory
$logDirectory = Join-Path $youtubeDirectory 'daily-logs'
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
$logFile = Join-Path $logDirectory ("daily-{0}.log" -f (Get-Date -Format 'yyyy-MM-dd-HHmmss'))

Push-Location $videoDirectory
try {
    if (-not (Test-Path (Join-Path $videoDirectory 'node_modules'))) {
        $ErrorActionPreference = 'Continue'
        & npm install 2>&1 | Tee-Object -FilePath $logFile
        $nativeExitCode = $LASTEXITCODE
        $ErrorActionPreference = 'Stop'
        if ($nativeExitCode -ne 0) { exit $nativeExitCode }
    }
    $playwrightFfmpeg = Get-ChildItem $playwrightDirectory -Filter 'ffmpeg*.exe' -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $playwrightFfmpeg) {
        $ErrorActionPreference = 'Continue'
        & node (Join-Path $videoDirectory 'node_modules\playwright-core\cli.js') install ffmpeg 2>&1 | Tee-Object -FilePath $logFile -Append
        $nativeExitCode = $LASTEXITCODE
        $ErrorActionPreference = 'Stop'
        if ($nativeExitCode -ne 0) { exit $nativeExitCode }
    }
    $arguments = @((Join-Path $videoDirectory 'create_daily_videos.js'), '--privacy', $Privacy)
    if ($Date) { $arguments += @('--date', $Date) }
    $ErrorActionPreference = 'Continue'
    & node @arguments 2>&1 | Tee-Object -FilePath $logFile -Append
    $nativeExitCode = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($nativeExitCode -ne 0) { exit $nativeExitCode }
} catch {
    $_ | Out-String | Tee-Object -FilePath $logFile -Append
    exit 1
} finally {
    Pop-Location
}
