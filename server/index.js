const path = require('path');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = 8080;
const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;

// const scalePortPath = '/dev/cu.usbserial';
// const scaleTtyPortPath = '/dev/tty.usbserial';

let scaleData = {};
let serialPort, lineStream;

const isScaleConnected = async () => {
  const ports = await SerialPort.list();
  console.log(ports);
  const p = ports.find((p) => p.productId === '7523' && p.vendorId.toLowerCase() === '1a86');
  return p ? p.path.replace("tty", "cu") : false;
};

const openScalePort = (connectedPortPath) => {
  console.log('openScalePort');
  serialPort = new SerialPort(connectedPortPath, { baudRate: 9600 });
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

const reconnect = async () => {
  console.log('closed and trying to reconnect');
  let connectedPortPath = false;
  const intervalId = setInterval(async () => {
    connectedPortPath = await isScaleConnected();
    console.log('connectedPortPath inside interval', connectedPortPath);
    if (connectedPortPath) {
      openScalePort(connectedPortPath);
      clearInterval(intervalId);
    };
  }, 1000);
};

reconnect();

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