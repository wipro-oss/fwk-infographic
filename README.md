# fwk-infographic

Plotting web application frameworks on the hype cycle. The frameworks are bucketed into the various phases and the position on the curve is determined by a score calculated as `((stars/2) + forks + (commits/releases) + (contributors * 10) - openIssues) + (stackoverflowQuestions * 0.8)`. ExtJS is a special case where the source is not available on github so, the github portion of the score is the average of all the other frameworks in the same phase.

## Setup

Requires NPM and bower.

     bower install
     npm run spritegen
     npm install
     start index.html
