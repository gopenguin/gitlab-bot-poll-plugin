module.exports = (robot) => {
    robot.on('issue.open', (event) => {
        console.log(event);
        robot.logger.info("Commenting on " + event.payload.object_attributes.title);
        //robot.client.projects.issues.notes.create(event.payload.object_attributes.project_id, event.payload.object_attributes.iid, {body: "Stefan sagt: Ich machs!"});
        //robot.client.projects.issues.show()

        const projectId = event.payload.project_id;
        const issueId = event.payload.issue_iid;

        const issue = client.projects.issues.show(projectId, issueId);
        const pollMatch = pollRegex.exec(issue.description);

        if (pollMatch !== null) {
            const options = getOptions(pollMatch[1]);
            const editedPost = `${issue.description.substring(0, pollMatch.index)}
[//]: # "BEGIN POLL"
            
[//]: # "${issue.description.substring(pollMatch.index, pollMatch.index + pollMatch[0].length)}"
            
            ${options.map(option => `
* ${option}
            `).join('').trim()}
            
[//]: # "END POLL"`;

            client.projects.issues.edit(projectId, issueId, {description: editedPost});
            setUpLabel(client, projectId);
            client.projects.issues.edit(projectId, issueId, {"labels": issue.labels.concat(["poll"]).join(",")});
        }

    });

    robot.on('issue.note', (event) => {

    });
};

const pollRegex = /^\/poll[ \t]+((?:'[^']*?'|"[^"]*?"|[^'"]*?)(:?,[ \t]+(?:'[^']*?'|"[^"]*?"|[^'" \t,]+))*)$/mi;
const voteRegex = /^\/vote[ \t]('[^']*?'|"[^"]*?"|[^'" \t,]+)$/mi;
const optionRegex = /('[^']*?'|"[^"]*?"|[^'" \t,]+)/mi;


function setUpLabel(client, projectId) {
    const labels = client.projects.labels.all(projectId);
    const isPollLabelAvailable = labels.some(l => l.name === "poll");
    if (!isPollLabelAvailable) {
        client.projects.labels.create(projectId, {
            "name": "poll",
            "color": "#FF8200",
            "description": "Poll generated from gitlab bot poll plugin"
        });
    }
}



function getOptions(optionsString) {
    let optionMatch;
    while (optionMatch = optionRegex.exec(optionsString)) {
        options.push(optionMatch[0]);
    }
}

