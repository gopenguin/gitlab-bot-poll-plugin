FROM node:9

# Add package.json and lock so this layer changes only when those files are changed and the packages don't get reinstalled every time a source file changes.
COPY package.json package-lock.json ./
RUN npm install

# Add all the files
COPY . .

EXPOSE 3000
CMD ["npm", "run", "start"]

