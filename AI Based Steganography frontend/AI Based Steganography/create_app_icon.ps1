Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path (Get-Location) "public\stegxplore-logo.jpg"
$outPng = Join-Path (Get-Location) "public\icon.png"

# Load source 1024x1024 logo
$srcImg = [System.Drawing.Bitmap]::FromFile($srcPath)

# We will create a 256x256 high-resolution icon with a rounded squircle tile:
# White background tile with subtle lavender border and gentle shadow, matching the app's logo badge exactly.
$destBmp = New-Object System.Drawing.Bitmap 256, 256, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($destBmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$g.Clear([System.Drawing.Color]::Transparent)

function Get-RoundedRectPath($x, $y, $w, $h, $r) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2.0
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

# 1. Multi-layered drop shadow so tile outline is unmistakably visible on light, white, and dark wallpapers
for ($s = 10; $s -ge 1; $s--) {
    $alpha = [int](30 - ($s * 2.6))
    if ($alpha -gt 0) {
        $shadowPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb($alpha, 25, 10, 50)), ($s * 2.0)
        $shadowPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
        $sPath = Get-RoundedRectPath (14 - $s/2) (16 - $s/2) (228 + $s) (228 + $s) 58
        $g.DrawPath($shadowPen, $sPath)
        $shadowPen.Dispose()
        $sPath.Dispose()
    }
}

# 2. Main rounded squircle tile (228x228 inside 256x256 canvas)
$tilePath = Get-RoundedRectPath 14 14 228 228 56

# Fill tile with crisp pure solid white
$whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
$g.FillPath($whiteBrush, $tilePath)
$whiteBrush.Dispose()

# Draw the centered logo
$oldClip = $g.Clip
$g.SetClip($tilePath)
$innerRect = New-Object System.Drawing.Rectangle 28, 28, 200, 200
$g.DrawImage($srcImg, $innerRect)
$g.Clip = $oldClip

# Outer protective contrast stroke (rich cyber violet/purple) drawn ON TOP so tile shape is perfectly crisp
$outerPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 124, 58, 237)), 7.0
$outerPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$g.DrawPath($outerPen, $tilePath)
$outerPen.Dispose()

# Inner luminous accent stroke (magenta glow)
$innerTilePath = Get-RoundedRectPath 17.5 17.5 221 221 53
$innerPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(210, 236, 72, 153)), 2.5
$innerPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$g.DrawPath($innerPen, $innerTilePath)
$innerPen.Dispose()
$innerTilePath.Dispose()

$tilePath.Dispose()

$g.Dispose()
$srcImg.Dispose()

# Save PNG
$destBmp.Save($outPng, [System.Drawing.Imaging.ImageFormat]::Png)
$destBmp.Dispose()

Write-Host "New high-contrast icon.png created successfully at: $outPng"
