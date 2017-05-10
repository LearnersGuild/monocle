;[
  ['.prev-cycle-link', -1],
  ['.next-cycle-link', +1],
].forEach(([classname, delta]) => {
  document.querySelector(classname).addEventListener('click', event => {
    event.preventDefault()
    location = location.toString()
      .replace(/\/cycles\/(\d+)/, (_, cycle) => `/cycles/${Number(cycle)+delta}`)
  })
});
