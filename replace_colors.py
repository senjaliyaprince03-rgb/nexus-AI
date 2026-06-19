import os
import glob

search_dir = r'c:\Users\Prince\Downloads\NexusAi\nexusai\frontend\src'
replacements = {
    'dark:text-white': 'dark:text-[#F8F9FA]',
    '#0A0A0A': '#18181B',
    '#FF6B35': '#C5A059',
    '#f59e0b': '#D4AF37',
    '#4A4A4A': '#4B5563',
    '#8A8A8A': '#9CA3AF',
    'border-white': 'border-[#F8F9FA]',
    'dark:hover:text-white': 'dark:hover:text-[#F8F9FA]'
}

for root, _, files in os.walk(search_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            for old, new in replacements.items():
                content = content.replace(old, new)
                
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
print('Replacement complete.')
