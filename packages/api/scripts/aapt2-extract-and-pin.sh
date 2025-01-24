#!/bin/bash

pkg=$(aapt2 dump badging $1|awk -F" " '/package/ {print $2}'|awk -F"'" '/name=/ {print $2}')|sed "s|\.|\\\.|g"
echo $pkg
act=$(aapt2 dump badging $1|awk -F" " '/launchable-activity/ {print $2}'|awk -F"'" '/name=/ {print $2}')
echo $act
if [[ -z "$2" ]] ; then
    adb shell am task lock $(adb shell dumpsys activity recents | grep "Recent #.*$pkg" | cut -d '#' -f 3 | cut -d ' ' -f 1)
else
    adb $2 shell am task lock $(adb $2 shell dumpsys activity recents | grep "Recent #.*$pkg" | cut -d '#' -f 3 | cut -d ' ' -f 1)
fi