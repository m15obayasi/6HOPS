param(
    [ValidatePattern('^([01]\d|2[0-3]):[0-5]\d$')]
    [string]$At = '00:00',
    [ValidateSet('private', 'unlisted', 'public')]
    [string]$Privacy = 'public'
)

$ErrorActionPreference = 'Stop'
$taskName = '6HOPS Daily YouTube Upload'
$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$runner = Join-Path $scriptDirectory 'run-daily.ps1'
$actionArguments = "-NoProfile -ExecutionPolicy Bypass -File `"$runner`" -Privacy $Privacy"
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $actionArguments
$dailyTrigger = New-ScheduledTaskTrigger -Daily -At $At
$logonTrigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -RestartCount 2 -RestartInterval (New-TimeSpan -Minutes 20) -ExecutionTimeLimit (New-TimeSpan -Hours 3)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger @($dailyTrigger, $logonTrigger) -Settings $settings -Description '6HOPSの日英Daily動画を毎日0時に生成・投稿し、未実行時は次回サインイン時に補完します。' -Force | Out-Null
Write-Output "タスクを登録しました: $taskName（毎日 $At＋サインイン時、公開設定: $Privacy）"
