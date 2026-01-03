#!/bin/bash
# Install Python packages only
# System packages (ffmpeg, python3) should be available on the platform
# On Render, Python is pre-installed and ffmpeg may be available
pip3 install --user yt-dlp spotdl || python3 -m pip install --user yt-dlp spotdl || pip install --user yt-dlp spotdl
