Add-Type -AssemblyName System.Drawing
$files = @(
    "e:\Projects\expense-tracker\assets\icon.png",
    "e:\Projects\expense-tracker\assets\android-icon-foreground.png",
    "e:\Projects\expense-tracker\assets\splash-icon.png",
    "e:\Projects\expense-tracker\assets\logo.png"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Cleaning PNG metadata for: $file"
        $tempFile = $file + ".tmp"
        
        # Load the image
        $img = [System.Drawing.Image]::FromFile($file)
        
        # Save it to a temp file as a standard PNG (this strips ICC profiles and other non-standard metadata)
        $img.Save($tempFile, [System.Drawing.Imaging.ImageFormat]::Png)
        $img.Dispose()
        
        # Replace original with the clean one
        Remove-Item $file -Force
        Rename-Item $tempFile (Split-Path $file -Leaf)
        Write-Host "Successfully cleaned $file"
    } else {
        Write-Warning "File not found: $file"
    }
}
