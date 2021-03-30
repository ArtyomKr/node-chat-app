const socket = io();

const $messageForm = document.querySelector('.message-form');
const $messageFormInput = document.querySelector('.message-form-input');
const $messageFormButton = document.querySelector('.message-form-button');
const $locationButton = document.querySelector('.send-location');
const $messages = document.querySelector('.chat__messages');

const messageTemplate = document.querySelector('.message-template').innerHTML;
const locationMessageTemplate = document.querySelector('.location-message-template').innerHTML;
const sidebarTemple = document.querySelector('.sidebar-template').innerHTML;

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
  const $newMessage = $messages.lastElementChild;

  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  const visibleHeight = $messages.offsetHeight;

  const contentHeight = $messages.scrollHeight;

  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (contentHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on('message', (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('H:mm ')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('locationMessage', (locationMessage) => {
  console.log(locationMessage.url);
  const html = Mustache.render(locationMessageTemplate, {
    username: locationMessage.username,
    url: locationMessage.url,
    createdAt: moment(locationMessage.createdAt).format('H:mm')
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemple, {
    room,
    users
  });
  document.querySelector('.chat__sidebar').innerHTML = html;
});

$messageForm.addEventListener('submit', (event) => {
  event.preventDefault();

  $messageFormButton.setAttribute('disabled', 'disabled');
  const messageText = $messageFormInput.value;

  if (messageText !== '') {
    socket.emit('sendMessage', messageText, (error) => {
      $messageFormButton.removeAttribute('disabled');

      $messageFormInput.value = '';

      $messageFormInput.focus();

      if (error){
        return console.log(error);
      }
      console.log('The message was delivered');
    });
  } else {
    $messageFormButton.removeAttribute('disabled');
  }


});

$locationButton.addEventListener('click', () => {
  if (!navigator.geolocation){
    return alert('Geolocation is not supported by your browser');
  }

  $locationButton.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((position) => {
   socket.emit('sendLocation',{
     latitude: position.coords.latitude,
     longitude: position.coords.longitude
   }, (status) => {
        $locationButton.removeAttribute('disabled');
        return console.log(status);
   });
  });
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});