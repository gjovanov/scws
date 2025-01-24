#!/bin/bash

echo $1
cd $1

echo "$2.$3"
unzip "$2.$3" -d $4
echo $4
cd $4

pkg=$(jq -r '.package_name' manifest.json)
echo "PKG=$pkg"

if [[ -z "$5" ]]; then
  adb install-multiple *.apk
else
  adb $5 install-multiple *.apk
fi

if [ ! -d "Android/obb/$pkg" ]; then
  echo "Android/obb/$pkg doesn't exist."
fi
if [ -d "Android/obb/$pkg" ]; then
  echo "Android/obb/$pkg exists. Creating obb directory and pushing obb ..."
  if [[ -z "$5" ]]; then
    adb shell mkdir -p /sdcard/Android/obb/$pkg
  else
    adb $5 shell mkdir -p /sdcard/Android/obb/$pkg
  fi
  # if [[ -z "$5" ]]; then
  #   adb push Android/obb/$pkg /sdcard/Android/obb/$pkg
  # else
  #   adb $5 push Android/obb/$pkg /sdcard/Android/obb/$pkg
  # fi
  expansions=$(jq -r '.expansions[].file | gsub("[\\n]"; "")' manifest.json)
  echo "EXPANSIONS=$expansions"
  echo "For each expansion:"
  for item in $expansions; do
    echo "Pusing obb: $item"
    if [[ -z "$5" ]]; then
      adb push -p $item /sdcard/Android/obb/$pkg/
    else
      adb $5 push -p $item /sdcard/Android/obb/$pkg/
    fi
  done
fi

cd ..
rm -rf $4
