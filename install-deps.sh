#!/bin/bash
# Install Python packages only
# System packages (ffmpeg, python3) should be available on the platform
# On Render, Python is pre-installed and ffmpeg may be available
pip3 install yt-dlp spotdl || python3 -m pip install yt-dlp spotdl || pip install yt-dlp spotdl
