# Requires -Version 7.5

<#
.SYNOPSIS
    Gemini API Replay Script for PowerShell.
    
.DESCRIPTION
    This script is used to replay a Gemini API request using a raw JSON payload.
    It is particularly useful for debugging the exact requests made by the
    Gemini CLI.

.PARAMETER Payload
    Path to the JSON request payload.

.PARAMETER Model
    The Gemini model ID (e.g., gemini-3-flash-preview).

.PARAMETER Stream
    Use the streaming API endpoint. Defaults to non-streaming.

.EXAMPLE
    .\scripts\send_gemini_request.ps1 -Payload gcli-request.json -Model gemini-3-flash-preview
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [string]$Payload,

    [Parameter(Mandatory = $true)]
    [string]$Model,

    [switch]$Stream
)

# Strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Paths
$ScriptDir = $PSScriptRoot
$ProjectRoot = Split-Path -Parent $ScriptDir

# Load environment variables from .env if it exists
$EnvFile = Join-Path $ProjectRoot ".env"
if (Test-Path $EnvFile) {
    Write-Information "[INFO] Loading environment variables from .env file..."
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^([^#=]+)=(.*)$') {
            $Name = $Matches[1].Trim()
            $Value = $Matches[2].Trim().Trim('"').Trim("'")
            [System.Environment]::SetEnvironmentVariable($Name, $Value)
        }
    }
}

# Validate API Key
if (-not $env:GEMINI_API_KEY) {
    Write-Error "GEMINI_API_KEY environment variable is not set."
    exit 1
}

# Validate Payload File
$PayloadPath = Resolve-Path $Payload -ErrorAction SilentlyContinue
if (-not $PayloadPath) {
    Write-Error "Payload file '$Payload' does not exist."
    exit 1
}

# API Endpoint definition
$GenerateContentApi = if ($Stream) { "streamGenerateContent" } else { "generateContent" }
$Mode = if ($Stream) { "Streaming" } else { "Non-streaming (Default)" }

Write-Host "Mode: $Mode"
Write-Host "Sending request to model: $Model"
Write-Host "Using payload from: $PayloadPath"
Write-Host "----------------------------------------"

$Uri = "https://generativelanguage.googleapis.com/v1beta/models/${Model}:${GenerateContentApi}?key=$($env:GEMINI_API_KEY)"

try {
    if ($Stream) {
        # For streaming, we'll use curl.exe directly as Invoke-RestMethod doesn't handle streams gracefully in all versions
        curl.exe -X POST `
            -H "Content-Type: application/json" `
            $Uri `
            -d "@$PayloadPath"
    }
    else {
        # For non-streaming, use Invoke-RestMethod for easy JSON handling
        $Body = Get-Content $PayloadPath -Raw
        $Response = Invoke-RestMethod -Uri $Uri -Method Post -Body $Body -ContentType "application/json"
        $Response | ConvertTo-Json -Depth 10
    }
}
catch {
    Write-Error "Request failed: $_"
    exit 1
}

Write-Host "`n----------------------------------------"
