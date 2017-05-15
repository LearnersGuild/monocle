const express = require('express')
const routes = new express.Router
const game = require('../../game')
const idm = require('../../idm')
const Stats = require('fast-stats').Stats;

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
          max: Math.max.apply(null, completeness).toFixed(2)}
}

// Note by Punit 2017-05-15:
// Using an in-memory list of projects for faster load times
loadProjects()

module.exports = routes
