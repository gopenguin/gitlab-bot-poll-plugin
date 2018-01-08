const pollLabel = "poll";

const pollRegex = /\/poll[ \t]+((?:'[^']*?'|"[^"]*?"|[^'" \t,]+)(:?,[ \t]+(?:'[^']*?'|"[^"]*?"|[^'" \t,]+))*)/mi;

module.exports = (robot) => {
    robot.on('issue.open', async (event) => {
        const projectId = event.payload.project.id;
        const issueId = event.payload.object_attributes.iid;

        const issue = (await robot.client.projects.issues.show(projectId, issueId)).body;
        const pollMatch = pollRegex.exec(issue.description);

        if (pollMatch === null) {
            return;
        }
        const options = getOptions(pollMatch[1]);

        await generatePollPost(robot.client, issue, options, pollMatch);

        await setUpLabel(robot.client, projectId);
        await robot.client.projects.issues.edit(projectId, issueId, {"labels": issue.labels.concat([pollLabel]).join(",")});

    });

    robot.on('issue.note', async (event) => {
        const projectId = event.payload.project.id;
        const issueId = event.payload.issue.iid;

        const issue = (await robot.client.projects.issues.show(projectId, issueId)).body;

        if (!issue.labels.some(l => l === pollLabel)) {
            return;
        }

        const pollMatch = pollRegex.exec(issue.description);

        if (pollMatch === null) {
            return;
        }
        const options = getOptions(pollMatch[1]);

        await generatePollPost(robot.client, issue, options, pollMatch);
    });
};

async function setUpLabel(client, projectId) {
    const projectLabels = await client.projects.labels.all(projectId);
    const isPollLabelAvailable = projectLabels.some(l => l.name === pollLabel);
    if (!isPollLabelAvailable) {
        await client.projects.labels.create(projectId, {
            "name": pollLabel,
            "color": "#FF8200",
            "description": "Poll generated from gitlab bot poll plugin"
        });
    }
}

function getOptions(optionsString) {
    const optionRegex = /'([^']*?)'|"([^"]*?)"|([^'" \t,]+)/gmi;

    let optionMatch;
    const options = [];

    while ((optionMatch = optionRegex.exec(optionsString)) !== null) {
        if (optionMatch.index === optionRegex.lastIndex) {
            optionRegex.lastIndex++;
        }

        options.push(optionMatch[1] !== undefined ? optionMatch[1] : optionMatch[2] !== undefined ? optionMatch[2] : optionMatch[3]);
    }

    return options;
}

function getVote(options, note) {
    const voteRegex = /^\/vote[ \t](?:'([^']*?)'|"([^"]*?)"|([^'" \t,]+))$/mi;

    if ((optionMatch = voteRegex.exec(note)) !== null) {
        return optionMatch[1] !== undefined ? optionMatch[1] : optionMatch[2] !== undefined ? optionMatch[2] : optionMatch[3];
    }

    return undefined;
}

async function generatePollPost(client, issue, options, pollMatch) {
    const userVotes = {};

    const notes = await client.projects.issues.notes.all(issue.project_id, issue.iid);

    notes.filter(note => !note.system).forEach(note => {
        if (userVotes[note.author.id] === undefined || userVotes[note.author.id].noteId < note.id) {
            const vote = getVote(options, note.body);
            if (vote !== undefined){
                userVotes[note.author.id] = {
                    noteId: note.id,
                    vote: vote
                };
            }
        }
    });

    const optionCount = {};
    Object.keys(userVotes).forEach(key => {
        const userVote = userVotes[key];
        if (optionCount[userVote.vote] === undefined) {
            optionCount[userVote.vote] = 1;
        } else {
            optionCount[userVote.vote]++;
        }
    });

    const editedPost = `
${issue.description.substring(0, pollMatch.index).replace('[//]: # "', '')}
[//]: # "${issue.description.substring(pollMatch.index, pollMatch.index + pollMatch[0].length)}"
${options.map(option => `
* ${option}  (${optionCount[option] === undefined ? 0 : optionCount[option]})`).join('').trim()}
`.trim();

    await client.projects.issues.edit(issue.project_id, issue.iid, {description: editedPost});
}
