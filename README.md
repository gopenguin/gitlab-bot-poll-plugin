# Poll Plugin for Gitlab Bot

This plugin enables the [gitlab bot](https://github.com/gopenguin/gitlab-bot) to interprete issues as polls.

A poll is initiated using the command `/poll option1, 'Option 2', "And a last option"` where `/poll` is a keyword followed by a comma sepperated list of options which can be surrounded by single or double quotes. The users can vote for each option using the command `/vote option1` where `/vote` is the keyword followed by a single option exactly matching the option in the poll command (except for the quotes).

## Install

The poll plugin can be launched in two ways:

### Short

The fast way to get started is to clone this project and run it.

```shell
git clone https://github.com/gopenguin/gitlab-bot-poll-plugin
cd gitlab-bot-poll-plugin
npm run start
```

### New project

The second, slightly more complicated way to get started would be to create a new project and add the plugin.
```shell
npm init -y
npm install --save gitlab-bot gitlab-bot-poll-plugin
npx gitlab-bot gitlab-bot-poll-plugin
```

To start the gitlab-bot without a parameter add the following to the `package.json`:
```json
{
   "gitlab-bot": {
       "plugins": [
           "gitlab-bot-poll-plugin"
       ]
   }
}
```
