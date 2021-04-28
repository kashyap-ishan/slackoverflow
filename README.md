## Slac Overflow: a bot to provide smart siggestions for slack



- install [node](https://nodejs.org/en/) and
  [npm](https://www.npmjs.com/) (everything else is installed
  automatically via `npm`):

```bash
$ sudo apt install nodejs npm
```

### Setting-up

```bash

$ git clone git@github.com:Sixt/com.sixt.web.slack-overflow.git overflow

$ cd overflow/

$ npm i

$EXPORT SLACK_SIGNING_SECRET='secret'
$EXPORT SLACK_BOT_TOKEN='your_token'
$EXPORT SLACK_USER_TOKEN='your_token'
$EXPORT PORT='4040'

$ node app.js
```

