FROM hypriot/rpi-node:latest
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
RUN apt-get update && apt-get install -y \
    git-core \
    build-essential \
    gcc \
    python \
    python-dev \
    python-pip \
    python-virtualenv \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

RUN pip install pyserial
RUN git clone git://git.drogon.net/wiringPi
RUN cd wiringPi && ./build
RUN pip install wiringpi2

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

EXPOSE 6969
EXPOSE 8083

