// var firebase = require("firebase-admin");
// // var fcm = require("fcm-notification");
// var serviceAcount = require("../push-notification-key.json");

// // const certPath = admin.credential.cert(serviceAcount);
// // var FCM = new fcm(certPath);

// const FCM = firebase.initializeApp({
//   credential: firebase.credential.cert(serviceAcount),
// });
// // module.exports = { firebase };

// exports.sendPushNotification = (req, res, next) => {
//   try {
//     let message = {
//       notification: {
//         title: "Test Notification",
//         body: "so beautiful, so elegant, just looking like a wao",
//       },
//       data: {
//         orderId: "238497",
//         orderDate: "2023-11-28",
//       },
//       token: req.body.fcm_token,
//     };

//     FCM.send(message, function (err, resp) {
//       if (err) {
//         return res.status(500).send({
//           message: err,
//         });
//       } else {
//         return res.status(200).send({
//           message: "notification send!",
//         });
//       }
//     });
//   } catch (err) {
//     throw err;
//   }
// };
