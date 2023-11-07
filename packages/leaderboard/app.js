const templateScores = Array.from({ length: 10 }, (value, index) => ({ position: index + 1, name: '---', score: '---'}));

document.addEventListener('DOMContentLoaded', function () {
  var topPlayersList = document.querySelector('#top-players ol');
  var recentPlayersList = document.querySelector('#recent-players ol');

  var fetchScores = async function (url) {
    var response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  };

  var displayScores = function (scores, listElement) {
    let resultArray = scores;

    if (scores.length < 10) {
      const emptyStrings = templateScores.slice(scores.length);
      resultArray = scores.concat(emptyStrings);
    }

    listElement.innerHTML = '';
    resultArray.forEach(function (score) {
      var listItem = document.createElement('li');
      listItem.innerHTML = `<span>${score.position} ${score.name}</span><span>${score.score}</span>`;
      listElement.appendChild(listItem);
    });
  };

  var loadScores = function () {
    fetchScores('http://localhost:3000/api?type=top')
      .then(function (scores) {
        displayScores(scores, topPlayersList);
      })
      .catch(function (error) {
        console.error('Failed to load top players:', error);
      });

    fetchScores('http://localhost:3000/api?type=recent')
      .then(function (scores) {
        displayScores(scores, recentPlayersList);
      })
      .catch(function (error) {
        console.error('Failed to load recent players:', error);
      });
  };

  loadScores();

  setInterval(loadScores, 5000);
});
