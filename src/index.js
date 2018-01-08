module.exports = (robot) => {
    robot.on('issue.open', async (event) => {
        const projectId = event.payload.project.id;
        const issueId = event.payload.object_attributes.iid;

        const issue = (await robot.client.projects.issues.show(projectId, issueId)).body;
        console.log(issue);
        const pollMatch = pollRegex.exec(issue.description);

        console.log(pollMatch);
        if (pollMatch !== null) {
            const options = getOptions(pollMatch[1]);
            const editedPost = `${issue.description.substring(0, pollMatch.index)}
[//]: # "BEGIN POLL"

[//]: # "${issue.description.substring(pollMatch.index, pollMatch.index + pollMatch[0].length)}"

${options.map(option => `
* ${option}`).join('').trim()}
            
[//]: # "END POLL"`;

            await robot.client.projects.issues.edit(projectId, issueId, {description: editedPost});
            await setUpLabel(robot.client, projectId);
            await robot.client.projects.issues.edit(projectId, issueId, {"labels": issue.labels.concat(["poll"]).join(",")});
        }

    });

    robot.on('issue.note', (event) => {

    });
};

const pollRegex = /^\/poll[ \t]+((?:'[^']*?'|"[^"]*?"|[^'"]*?)(:?,[ \t]+(?:'[^']*?'|"[^"]*?"|[^'" \t,]+))*)$/mi;
const voteRegex = /^\/vote[ \t]('[^']*?'|"[^"]*?"|[^'" \t,]+)$/mi;


async function setUpLabel(client, projectId) {
    const projectLabels = await client.projects.labels.all(projectId);
    const isPollLabelAvailable = projectLabels.some(l => l.name === "poll");
    if (!isPollLabelAvailable) {
        await client.projects.labels.create(projectId, {
            "name": "poll",
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
        console.log(optionMatch);
        options.push(optionMatch[1] !== undefined ? optionMatch[1] : optionMatch[2] !== undefined ? optionMatch[2] : optionMatch[3]);
    }

    return options;
}

