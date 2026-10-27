var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  var sessionId = req.session.id;
  res.send('respond with a resource:' + sessionId);
});

module.exports = router;
