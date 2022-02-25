const express = require('express');
const hbs = require('hbs');
const wax = require('wax-on');
const request = require('request');
const app = express();

app.set('view engine', 'hbs');

app.use(express.static('public'));

wax.on(hbs.handlebars);
wax.setLayoutPath('./views/layouts');

var spotify_client_id = process.env.CLIENT_ID;
var spotify_client_secret = process.env.CLIENT_SECRET;

var spotify_redirect_uri = process.env.REDIRECT_URI;

var generateRandomString = function (length) {
  var text = '';
  var possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

(async () => {
  app.get('/', (req, res) => {
    res.send('Hello world');
  });

  app.get('/auth/login', async (req, res) => {
    var scopes = [
      'streaming',
      'user-read-currently-playing',
      'user-read-playback-state',
    ];
    var state = generateRandomString(16);

    var auth_query_parameters = new URLSearchParams({
      response_type: 'code',
      client_id: spotify_client_id,
      scope: scopes,
      redirect_uri: spotify_redirect_uri,
      state: state,
    });

    res.redirect(
      'https://accounts.spotify.com/authorize/?' +
        auth_query_parameters.toString()
    );
  });

  app.get('/auth/callback', async (req, res) => {
    var code = req.query.code;

    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: spotify_redirect_uri,
        grant_type: 'authorization_code',
      },
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString(
            'base64'
          ),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      json: true,
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        access_token = body.access_token;

        res.render('index', {
          accessToken: body.access_token,
        });
      }
    });
  });

  app.get('/auth/token', (req, res) => {
    res.json({ access_token: access_token });
  });
})();

app.listen(process.env.PORT || 8888, () =>
  console.log('Server is running! Woohoo!')
);
