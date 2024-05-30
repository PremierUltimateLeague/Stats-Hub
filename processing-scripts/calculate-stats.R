rm(list = ls())

library(tidyverse)

possession.df <- read_csv("integ-data/Possessions.csv")

# this is per-game player statistics computed by Statto
player.stats.df <- read_csv("integ-data/Player-Stats.csv") |>
  # convert meters to yards
  mutate(across(.cols = contains("(m)"), .fn = ~.x * 1.094)) |>
  rename_with(.fn = \(x)sub("[(]m[)]","(yd)",x))

defensive.blocks.df <- read_csv("integ-data/Defensive-Blocks.csv")

points.df <- read_csv("integ-data/Points.csv")

# this is 1-row per pass
##  use it to calculate the OVERALL pass and reception average distance
passes.df <- read_csv("integ-data/Passes.csv") |>
  # convert meters to yards
  mutate(across(.cols = contains("(m)"), .fn = ~.x * 1.094)) |>
  rename_with(.fn = \(x)sub("[(]m[)]","(yd)",x))

stat.priority <- read_csv("PUL Stats Hub Priority.csv")

################################################################################
# Team stats
stat.priority  |> filter(`Priority Tier` == "1 - Must Have", Type == "Team")
stat.priority  |> filter(`Priority Tier` == "2 - Nice To Have", Type == "Team")

team.goal.stats.overall <- points.df |>
  group_by(team) |>
  summarise(goals = sum(`Scored?`),
            break_goals = sum(`Scored?`[`Started on offense?` == 0]),
            defensive_blocks = sum(`Defensive blocks`),
            holds = sum(`Started on offense?` == 1 & `Scored?` == 1),
            clean_holds = sum(`Scored?` == 1 &
                                `Started on offense?` == 1 &
                                Turnovers == 0))
team.pass.stats.overall <- passes.df |>
  group_by(team) |>
  summarise(pass_attempts = n(),
            turnovers = sum(`Turnover?`),
            completed_passess = sum(`Turnover?` == 0),
            completion_rate = (completed_passess/pass_attempts),
            hucks = sum(`Huck?`))

team.goal.stats.game <- points.df |>
  group_by(team, match, week) |>
  summarise(goals = sum(`Scored?`),
            break_goals = sum(`Scored?`[`Started on offense?` == 0]),
            defensive_blocks = sum(`Defensive blocks`),
            holds = sum(`Started on offense?` & `Scored?` == 1),
            clean_holds = sum(`Scored?` == 1 &
                                `Started on offense?` == 1 &
                                Turnovers == 0),
            .groups = "drop")
team.pass.stats.game <- passes.df |>
  group_by(team, match, week) |>
  summarise(pass_attempts = n(),
            turnovers = sum(`Turnover?`),
            completed_passess = sum(`Turnover?` == 0),
            completion_rate = (completed_passess/pass_attempts),
            hucks = sum(`Huck?`),
            .groups = "drop")

team.stats.overall <- inner_join(team.goal.stats.overall, team.pass.stats.overall)
team.stats.game <- inner_join(team.goal.stats.game, team.pass.stats.game)

################################################################################
# Individual stats
stat.priority  |> filter(`Priority Tier` == "1 - Must Have", Type == "Individual")
stat.priority  |> filter(`Priority Tier` == "2 - Nice To Have", Type == "Individual")


player.stats.game <- player.stats.df |>
  select(week, match, team, Player, Touches, Throws, Catches, `Defensive blocks`,
         Goals, Turnovers, `Total completed throw gain (yd)`, `Average completed throw gain (yd)`,
         `Total caught pass gain (yd)`, `Average caught pass gain (yd)`,
         `Offense points played`, `Defense points played`, `Possessions initiated`,
         `Thrower errors`, `Receiver errors`, Assists, `Secondary assists`)

overall.pass.dist <- passes.df |>
  filter(`Turnover?` == 0) |>
  group_by(team, Player = Thrower) |>
  summarise(`Average completed throw gain (yd)` = mean(`Forward distance (yd)`))

overall.receive.dist <- passes.df |>
  filter(`Turnover?` == 0) |>
  group_by(team, Player = Receiver) |>
  summarise(`Average caught pass gain (yd)` = mean(`Forward distance (yd)`))

player.stats.overall <- player.stats.game |>
  select(-contains("Average")) |> # remove averages which can't be summed
  # aggregate
  group_by(Player, team) |>
  summarise(across(.cols = where(is.numeric), .fn = sum),
            .groups = "drop") |>
  # add overall pass & reception averages
  left_join(overall.pass.dist) |>
  left_join(overall.receive.dist) |>
  select(team, Player, Touches, Throws, Catches, `Defensive blocks`,
         Goals, Turnovers, `Total completed throw gain (yd)`, `Average completed throw gain (yd)`,
         `Total caught pass gain (yd)`, `Average caught pass gain (yd)`,
         `Offense points played`, `Defense points played`, `Possessions initiated`,
         `Thrower errors`, `Receiver errors`, Assists, `Secondary assists`)


################################################################################
# save stats
write_csv(team.stats.overall, "stats/team-stats-overall.csv")
write_csv(team.stats.game, "stats/team-stats-game.csv")
write_csv(player.stats.overall, "stats/player-stats-overall.csv")
write_csv(player.stats.game, "stats/player-stats-game.csv")
