#!/bin/bash

# Switches between package.build.json and package.publish.json -> package.json
# Uses symbolic links to point package.json to the desired config

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

usage() {
    echo "Usage: $0 [build|publish]"
    echo "  build   - Switch to package.build.json"
    echo "  publish - Switch to package.publish.json"
    echo "  (no arg) - Toggle between configs"
    exit 1
}

switch_to() {
    local target="$1"
    local target_file="package.${target}.json"

    if [ ! -f "$target_file" ]; then
        echo "Error: $target_file does not exist"
        exit 1
    fi

    # Remove existing package.json (symlink or file)
    rm -f package.json

    # Create symlink
    ln -s "$target_file" package.json
    echo "Switched to $target config ($target_file -> package.json)"
}

get_current() {
    if [ -L "package.json" ]; then
        local target=$(readlink package.json)
        if [ "$target" = "package.build.json" ]; then
            echo "build"
        elif [ "$target" = "package.publish.json" ]; then
            echo "publish"
        else
            echo "unknown"
        fi
    else
        echo "none"
    fi
}

if [ $# -eq 0 ]; then
    # Toggle mode
    current=$(get_current)
    if [ "$current" = "build" ]; then
        switch_to "publish"
    elif [ "$current" = "publish" ]; then
        switch_to "build"
    else
        # Default to build if no symlink exists
        switch_to "build"
    fi
elif [ "$1" = "build" ] || [ "$1" = "publish" ]; then
    current=$(get_current)
    if [ "$current" = "$1" ]; then
        echo "Already using $1 config"
    else
        switch_to "$1"
    fi
else
    usage
fi
