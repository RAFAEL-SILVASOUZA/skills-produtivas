# Captura headless da documentacao (Windows).
#   .\shots.ps1 -Docs "C:\projeto\documentos"
# Depois ABRA as imagens. Passar no check.js nao substitui olhar.

param(
  [string]$Docs = (Get-Location).Path,
  [string]$Out  = (Join-Path $env:TEMP "arch-docs-shots")
)

$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $chrome) { throw "Chrome ou Edge nao encontrado." }
New-Item -ItemType Directory -Force -Path $Out | Out-Null

$index = "file:///" + ($Docs -replace '\\', '/') + "/index.html"

# Descobre as sub-abas de diagrama direto do HTML
$html = Get-Content (Join-Path $Docs "index.html") -Raw
$subs = [regex]::Matches($html, 'data-subtab="(sub-[^"]+)"') |
        ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique

# 1366x768 e o teste que importa: se nao couber aqui, esta ruim
foreach ($s in $subs) {
  & $chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars `
    --force-prefers-reduced-motion --virtual-time-budget=10000 `
    --window-size=1366,768 --user-data-dir="$Out\profile" `
    --screenshot="$Out\laptop-$s.png" "$index#$s" 2>&1 | Out-Null
  Write-Host "  laptop-$s.png"
}

# tela grande e tela estreita
& $chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars `
  --force-prefers-reduced-motion --virtual-time-budget=10000 `
  --window-size=1920,1080 --user-data-dir="$Out\profile" `
  --screenshot="$Out\wide.png" $index 2>&1 | Out-Null
Write-Host "  wide.png"

# OBS: o Chrome headless nao encolhe abaixo de ~800px sem emulacao de
# dispositivo. Um corte na captura de 430px costuma ser artefato, nao bug:
# confirme em 800 antes de sair cacando overflow.
& $chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars `
  --force-prefers-reduced-motion --virtual-time-budget=10000 `
  --window-size=800,1200 --user-data-dir="$Out\profile" `
  --screenshot="$Out\narrow.png" $index 2>&1 | Out-Null
Write-Host "  narrow.png"

Write-Host "`nImagens em: $Out"
Write-Host "Agora ABRA cada uma. Procure: painel fantasma, card cortado,"
Write-Host "rotulo atras de card, linha empilhada, desenho fora da primeira tela."
