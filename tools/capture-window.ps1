Add-Type -AssemblyName System.Drawing

<#
  按窗口句柄截取一个 Java 窗口。

  ## 为什么用 PrintWindow 而不是 CopyFromScreen

  旧版用 `CopyFromScreen(x, y, ...)` —— 它抓的是**屏幕上那块矩形区域**。
  `SetForegroundWindow` 在 Windows 上经常**静默失败**（前台锁），
  于是抓到的其实是压在该矩形上方的另一个窗口。

  实测后果：A/B 验证把「Hermes 聊天窗口」当成了 Compose 原型，
  两次运行抓的是同一个会变化的窗口 → 整图差异 340，判据全崩，
  报出一个**假的失败**。而且它不报错，只是 `SAVED`。

  `PrintWindow(hwnd, hdc, PW_RENDERFULLCONTENT=2)` 让窗口**渲染自身内容**，
  与是否在前台、是否被遮挡无关 —— 这才是截图验证的正确原语。

  ## 额外的防错
  - `EXPECT_TITLE`：只考虑标题匹配的窗口；匹配不到直接失败，
    而不是退而求其次抓「面积最大的 java 窗口」。
  - 抓完检查图像不是纯色（防空白/未渲染）。
#>

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class W2 {
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
    [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hwnd, IntPtr hdc, uint flags);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
"@

$expect = $env:EXPECT_TITLE

# 列出所有有窗口的 java 进程及其尺寸
Write-Output "--- java windows ---"
$cands = @()
Get-Process java -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.MainWindowHandle -ne [IntPtr]::Zero) {
        $r = New-Object W2+RECT
        [W2]::GetWindowRect($_.MainWindowHandle, [ref]$r) | Out-Null
        $w = $r.Right - $r.Left
        $h = $r.Bottom - $r.Top
        Write-Output ("pid={0} size={1}x{2} visible={3} title=[{4}]" -f `
            $_.Id, $w, $h, [W2]::IsWindowVisible($_.MainWindowHandle), $_.MainWindowTitle)
        $cands += [pscustomobject]@{ Proc = $_; Rect = $r; W = $w; H = $h; Title = $_.MainWindowTitle }
    }
}

if ($cands.Count -eq 0) { Write-Output "NO_JAVA_WINDOW"; exit 1 }

# 优先按标题精确筛选 —— 宁可失败，也不要抓错窗口
if ($expect) {
    $matched = $cands | Where-Object { $_.Title -eq $expect }
    if ($matched.Count -eq 0) {
        Write-Output "TITLE_NOT_FOUND expected=[$expect]"
        exit 1
    }
    $best = $matched | Sort-Object { $_.W * $_.H } -Descending | Select-Object -First 1
} else {
    $best = $cands | Sort-Object { $_.W * $_.H } -Descending | Select-Object -First 1
}

$w = $best.W
$h = $best.H
if ($w -le 0 -or $h -le 0) { Write-Output "BAD_RECT ${w}x${h}"; exit 1 }

Write-Output ("--- capturing pid={0} {1}x{2} title=[{3}] ---" -f $best.Proc.Id, $w, $h, $best.Title)

$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$hdc = $g.GetHdc()
# PW_RENDERFULLCONTENT = 0x2 —— 让 DirectComposition/GPU 合成的窗口也能渲染出内容
$ok = [W2]::PrintWindow($best.Proc.MainWindowHandle, $hdc, 2)
$g.ReleaseHdc($hdc)
$g.Dispose()

if (-not $ok) {
    $bmp.Dispose()
    Write-Output "PRINTWINDOW_FAILED"
    exit 1
}

# 纯色检查：PrintWindow 在个别驱动上会返回全黑图，不能当成功
$sample = 0; $n = 0
$stepX = [Math]::Max(1, [int]($w / 24))
$stepY = [Math]::Max(1, [int]($h / 24))
for ($y = 8; $y -lt $h; $y += $stepY) {
    for ($x = 8; $x -lt $w; $x += $stepX) {
        $c = $bmp.GetPixel($x, $y)
        $sample += ($c.R + $c.G + $c.B); $n++
    }
}
$mean = if ($n -gt 0) { $sample / $n } else { 0 }
if ($mean -lt 12) {
    $bmp.Dispose()
    Write-Output ("BLANK_CAPTURE mean={0:N1}" -f $mean)
    exit 1
}

$bmp.Save($env:OUTPNG, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output ("SAVED mean={0:N1}" -f $mean)
