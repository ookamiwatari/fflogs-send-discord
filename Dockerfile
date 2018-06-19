FROM node:8-wheezy

WORKDIR /var/app/

EXPOSE 8080

ADD package.json /var/app/

RUN npm install

ADD . /var/app/

CMD ["npm", "run", "dev"]