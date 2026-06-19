Get-ChildItem -Path "c:\Users\Prince\Downloads\NexusAi\nexusai\frontend\src" -Recurse -File -Include *.tsx,*.ts | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content) {
        $newContent = $content -replace 'dark:text-white', 'dark:text-[#F8F9FA]' 
                                -replace '#0A0A0A', '#18181B' 
                                -replace '#FF6B35', '#C5A059' 
                                -replace '#f59e0b', '#D4AF37' 
                                -replace '#4A4A4A', '#4B5563' 
                                -replace '#8A8A8A', '#9CA3AF' 
                                -replace 'border-white', 'border-[#F8F9FA]'
        
        if ($content -cne $newContent) {
            Set-Content $_.FullName $newContent -NoNewline
        }
    }
}
