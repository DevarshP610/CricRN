import os

def patch_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched {filepath}")

# 1. Patch EventEmitter.js
ee_path = r"mobile/node_modules/react-native/Libraries/vendor/emitter/EventEmitter.js"
if os.path.exists(ee_path):
    patch_file(ee_path, [("#registry", "_registry")])

# 2. Patch DebuggingOverlayRegistry.js
db_path = r"mobile/node_modules/react-native/Libraries/Debugging/DebuggingOverlayRegistry.js"
if os.path.exists(db_path):
    patch_file(db_path, [("#drawables", "_drawables"), ("#nextElementId", "_nextElementId")])

# 3. Patch EventTarget.js if it has private properties
et_path = r"mobile/node_modules/react-native/Libraries/vendor/emitter/EventTarget.js"
if os.path.exists(et_path):
    patch_file(et_path, [("#listeners", "_listeners")])

print("Patching complete!")
