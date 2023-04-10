# Clone other Mazed repos alongside truthsayer so they are all at the same
# folder level, e.g.
# \--mydir
#       \-- truthsayer
#       \-- smuggler
#       \-- something-else
SMUGGLER_URL=https://github.com/mazed-dev/smuggler.git
SMUGGLER_FOLDER=/workspaces/smuggler

if ! git clone "${SMUGGLER_URL}" "${SMUGGLER_FOLDER}" 2>/dev/null && [ -d "${SMUGGLER_FOLDER}" ] ; then
    echo "Clone failed because the folder ${SMUGGLER_FOLDER} exists"
fi
