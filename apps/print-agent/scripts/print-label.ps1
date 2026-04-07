param(
  [Parameter(Mandatory=$true)][string]$TemplatePath,
  [Parameter(Mandatory=$true)][string]$IntakeNumber,
  [Parameter(Mandatory=$true)][string]$QrPayload,
  [Parameter(Mandatory=$true)][string]$PrinterName
)

$ErrorActionPreference = "Stop"

# Brother b-PAC 3 SDK COM automation.
# Requires the b-PAC 3.x SDK to be installed on this machine
# (registers the "bpac.Document" COM class).
$bpac = New-Object -ComObject bpac.Document

try {
  if (-not $bpac.Open($TemplatePath)) {
    throw "bpac.Open failed for template: $TemplatePath"
  }

  # Select the printer and override the template's saved printer ($true).
  $bpac.SetPrinter($PrinterName, $true) | Out-Null

  $intakeObj = $bpac.GetObject("intake_number")
  if ($intakeObj -eq $null) {
    throw "Template object 'intake_number' not found in $TemplatePath"
  }
  $intakeObj.Text = $IntakeNumber

  $qrObj = $bpac.GetObject("qr_payload")
  if ($qrObj -eq $null) {
    throw "Template object 'qr_payload' not found in $TemplatePath"
  }
  $qrObj.Text = $QrPayload

  # StartPrint(docName, printOption). 0 = bpoDefault.
  if (-not $bpac.StartPrint("Label", 0)) {
    throw "bpac.StartPrint failed"
  }

  # PrintOut(copies, printOption). 0 = bpoDefault.
  if (-not $bpac.PrintOut(1, 0)) {
    $bpac.EndPrint() | Out-Null
    throw "bpac.PrintOut failed"
  }

  $bpac.EndPrint() | Out-Null
}
finally {
  $bpac.Close() | Out-Null
}
