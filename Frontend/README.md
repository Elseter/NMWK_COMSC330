This is currently the default setup for REACT using Vite as a rendering framework
When you first download from Github, run the following commands:

- move to the main directory for the project, it should contain package.json
- *npm install*
- npm run dev

npm install, installs all of the necessary 3rd party packages that are a part of the project. Any libraries we install as we work, will also be a part of this commands. If the project isn't running after you update it, try this command

npm run dev, this is the command that actually starts up the frontend webserver. The server itself starts by rendering the index file, which then typically renders the next few components and so forth. To close the webserver, press ctrl-c in the same terminal where you first ran npm run dev
