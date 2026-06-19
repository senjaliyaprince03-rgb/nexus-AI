$logFile = "$PSScriptRoot\..\health_monitor.log"
$maxLogSize = 5MB
$endpoints = @(
    @{ Name="Backend API"; Url="http://127.0.0.1:8000/docs" },
    @{ Name="Frontend UI"; Url="http://127.0.0.1:3001/" },
    @{ Name="Gateway Hub"; Url="http://127.0.0.1:9100/" }
)

$consecutiveFailures = @{}
$isDown = @{}
foreach ($ep in $endpoints) {
    $consecutiveFailures[$ep.Name] = 0
    $isDown[$ep.Name] = $false
}

function Write-Log {
    param([string]$Message)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $Message"
    Write-Host $line
    
    if (Test-Path $logFile) {
        $fileInfo = Get-Item $logFile
        if ($fileInfo.Length -gt $maxLogSize) {
            Move-Item $logFile "$logFile.bak" -Force
        }
    }
    Add-Content -Path $logFile -Value $line
}

function Show-Toast {
    param([string]$Title, [string]$Message)
    try {
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        $template = [Windows.UI.Notifications.ToastTemplateType]::ToastText02
        $xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent($template)
        $textElements = $xml.GetElementsByTagName("text")
        $textElements.Item(0).AppendChild($xml.CreateTextNode($Title)) | Out-Null
        $textElements.Item(1).AppendChild($xml.CreateTextNode($Message)) | Out-Null
        
        $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
        $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("NexusAi Health Monitor")
        $notifier.Show($toast)
    } catch {
        # Fallback to pop-up message
        $wshell = New-Object -ComObject Wscript.Shell
        $wshell.Popup($Message, 10, $Title, 0x30) | Out-Null
        Write-Log "Failed to show toast, fell back to wscript popup."
    }
}

Write-Log "Health monitor started."

while ($true) {
    foreach ($ep in $endpoints) {
        $name = $ep.Name
        $url = $ep.Url
        
        try {
            $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop -MaximumRedirection 0
            $statusCode = $resp.StatusCode
        } catch {
            if ($_.Exception.Response) {
                $statusCode = $_.Exception.Response.StatusCode.value__
            } else {
                $statusCode = 0
            }
        }
        
        if ($statusCode -eq 200 -or $statusCode -eq 307 -or $statusCode -eq 308) {
            if ($isDown[$name]) {
                Write-Log "RECOVERY: $name is back online at $url"
                Show-Toast -Title "Service Recovered" -Message "$name is back online."
                $isDown[$name] = $false
            }
            $consecutiveFailures[$name] = 0
        } else {
            $consecutiveFailures[$name]++
            Write-Log "CHECK FAILED: $name returned HTTP $statusCode. Consecutive failures: $($consecutiveFailures[$name])"
            
            if ($consecutiveFailures[$name] -ge 3 -and -not $isDown[$name]) {
                Write-Log "ALERT: $name is DOWN! Check logs for details."
                Show-Toast -Title "Service Outage Alert" -Message "$name ($url) has failed 3 consecutive checks."
                $isDown[$name] = $true
            }
        }
    }
    Start-Sleep -Seconds 30
}
