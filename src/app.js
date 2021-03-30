const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users.js');

const port = process.env.PORT || '3000';
const publicDirectory = __dirname.replace(/\w+$/g, 'public');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(publicDirectory));

io.on('connection', (socket) => {
  console.log('new websocket connection');

  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit('message', generateMessage('System', 'Welcome'));
    socket.broadcast.to(user.room).emit('message', generateMessage('System', `${user.username} has joined`));
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    callback();
  });

  socket.on('sendMessage', (textMessage, callback) => {
    const filter = new Filter();
    const user = getUser(socket.id);

    if (filter.isProfane(textMessage)) {
      return callback('Profanity is not allowed');
    }

    io.to(user.room).emit('message', generateMessage(user.username, textMessage));
    callback();
  });

  socket.on('sendLocation', (location, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${location.latitude},${location.longitude}`));
    callback('Location shared');
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', generateMessage('System',`${user.username} has left`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server is running on port: ${port}`)
});
