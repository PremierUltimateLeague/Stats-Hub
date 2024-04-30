rm(list = ls())

library(tidyverse)

################################################################################
# This script extracts the raw statistics files and integrates them
#   It also creates a file summarizing game coverage.

################################################################################
# Step 1: list all the CSV files in the raw game stats directory
#   I download this entire folder through the web interface to google drive
all.files <- list.files("2024 Game Day Info/", pattern = ".csv",
                        full.names = T, recursive = T)

# this function reads a given path
#   it adds match info to the file
read_stat <- function(path){
  path
  match = str_extract(path, "(?<before>\\w+) @ (?<after>\\w+)") # teams
  # this regex could be improved
  match.week <- str_extract(path, "2024 Game Day Info//(.*?)_") |> str_remove("2024 Game Day Info//") |> str_remove("_")
  team = word(path, -2, sep = "/") # this team these stats apply to
  opponent = str_remove_all(match, paste(team, "@", " ", sep = "|"))
  
  read_csv(path, col_types = cols(.default = "c")) |>
    mutate(match = match,
           week = match.week,
           team = team,
           opponent = opponent) |>
    select(match, week, team, opponent, everything())
}

################################################################################
# Step 2: extract each statistic type
possession.df <- map_df(.x = all.files[which(str_detect(all.files, "Possession"))],
                        .f = read_stat)
player.stats.df <- map_df(.x = all.files[which(str_detect(all.files, "Player Stats vs"))],
                        .f = read_stat)
defensive.blocks.df <- map_df(.x = all.files[which(str_detect(all.files, "Defensive Blocks|Defensive_Blocks"))],
                          .f = read_stat)
points.df <- map_df(.x = all.files[which(str_detect(all.files, "Points vs"))],
                          .f = read_stat)
passes.df <- map_df(.x = all.files[which(str_detect(all.files, "Passes vs"))],
                    .f = read_stat)

################################################################################
# Step 3: # save to the integ-data folder
write_csv(possession.df, "integ-data/Possessions.csv")
write_csv(player.stats.df, "integ-data/Player-Stats.csv")
write_csv(defensive.blocks.df, "integ-data/Defensive-Blocks.csv")
write_csv(points.df, "integ-data/Points.csv")
write_csv(passes.df, "integ-data/Passes.csv")

################################################################################
# Step 4: Check for data coverage

# Is each coverage element available?
data.element.coverage <- possession.df |> group_by(match, week, team) |> summarise(possessions = T, .groups = "drop") |>
  full_join(player.stats.df |> group_by(match, week, team) |> summarise(player_stats = T, .groups = "drop")) |>
  full_join(defensive.blocks.df |> group_by(match, week, team) |> summarise(defensive_blocks = T, .groups = "drop")) |>
  full_join(points.df |> group_by(match, week, team) |> summarise(points = T, .groups = "drop")) |>
  full_join(passes.df |> group_by(match, week, team) |> summarise(passes = T, .groups = "drop")) |>
  mutate(home_away = if_else(team == word(match, 1), "away", "home"),
         # convert NAs to FALSE (designating missing data)
         across(.cols = where(is.logical), .fns = ~ifelse(is.na(.x), FALSE, TRUE))) |>
  select(match, week, home_away, team, everything())

# which teams play each game?
teams.per.match <- data.element.coverage |>
  select(match, week) |>
  separate(match, into = c("away","home"), sep = " @ ", remove = F) |>
  pivot_longer(cols = c(away, home), names_to = "home_away", values_to = "team") |>
  group_by_all() |>
  summarise(.groups = "drop")

# is each team accounted for?
game.coverage <- data.element.coverage |>
  full_join(teams.per.match) |>
  # convert NAs to FALSE (designating missing data)
  mutate(across(.cols = where(is.logical), .fns = ~ifelse(is.na(.x), FALSE, TRUE))) |>
  arrange(week, match, home_away)

write_csv(game.coverage, "stats/game-coverage.csv")
