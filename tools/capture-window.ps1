Add-Type -AssemblyName System.Drawing

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class W2 {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
"@

# 列出所有有窗口的 java 进程及其尺寸
Write-Output "--- java windows ---"
Get-Process java -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.MainWindowHandle -ne [IntPtr]::Zero) {
        $r = New-Object W2+RECT
        [W2]::GetWindowRect($_.MainWindowHandle, [ref]$r) | Out-Null
        $w = $r.Right - $r.Left
        $h = $r.Bottom - $r.Top
        Write-Output ("pid={0} size={1}x{2} title=[{3}]" -f $_.Id, $w, $h, $_.MainWindowTitle)
    }
}

# 挑面积最大的 java 窗口截图
$best = $null; $area = 0; $br = $null
Get-Process java -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.MainWindowHandle -ne [IntPtr]::Zero) {
        $r = New-Object W2+RECT
        [W2]::GetWindowRect($_.MainWindowHandle, [ref]$r) | Out-Null
        $a = ($r.Right - $r.Left) * ($r.Bottom - $r.Top)
        if ($a -gt $area) { $area = $a; $best = $_; $br = $r }
    }
}

if (-not $best) { Write-Output "NO_JAVA_WINDOW"; exit 1 }

$w = $br.Right - $br.Left
$h = $br.Bottom - $br.Top
Write-Output ("--- capturing pid={0} {1}x{2} ---" -f $best.Id, $w, $h)

[W2]::SetForegroundWindow($best.MainWindowHandle) | Out-Null
Start-Sleep -Milliseconds 1500

$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($br.Left, $br.Top, 0, 0, $bmp.Size)
$bmp.Save($env:OUTPNG, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "SAVED"
