import os
import re

def resolve_keep_both():
    src_dir = "./src"
    app_dir = "./src/app"
    
    conflict_pattern = re.compile(r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> [a-f0-9]+', re.DOTALL)
    
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if not file.endswith(('.ts', '.tsx', '.css')):
                continue
                
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if '<<<<<<< HEAD' in content:
                print(f"Resolving conflicts in {filepath}")
                # Keep both contents
                new_content = conflict_pattern.sub(r'\1\n\2', content)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)

if __name__ == "__main__":
    resolve_keep_both()
