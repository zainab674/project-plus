# Script to remove console.log, console.error, console.warn statements from JS/JSX files

$files = @()
# Only process frontend files now (backend already processed)
$files += Get-ChildItem -Path frontend -Include *.js,*.jsx -Recurse -File | Where-Object { 
    $_.FullName -notlike "*node_modules*" -and 
    $_.FullName -notlike "*public*" -and 
    $_.FullName -notlike "*.next*" -and
    $_.FullName -notlike "*.backup*" 
}

$totalFiles = $files.Count
$processedFiles = 0

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        
        if (-not $content) {
            continue
        }
        
        $changed = $false
        $lines = $content -split "`r?`n"
        $newLines = @()
        
        foreach ($line in $lines) {
            $trimmed = $line.Trim()
            
            # Skip empty lines and standalone comments
            if ($trimmed -eq "" -or $trimmed.StartsWith("//") -or $trimmed.StartsWith("/*")) {
                $newLines += $line
                continue
            }
            
            # Match console.log/error/warn/info/debug on a single line
            if ($line -match '^\s*console\.(log|error|warn|info|debug)\([^)]*\);?\s*$') {
                $changed = $true
                continue
            }
            
            # Match console statements that start on a line (including multi-line)
            if ($trimmed.StartsWith("console.") -and $trimmed -match '^\s*console\.(log|error|warn|info|debug)\(') {
                # Count parentheses to handle multi-line
                $parenCount = 0
                $foundInLine = $false
                foreach ($char in $line.ToCharArray()) {
                    if ($char -eq '(') { $parenCount++ }
                    if ($char -eq ')') { $parenCount-- }
                }
                if ($parenCount -eq 0) {
                    # Single line console statement
                    $changed = $true
                    continue
                } else {
                    # Multi-line console statement - skip this line and continue
                    $changed = $true
                    $newLines += $line  # Keep the opening line for now
                }
            } else {
                $newLines += $line
            }
        }
        
        if ($changed) {
            $newContent = $newLines -join "`r`n"
            Set-Content $file.FullName $newContent -NoNewline
            $processedFiles++
            Write-Host "Processed: $($file.Name)"
        }
    }
    catch {
        Write-Warning "Error processing $($file.FullName): $_"
    }
}

Write-Host "`nDone! Processed $processedFiles out of $totalFiles files."

