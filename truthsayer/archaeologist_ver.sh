# Extracts archaeologist version out of manifest.json and prints it to stdout
grep \"version\" ../archaeologist/public/manifest.json | tr -d '\n' |  sed -E 's/"version": "([.0-9]*).*/\1/g'
