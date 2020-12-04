const path = require('path');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = 8080;
const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;

const scalePortPath = '/dev/cu.usbserial-1420';
const scaleTtyPortPath = '/dev/tty.usbserial-1420';

let scaleData = {};
let serialPort, lineStream;

const isScaleConnected = async () => {
  const ports = await SerialPort.list();
  console.log(ports.map((p) => p.path));
  return !!ports.filter((p) => p.path === scaleTtyPortPath).length;
};

const openScalePort = () => {
  console.log('openScalePort');
  serialPort = new SerialPort(scalePortPath, { baudRate: 9600 });
  lineStream = serialPort.pipe(new Readline({ delimiter: '\r\n' }));

  serialPort.on('close', () => reconnect());
  serialPort.on('open', () => console.log('open'));

  lineStream.on('data', (data) => {
    strings = data.trim().split(' ');
    if (!strings[0]) return;
    if (scaleData.weight !== strings[0]) {
      scaleData = { weight: strings[0], unit: strings[1] };
      io.emit('weight', scaleData);
    }
  })
};

openScalePort();

const reconnect = async () => {
  console.log('closed and trying to reconnect');
  let isConnected = false;
  const intervalId = setInterval(async () => {
    isConnected = await isScaleConnected();
    console.log('isConnected inside interval', isConnected);
    if (isConnected) {
      openScalePort();
      clearInterval(intervalId);
    };
  }, 1000);
};

//

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'index.html'));
  } catch (error) {
    res.status(500).send(error);
  }
})

app.get('/health_check', (req, res) => {
  res.status(200).send();
})

app.get('/weight', async (req, res) => {
  try {
    // const ports = await SerialPort.list();
    // console.log('ports', ports);

    res.json({ ...scaleData });
  } catch (error) {
    console.log('error', error);
    res.status(500).send(error);
  }
});

app.get('/on-weight', async (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'on-weight.html'));
  } catch (error) {
    res.status(500).send(error);
  }
});

http.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})