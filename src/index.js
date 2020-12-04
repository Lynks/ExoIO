const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = 8080;

const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const serialPort = new SerialPort('/dev/cu.usbserial-1420', { baudRate: 9600 });

let scaleData = {};

const lineStream = serialPort.pipe(new Readline({ delimiter: '\r\n' }));

lineStream.on('data', (data) => {
  strings = data.trim().split(' ');
  if (!strings[0]) return;
  if (scaleData.weight !== strings[0]) {
    scaleData = { weight: strings[0], unit: strings[1] };
    io.emit('weight', scaleData);
  }
})

//

app.get('/', (req, res) => {
  res.send('Hello World!');
})

app.get('/health_check', (req, res) => {
  res.status(200).send();
})

app.get('/weight', async (req, res, next) => {
  try {
    res.json(scaleData);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/on-weight', async (req, res, next) => {
  try {
    res.sendFile(__dirname + '/on-weight.html');
  } catch (error) {
    res.status(500).send(error);
  }
});

http.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})