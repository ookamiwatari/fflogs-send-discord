FROM node:8-wheezy
 
# Install app dependencies
COPY package.json /src/package.json
WORKDIR /src

RUN npm install

# Copy the application files
COPY . /src

# Start the server
CMD ["npm", "start"]