const express = require('express');
const GameServices = require('./game-services');

const GameRouter = express.Router();
const BodyParser = express.json();
const gameHelpers = require('./game-helpers');

GameRouter
  .use(BodyParser);

GameRouter
  .route('/join')
  .post(async (req, res, next) => {
    try{
      const { playerId, username } = req.body;
      console.log('playerId: ', playerId);
      console.log('username: ', username);

      const allGames = await GameServices.getAllGames(req.app.get('db'));
      console.log(allGames);
      //  If a game exists with less than 4 players, add player to that game
      //  and return the game id
      for (let game of allGames) {
        let gamePlayers = await GameServices.getPlayers(req.app.get('db'), game.id);
        const numPlayers = gamePlayers.length;
        const playerIds = gamePlayers.map(player => player.player_id);

        if (numPlayers < 6 && !playerIds.includes(playerId))  {
          await GameServices.addGamePlayer(req.app.get('db'), game.id, playerId, username);
          console.log('join existing: ', game.id);
          res.send([ game.id ]);
          return;
        }

        if (playerIds.includes(playerId)) {
          res.status(400).json({
            error: 'You are already in a game'
          });
        }
      } 
      //  If there are no games with available seats, create a new game and 
      //  return its id
      let newGame = await GameServices.createGame(req.app.get('db'));
      console.log('join new: ', newGame[0].id);
      await GameServices.addGamePlayer(req.app.get('db'), newGame[0].id, playerId, username);
      res.send([newGame[0].id]);
    } catch(error) {
      next(error);
    }
  });

GameRouter
  .route('/test')
  .post(BodyParser, async (req, res, next) => {
    try {
      const a = await gameHelpers.checkForWinner(req.app.get('db'), req.body.game_id);
      res.status(200).json(a);

    } catch(error) {
      next(error);
    }
  });

module.exports = GameRouter;