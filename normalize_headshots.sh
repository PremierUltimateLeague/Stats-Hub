#!/bin/bash
# Normalize headshot filenames to LastNameNumber.ext format
# Coaches become LastNameCoach.ext
# Run from project root: bash normalize_headshots.sh [--execute] [--year 2023|2026|all]

PLAYERS_DIR="public/images/players"
DRY_RUN=true
TARGET_YEAR="all"

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --execute) DRY_RUN=false; shift ;;
    --year) TARGET_YEAR="$2"; shift 2 ;;
    *) shift ;;
  esac
done

if [ "$DRY_RUN" = true ]; then
  echo "🔍 DRY RUN - preview only. Use --execute to rename."
else
  echo "🔥 EXECUTING renames..."
fi
echo "📅 Target year(s): $TARGET_YEAR"
echo ""

rename_count=0
skip_count=0
coach_count=0

# Title-case a name, handling hyphens (e.g. "BEDOYA-ROSS" -> "Bedoya-Ross")
title_case_name() {
  local input="$1"
  local result=""
  IFS='-' read -ra PARTS <<< "$input"
  for i in "${!PARTS[@]}"; do
    local part="${PARTS[$i]}"
    part=$(echo "$part" | xargs)
    part="$(echo "${part:0:1}" | tr '[:lower:]' '[:upper:]')$(echo "${part:1}" | tr '[:upper:]' '[:lower:]')"
    if [ $i -gt 0 ]; then
      result="${result}-${part}"
    else
      result="$part"
    fi
  done
  echo "$result"
}

process_2026_file() {
  local file="$1"
  local dir
  dir=$(dirname "$file")
  local basename
  basename=$(basename "$file")
  local ext="${basename##*.}"
  local ext_lower
  ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

  if [[ "$ext_lower" != "jpg" && "$ext_lower" != "jpeg" && "$ext_lower" != "png" ]]; then
    return
  fi

  local name="${basename%.*}"

  # Check if it's a coach: contains "coach" or has no number
  local is_coach=false
  if echo "$name" | grep -qi "coach"; then
    is_coach=true
  fi

  # Extract trailing number and last name
  # Format: "LastNameNumber" or "lastnameNumber" or "LastName" (coach)
  local number=""
  local last_name=""

  number=$(echo "$name" | grep -oP '\d+$')
  last_name=$(echo "$name" | sed -E 's/[0-9]+$//' | sed -E 's/[Cc]oach//gi')

  if [ -z "$number" ] && [ "$is_coach" = false ]; then
    is_coach=true
  fi

  # Clean and title-case
  last_name=$(echo "$last_name" | sed 's/[^a-zA-Z-]//g')

  if [ -z "$last_name" ]; then
    echo "  ⚠️  Could not parse: $basename"
    ((skip_count++))
    return
  fi

  local last_name_clean
  last_name_clean=$(title_case_name "$last_name")

  local new_name=""
  if [ "$is_coach" = true ]; then
    new_name="${last_name_clean}Coach.${ext_lower}"
    echo -n "  🏫 "
    ((coach_count++))
  else
    new_name="${last_name_clean}${number}.${ext_lower}"
    echo -n "  "
  fi

  if [ "$basename" == "$new_name" ]; then
    return
  fi

  local new_path="${dir}/${new_name}"

  if [ "$DRY_RUN" = true ]; then
    echo "📝 $basename → $new_name"
  else
    if [ -f "$new_path" ]; then
      echo "⚠️  CONFLICT: $new_name already exists, skipping $basename"
      ((skip_count++))
      return
    fi
    mv "$file" "$new_path"
    echo "✅ $basename → $new_name"
  fi
  ((rename_count++))
}

process_2023_file() {
  local file="$1"
  local team="$2"
  local dir
  dir=$(dirname "$file")
  local basename
  basename=$(basename "$file")
  local ext="${basename##*.}"
  local ext_lower
  ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

  if [[ "$ext_lower" != "jpg" && "$ext_lower" != "jpeg" && "$ext_lower" != "png" ]]; then
    return
  fi

  local name="${basename%.*}"

  # Detect coaches: contains COACH or no number
  local is_coach=false
  if echo "$name" | grep -qi "coach"; then
    is_coach=true
  fi

  local number=""
  local last_name=""

  case "$team" in
    "Atlanta"|"Minnesota"|"Portland"|"Raleigh"|"Austin")
      # Format: "Number LastName, FirstName"
      number=$(echo "$name" | grep -oP '^\d+')
      last_name=$(echo "$name" | sed -E 's/^[0-9]+\s+//' | sed -E 's/,.*$//' | xargs)
      ;;
    "Columbus")
      # Format: "Number LASTNAME FIRSTNAME"
      number=$(echo "$name" | grep -oP '^\d+')
      last_name=$(echo "$name" | sed -E 's/^[0-9]+\s+//' | awk '{print $1}')
      ;;
    "DC")
      # Format: "Number - LastName, FirstName"
      number=$(echo "$name" | grep -oP '^\d+')
      last_name=$(echo "$name" | sed -E 's/^[0-9]+\s*-\s*//' | sed -E 's/,.*$//' | xargs)
      ;;
    "Indy")
      # Format: "#Number LASTNAME, FirstName" or with _Nickname_
      number=$(echo "$name" | grep -oP '(?<=#)\d+')
      last_name=$(echo "$name" | sed -E 's/^#[0-9]+\s+//' | sed -E 's/,.*$//' | xargs)
      ;;
    "Milwaukee")
      # Format: "Number _ LASTNAME _ FIRSTNAME" or "COACH _ LASTNAME _ FIRSTNAME"
      if [ "$is_coach" = true ]; then
        last_name=$(echo "$name" | sed -E 's/.*COACH\s*_\s*//' | sed -E 's/\s*_.*$//' | xargs)
      else
        number=$(echo "$name" | grep -oP '^\d+')
        last_name=$(echo "$name" | sed -E 's/^[0-9]+\s*_\s*//' | sed -E 's/\s*_.*$//' | xargs)
      fi
      ;;
    "Nashville")
      # Format: "Number_LastName_Firstname"
      number=$(echo "$name" | grep -oP '^\d+')
      last_name=$(echo "$name" | sed -E 's/^[0-9]+_//' | sed -E 's/_.*$//' | xargs)
      ;;
    "New York City")
      # Format: "#Number-LastName, FirstName"
      number=$(echo "$name" | grep -oP '(?<=#)\d+')
      last_name=$(echo "$name" | sed -E 's/^#[0-9]+-//' | sed -E 's/,.*$//' | xargs)
      ;;
    "Philadelphia")
      # Format: "Number _ LastName _ FirstName"
      number=$(echo "$name" | grep -oP '^\d+')
      last_name=$(echo "$name" | sed -E 's/^[0-9]+\s*_\s*//' | sed -E 's/\s*_.*$//' | xargs)
      ;;
    *)
      echo "  ⚠️  Unknown team: $team - skipping $basename"
      return
      ;;
  esac

  # No number and not already flagged = coach
  if [ -z "$number" ] && [ "$is_coach" = false ]; then
    is_coach=true
  fi

  # Strip "COACH" from last name if present
  last_name=$(echo "$last_name" | sed -E 's/[Cc][Oo][Aa][Cc][Hh]//g' | xargs)

  if [ -z "$last_name" ]; then
    echo "  ⚠️  Could not parse: $basename"
    ((skip_count++))
    return
  fi

  local last_name_clean
  last_name_clean=$(title_case_name "$last_name")
  last_name_clean=$(echo "$last_name_clean" | sed 's/[^a-zA-Z-]//g')

  local new_name=""
  if [ "$is_coach" = true ]; then
    new_name="${last_name_clean}Coach.${ext_lower}"
    echo -n "  🏫 "
    ((coach_count++))
  else
    new_name="${last_name_clean}${number}.${ext_lower}"
    echo -n "  "
  fi

  if [ "$basename" == "$new_name" ]; then
    return
  fi

  local new_path="${dir}/${new_name}"

  if [ "$DRY_RUN" = true ]; then
    echo "📝 $basename → $new_name"
  else
    if [ -f "$new_path" ]; then
      echo "⚠️  CONFLICT: $new_name already exists, skipping $basename"
      ((skip_count++))
      return
    fi
    mv "$file" "$new_path"
    echo "✅ $basename → $new_name"
  fi
  ((rename_count++))
}

# Process each team folder
for team_dir in "$PLAYERS_DIR"/*/; do
  team=$(basename "$team_dir")
  echo "📁 $team"

  # Process 2023
  if [[ "$TARGET_YEAR" == "2023" || "$TARGET_YEAR" == "all" ]]; then
    if [ -d "$team_dir/2023" ]; then
      echo "  📅 2023"
      for file in "$team_dir"2023/*; do
        [ -f "$file" ] && process_2023_file "$file" "$team"
      done
    fi
  fi

  # Process 2026
  if [[ "$TARGET_YEAR" == "2026" || "$TARGET_YEAR" == "all" ]]; then
    if [ -d "$team_dir/2026" ]; then
      echo "  📅 2026"
      for file in "$team_dir"2026/*; do
        [ -f "$file" ] && process_2026_file "$file"
      done
    fi
  fi

  echo ""
done

echo "================================"
if [ "$DRY_RUN" = true ]; then
  echo "DRY RUN COMPLETE"
  echo "Would rename: $rename_count files"
else
  echo "RENAME COMPLETE"
  echo "Renamed: $rename_count files"
fi
echo "Coaches: $coach_count files"
echo "Skipped/errors: $skip_count files"
echo "================================"
echo ""
if [ "$DRY_RUN" = true ]; then
  echo "Run with --execute to apply changes:"
  echo "  bash normalize_headshots.sh --execute"
  echo ""
  echo "Options:"
  echo "  --year 2023    Only process 2023"
  echo "  --year 2026    Only process 2026"
  echo "  --year all     Process both (default)"
fi