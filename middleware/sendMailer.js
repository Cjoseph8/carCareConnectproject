const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        service: "gmail",
        port: 587,
        auth: {
            user: process.env.mailUser,
            pass: process.env.password
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: process.env.user,
            to: options.to, 
            subject: options.subject,
            html: options.html
        });

        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

module.exports = sendEmail;
