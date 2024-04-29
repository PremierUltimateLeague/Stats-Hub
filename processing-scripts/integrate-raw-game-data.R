rm(list = ls())

library(tidyverse)

# list all the CSV files in the raw game stats directory
all.files <- list.files("raw-game-data/", pattern = ".csv",
                        full.names = T, recursive = T)

# this function reads a given path
#   it adds match info to the file
read_stat <- function(path){
  path
  match = str_extract(path, "(?<before>\\w+) @ (?<after>\\w+)") # teams
  match.date = str_remove(word(path, -1), ".csv") # date
  team = word(path, -2, sep = "/") # this team these stats apply to
  opponent = str_remove_all(match, paste(team, "@", " ", sep = "|"))
  
  read_csv(path, col_types = cols(.default = "c")) |>
    mutate(match = match,
           date = match.date,
           team = team,
           opponent = opponent) |>
    select(match, date, team, opponent, everything())
}


# here are the 5 kinds of tables
possession.df <- map_df(.x = all.files[which(str_detect(all.files, "Possession"))],
                        .f = read_stat)
player.stats.df <- map_df(.x = all.files[which(str_detect(all.files, "Player Stats vs"))],
                        .f = read_stat)
defensive.blocks.df <- map_df(.x = all.files[which(str_detect(all.files, "Defensive Blocks"))],
                          .f = read_stat)
points.df <- map_df(.x = all.files[which(str_detect(all.files, "Points vs"))],
                          .f = read_stat)
passes.df <- map_df(.x = all.files[which(str_detect(all.files, "Passes vs"))],
                    .f = read_stat)

# save to the integ-data folder
write_csv(possession.df, "integ-data/Possessions.csv")
write_csv(player.stats.df, "integ-data/Player-Stats.csv")
write_csv(defensive.blocks.df, "integ-data/Defensive-Blocks.csv")
write_csv(points.df, "integ-data/Points.csv")
write_csv(passes.df, "integ-data/Passes.csv")
