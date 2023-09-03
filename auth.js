const { nanoid } = require("nanoid");
const { logger } = require('./logger.js');

let sessions = {};
exports.auth = () => (req, res, next) => {
    logger.info('auth req.cookies[sessionId]', req.cookies['sessionId']);
    let sessionId = req.cookies['sessionId'];
    //sessions[sessionId] ? next() : res.redirect('/')
    if (sessions[sessionId]) {
      req.body.username = sessions[sessionId];
      next();
    }
    else {
      res.redirect('/')
    }
};

exports.auth2 = () => (req, res, next) => {
    logger.info('auth req.cookies[sessionId]', req.cookies['sessionId']);
    let sessionId = req.cookies['sessionId'];
    //sessions[sessionId] ? next() : res.redirect('/')
    if (sessions[sessionId]) {
      req.body.username = sessions[sessionId];
      res.redirect('/dashboard');
    }
    else {
      next();
    }
};

exports.sessions = function (username) {
    logger.info('sessions (username)', username);
    let sessionId = nanoid();
    sessions[sessionId] = username;
    logger.info('sessions', sessions);
    //next();
    return sessionId;
}

exports.deletesession = function (sessionId) {
    //logger.info('sessions (username)', username);
    //let sessionId = nanoid();
    delete sessions[sessionId];
    logger.info('sessions', sessions);
    //next();
    return ;
}
