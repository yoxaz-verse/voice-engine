
// import net from 'net';

// const client = new net.Socket();
// client.connect(8021, '40.233.110.97', function () {
//     console.log('Connected');
//     client.write('auth ClueCon\n\n');
// });

// client.on('data', function (data) {
//     const str = data.toString();
//     console.log('Received: ' + str);

//     if (str.includes('Content-Type: auth/request')) {
//         // handled by connect callback mostly, but good to see
//     }

//     if (str.includes('+OK accepted')) {
//         console.log('Authenticated, sending event command...');
//         client.write('event plain ALL\n\n');
//     }
// });

// client.on('close', function () {
//     console.log('Connection closed');
// });

// client.on('error', (err) => {
//     console.error(err);
// });
