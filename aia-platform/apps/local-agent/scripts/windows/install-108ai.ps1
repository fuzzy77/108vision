#Requires -Version 5.1
<#
.SYNOPSIS
  Installa 108 AI Desktop Agent per beta PMI (PATH, autostart, primo avvio agent).

.USAGE
  Right-click → Run with PowerShell
  oppure: powershell -ExecutionPolicy Bypass -File install-108ai.ps1
#>

$ErrorActionPreference = 'Stop'

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$exe = Join-Path $here '108ai.exe'

if (-not (Test-Path $exe)) {
  Write-Host '[ERR] 108ai.exe non trovato nella stessa cartella dello script.' -ForegroundColor Red
  exit 1
}

Write-Host ''
Write-Host '  108 AI — Installazione beta' -ForegroundColor Green
Write-Host ''

& $exe --install
if ($LASTEXITCODE -ne 0) {
  Write-Host '[ERR] Installazione fallita.' -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host ''
Write-Host '  Avvio agent in background (tray)...' -ForegroundColor Cyan
Start-Process -FilePath $exe -ArgumentList 'agent' -WindowStyle Minimized

Write-Host ''
Write-Host '  [OK] Installazione completata.' -ForegroundColor Green
Write-Host '  - Tray icon in basso a destra'
Write-Host '  - Triage mattutino lun-ven 07:00 (primo avvio)'
Write-Host '  - Terminale: digita 108ai per la shell'
Write-Host ''
