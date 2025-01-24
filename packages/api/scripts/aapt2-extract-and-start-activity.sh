#!/bin/bash

pkg=$(aapt2 dump badging $1|awk -F" " '/package/ {print $2}'|awk -F"'" '/name=/ {print $2}')
echo $pkg
act=$(aapt2 dump badging $1|awk -F" " '/launchable-activity/ {print $2}'|awk -F"'" '/name=/ {print $2}')
echo $act
if [[ -z "$2" ]] ; then
    adb shell am start-activity --user 0 -n $pkg/$act
else
    adb $2 shell am start-activity --user 0 -n $pkg/$act
fi