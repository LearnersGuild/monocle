const express = require('express')
const routes = new express.Router
const game = require('../../game')
const idm = require('../../idm')
const Stats = require('fast-stats').Stats
const _ = require('lodash')
var csv = require('csv')

let allProjects;

routes.get('/:goalNumber/stats', (request, response) => {
  const goalNumber = parseInt(request.params.goalNumber)
  game.projectsByGoalNumber(goalNumber, allProjects)
    .then(projects => {
      let validProjects = projects
                            .filter(p => p.stats && p.stats.projectCompleteness)
      let stats = computeProjectStats(validProjects)
      response.render('projects/stats', {stats, goal: validProjects[0].goal,
                                         totalCount: projects.length,
                                         validCount: validProjects.length})
    })
})

routes.get('/stats/csv', (request, response) => {
  let allGoalStats = computeAllGoalsStats(allProjects)
  let header = ["Goal Name", "Goal #", "Team Size", "Base XP",
                "Bonus XP", "Level", "# Completed", "Average",
                "Median", "75th Percentile", "Min", "Max"]
  const goalFields = ["title", "number", "teamSize", "baseXp", "bonusXp", "level"]
  const projectFields =  ["numberOfCompletedProjects", "average",
                          "median", "p75", "min", "max"]
  const goalStats = Object.values(allGoalStats)

  let csvRows = goalStats.reduce((acc, goalStat) => {
    const goal = goalStat.goal
    let goalFieldData = goalFields.map(field => goal[field])
    let projectFieldData = projectFields.map(field => goalStat[field])
    acc.push(goalFieldData.concat(projectFieldData))
    return acc
  }, [header])

  csv.stringify(csvRows, (err, csv) => {
    if (err) {
      response.status(500).send(`Error: ${err.message}`)
    }
    response.set('Content-Type', 'application/octet-status')
    response.send(csv)
  })
});

routes.get('/refresh-cache', (request, response) => {
  loadProjects().then(
    () => response.json({message: 'Successfully refreshed projects cached'})
  );
})

const loadProjects = () => {
  return game.projects().then(projects => allProjects = projects)
}

const computeProjectStats = (projects) => {
  const completeness = projects
                        .map(p => p.stats.projectCompleteness)
  const s = new Stats().push(completeness)
  return {median: s.median().toFixed(2),
          p75: s.percentile(75).toFixed(2),
          average: s.amean().toFixed(2),
          min: Math.min.apply(null, completeness).toFixed(2),
          max: Math.max.apply(null, completeness).toFixed(2),
          goal: projects[0].goal,
          numberOfCompletedProjects: projects.length}
}

const computeAllGoalsStats = (projects) => {
  var goalNumberToProjects = projects.reduce(function(acc, project) {
    const goalNumber = project.goal.number
    if(!project.stats || !project.stats.projectCompleteness) {
      return acc
    }
    else if(acc[goalNumber]) {
      acc[goalNumber].push(project)
    } else {
      acc[goalNumber] = [project]
    }
    return acc
  }, {})

  return _.mapValues(goalNumberToProjects, function(projects) {
    return computeProjectStats(projects)
  })
}

const createAllGoalsStatsCsv = (goalNumberToStats) => {
}


// Note by Punit 2017-05-15:
// Using an in-memory list of projects for faster load times
loadProjects()

module.exports = routes
