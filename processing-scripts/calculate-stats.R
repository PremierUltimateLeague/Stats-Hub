rm(list = ls())

library(tidyverse)

possession.df <- read_csv("integ-data/Possessions.csv")
player.stats.df <- read_csv("integ-data/Player-Stats.csv")
defensive.blocks.df <- read_csv("integ-data/Defensive-Blocks.csv")
points.df <- read_csv("integ-data/Points.csv")
passes.df <- read_csv("integ-data/Passes.csv")

stat.priority <- read_csv("PUL Stats Hub Priority.csv")

################################################################################
# PUL field dimensions are different than those assumed by the STATTO app,
#   so we rescale them here
# PUL field dimensions are 40 yards wide by 120 yards long (including 20-yard endzones)




################################################################################
# Team stats
stat.priority  |> filter(`Priority Tier` == "1 - Must Have", Type == "Team")
stat.priority  |> filter(`Priority Tier` == "2 - Nice To Have", Type == "Team")

team.goal.stats.overall <- points.df |>
  group_by(team) |>
  summarise(goals = sum(`Scored?`),
            break_goals = sum(`Scored?`[`Started on offense?` == 0]),
            defensive_blocks = sum(`Defensive blocks`),
            holds = sum(`Started on offense?`),
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
            holds = sum(`Started on offense?`),
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

player.stats.overall <- player.stats.df |>
  group_by(team, Player) |>
  summarise(assists = sum(Assists),
            secondary_assists = sum(`Secondary assists`),
            goals = sum(Goals),
            turnovers = sum(Turnovers),
            defensive_blocks = sum(`Defensive blocks`),
            total_throw_gain = sum(`Total completed throw gain (m)`),
            total_catch_gain = sum(`Total caught pass gain (m)`),
            offensive_points_played = sum(`Offense points played`),
            defensive_points_played = sum(`Defense points played`),
            touches = sum(Touches),
            throws = sum(Throws),
            possessions_initiated = sum(`Possessions initiated`),
            thrower_errors = sum(`Thrower errors`),
            receiver_errors = sum(`Receiver errors`),
            avg_completed_throw_gain = mean(`Average completed throw gain (m)`),
            avg_caught_pass_gain = mean(`Average caught pass gain (m)`),
            .groups = "drop")

player.stats.game <- player.stats.df |>
  group_by(team, Player, match, week) |>
  # # 07 Kami Groom (DC) has duplicate rows in NASH @ DC Week 2
  slice_max(`Points played total`, n = 1, with_ties = F) |>
  summarise(assists = sum(Assists),
            secondary_assists = sum(`Secondary assists`),
            goals = sum(Goals),
            turnovers = sum(Turnovers),
            defensive_blocks = sum(`Defensive blocks`),
            total_throw_gain = sum(`Total completed throw gain (m)`),
            total_catch_gain = sum(`Total caught pass gain (m)`),
            offensive_points_played = sum(`Offense points played`),
            defensive_points_played = sum(`Defense points played`),
            touches = sum(Touches),
            throws = sum(Throws),
            possessions_initiated = sum(`Possessions initiated`),
            thrower_errors = sum(`Thrower errors`),
            receiver_errors = sum(`Receiver errors`),
            avg_completed_throw_gain = mean(`Average completed throw gain (m)`),
            avg_caught_pass_gain = mean(`Average caught pass gain (m)`),
            .groups = "drop")

################################################################################
# save stats
write_csv(team.stats.overall, "stats/team-stats-overall.csv")
write_csv(team.stats.game, "stats/team-stats-game.csv")
write_csv(player.stats.overall, "stats/player-stats-overall.csv")
write_csv(player.stats.game, "stats/player-stats-game.csv")
