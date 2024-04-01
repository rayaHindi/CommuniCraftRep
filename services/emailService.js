
const nodemailer = require('nodemailer');

// Create transporter (configure with your SMTP details)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'communicrafts@gmail.com',
        pass: 'uuxo lwmf tzdh ytdu'
    },
    tls: {
        rejectUnauthorized: false 
    }
});

// Function to send email
function sendEmail(recipientEmail, project) {
    return new Promise((resolve, reject) => {
        // Define email message
        const mailOptions = {
            from: 'communicrafts@gmail.com',
            to: recipientEmail,
            subject: `Check out this project: ${project.projectName}`,
            text: `Project Name: ${project.projectName}\nDescription: ${project.description}`
        };

        // Send email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(error);
            } else {
                resolve(info);
            }
        });
    });
}

module.exports = { sendEmail };
