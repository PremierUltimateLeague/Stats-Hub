rm(list = ls())

library(tidyverse)

possession.df <- read_csv("integ-data/Possessions.csv")
player.stats.df <- read_csv("integ-data/Player-Stats.csv")
defensive.blocks.df <- read_csv("integ-data/Defensive-Blocks.csv")
points.df <- read_csv("integ-data/Points.csv")
passes.df <- read_csv("integ-data/Passes.csv")

stat.priority <- read_csv("PUL Stats Hub Priority.csv")

################################################################################
# Team stats
stat.priority  |> filter(`Priority Tier` == "1 - Must Have", Type == "Team")
stat.priority  |> filter(`Priority Tier` == "2 - Nice To Have", Type == "Team")

team.goal.stats <- points.df |>
  group_by(team) |>
  summarise(goals = sum(`Scored?`),
            break_goals = sum(`Scored?`[`Started on offense?` == 0]),
            defensive_blocks = sum(`Defensive blocks`),
            holds = sum(`Started on offense?`),
            clean_holds = sum(`Scored?` == 1 &
                                `Started on offense?` == 1 &
                                Turnovers == 0))
team.pass.stats <- passes.df |>
  group_by(team) |>
  summarise(attempts = n(),
            turnovers = sum(`Turnover?`),
            completed_passess = sum(`Turnover?` == 0),
            completion_rate = (completed_passess/attempts),
            hucks = sum(`Huck?`))

team.stats <- inner_join(team.goal.stats, team.pass.stats)
team.stats

################################################################################
# Individual stats
stat.priority  |> filter(`Priority Tier` == "1 - Must Have", Type == "Individual")

player.stats <- player.stats.df |>
  group_by(team, Player) |>
  summarise(assists = sum(Assists),
            secondary_assists = sum(`Secondary assists`),
            goals = sum(Goals),
            turnovers = sum(Turnovers),
            defensive_blocks = sum(`Defensive blocks`),
            total_throw_gain = sum(`Total completed throw gain (m)`),
            total_catch_gain = sum(`Total caught pass gain (m)`),
            .groups = "drop")

