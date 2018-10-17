FROM node:8

EXPOSE 8080

WORKDIR /var/app/

RUN apt-get update &&\
    apt-get install -y libgtk2.0-0 libgconf-2-4 \
    libnotify4 libasound2 libxtst6 libxss1 libnss3 xvfb

ADD package.json /var/app/

RUN npm install

ADD . /var/app/

CMD xvfb-run --server-args="-screen 0 520x416x8" npm run dev
