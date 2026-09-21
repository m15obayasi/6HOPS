param(
    [ValidatePattern('^([01]\d|2[0-3]):[0-5]\d$')]
    [string]$At = '09:00'
)

$ErrorActionPreference = 'Stop'
$taskName = '6HOPS Daily YouTube Upload'
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$runner = Join-Path $scriptDirectory 'run-upload.ps1'
$actionArguments = "-NoProfile -ExecutionPolicy Bypass -File `"$runner`" -Privacy private"
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $actionArguments
$trigger = New-ScheduledTaskTrigger -Daily -At $At
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description '最新の6HOPS Daily動画をYouTubeへ非公開アップロードします。' -Force | Out-Null
Write-Output "タスクを登録しました: $taskName（毎日 $At）"
