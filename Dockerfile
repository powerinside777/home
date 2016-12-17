FROM hypriot/rpi-node:latest
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
#RUN npm install

# Bundle app source
COPY . /usr/src/app

EXPOSE 6969
EXPOSE 8083
