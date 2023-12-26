const nodemailer = require("nodemailer");
const pug = require("pug");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name;

    this.url = url;
    this.from = `WordSnap App <${process.env.GMAILUSER}>`;
  }

  newTransport() {
    // Send Grid
    return nodemailer.createTransport({
      service: "gmail",
      host: process.env.USER_HOST,
      // port: process.env.USER_PORT,
      auth: {
        user: process.env.GMAILUSER,
        pass: process.env.GMAILPASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      // auth: {
      //   user: process.env.GMAILUSER,

      //   pass: process.env.GMAILPASS,
      // },
    });
  }
  async send(template, subject) {
    // console.log(this.from);
    // console.log(this.to);
    // console.log(process.env.GMAILUSER);
    // console.log(process.env.GMAILPASS);

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: template,
    };
    // 3)Creat a transport and send email

    await this.newTransport().sendMail(mailOptions);
  }
  async sendWelcome(a) {
    console.log("sending mail...");
    await this.send(
      `Your OTP is: ${a}`,
      `Email Verification For WorldSnap App`
    );
  }

  // async sendGuardianWelcome(a) {
  //   console.log("sending mail...");
  //   await this.send(
  //     `Welcome, Your Join OTP is: ${a}`,
  //     `Account Setup Verification For Guardian Trace App`
  //   );
  // }

  async sendPasswordReset(a) {
    await this.send(
      `Password Reset Code is:${a}`,
      "Your password reset token ! ( valid for 10 minutes)"
    );
  }
};
