This repository turns the 2024 Game Day Info folder into a dashboard of statistics.

* The dashboard is docs/PUL-stats-hub.html
* It is constructed by docs/PUL-stats-hub.qmd

# Workflow

1. Download the entire 2024 Game Day Info google drive as a zipped archive, unzip it into this folder, replacing the existing contents. A future improvement would be to include **only** the stats files themselves. The file is listed in .gitignore, so it doesn't appear in the shared repository on GitHub.
2. Run processing-scripts/integrate-raw-game-data.R This script identifies the individual stats files for each match within the Game Day Info folder. It identifies the teams involved, location, and week from the names of the file and its path. It outputs the files in the integ-data/ directory.
3. Run processing-scripts/calculate-stats.R. This script uses the files in the integ-data/ directory to create team and player statistics (per game and seasonally). These files are saved to the stats/ directory.
4. Render docs/PUL-stats-hub.qmd to create the dashboard. Do this by clicking "Render" in the RStudio IDE or by running `quarto::render("docs/PUL-stats-hub.qmd")`.
5. **Publish the dashboard:** run this line in the terminal: `quarto publish gh-pages docs/PUL-stats-hub.qmd` Enter "Y" when prompted to respond "Y/N".

# Needed Improvements

Right now, the metadata for each match is retrieved from the file structure within the 2024 Game Day Info folder. In the future, this could be improved upon. The title of each file could include the team it refers to, the opponent, the match location, and the match week or date. Then, the repository would only need access to these specific files, not everything else.

If the stats files were saved in a single, standardized folder, then we could set up a Github action that would automatically perform steps 2-4 of the above workflow each time someone pushed a new stats file to the repository.

Finally, a good publication method might be to publish the quarto-generated dashboard using Github Pages. This would require the administrator of the PUL Github account to set this up.