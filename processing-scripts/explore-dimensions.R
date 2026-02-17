rm(list = ls())

library(tidyverse)

passes.df <- read_csv("integ-data/Passes.csv")

passes <- passes.df |> 
  select(match, week, team, Point, Possession, `Turnover?`, `Throw to endzone?`, `Swing?`,
         `Dump?`,
         start_x = `Start X (0 -> 1 = left sideline -> right sideline)`,
         start_y = `Start Y (0 -> 1 = back of opponent endzone -> back of own endzone)`,
         end_x = `End X (0 -> 1 = left sideline -> right sideline)`,
         end_y = `End Y (0 -> 1 = back of opponent endzone -> back of own endzone)`)

passes |>
  filter(match == "ATL @ ATX",
         week == "Week 1") |>
  filter(Point == 1,
         Possession == 2) |>
  ggplot() +
  geom_segment(aes(x = start_x, y = start_y, xend = end_x, yend = end_y,
                   color = team, ), arrow = arrow(length = unit(0.03, "npc")))

passes |>
  filter(match == "MKE @ NY",
         week == "Week 2") |>
  filter(Point == 4,
         Possession == 2) |>
  ggplot() +
  geom_segment(aes(x = start_x, y = start_y, xend = end_x, yend = end_y,
                   color = team, ), arrow = arrow(length = unit(0.03, "npc")))


passes |>
  filter(match == "MKE @ NY",
         week == "Week 2",
         Point == 1) |>
  arrange(Possession) |>
  print(n = 28)

passes |>
  filter(`Throw to endzone?` == 1,
         `Turnover?` == 0) |>
  ggplot() +
  geom_segment(aes(x = start_x, y = start_y, xend = end_x, yend = end_y,
                   color = team, ), arrow = arrow(length = unit(0.03, "npc")))
passes |>
  filter(`Swing?` == 1) |>
  ggplot() +
  geom_segment(aes(x = start_x, y = start_y, xend = end_x, yend = end_y,
                   color = team, ), arrow = arrow(length = unit(0.03, "npc")))

possessions.leading.to.goal <- passes.df |>
  group_by(match, week, team, Point, Possession) |>
  summarise(passes = n(),
            turnovers = sum(`Turnover?`),
            pass_to_endzone = sum(`Throw to endzone?`),
            .groups = "drop") |>
  filter(turnovers == 0,
         pass_to_endzone == 1)

max.passes <- possessions.leading.to.goal |> slice_max(passes, n = 1, with_ties = F)

passes |>
  inner_join(max.passes) |>
  ggplot() +
  geom_segment(aes(x = start_x, y = start_y, xend = end_x, yend = end_y),
               arrow = arrow(length = unit(0.01, "npc")))

# PUL field dimensions are 40 yards wide by 120 yards long (including 20-yard endzones)
passes.df |>
  mutate(x_yd = abs((`End X (0 -> 1 = left sideline -> right sideline)`*40) -
                      (`Start X (0 -> 1 = left sideline -> right sideline)`*40)),
         y_yd = (`Start Y (0 -> 1 = back of opponent endzone -> back of own endzone)`*120) -
           (`End Y (0 -> 1 = back of opponent endzone -> back of own endzone)`*120),
         # diagonal pass distance (the hypotenuse of a triangle where x & y form a right angle)
         z_yd = sqrt(x_yd^2 + y_yd^2))

