const Mailjet = require('node-mailjet');

const mailjet = Mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_API_SECRET
);

async function sendValidationEmail(toEmail, token) {
    const link = `https://tisztavaros.hu/auth/verify-email?token=${token}`;

    try {
        await mailjet
            .post("send", { version: 'v3.1' })
            .request({
                Messages: [
                    {
                        From: {
                            Email: process.env.MAILJET_SENDER_EMAIL,
                            Name: process.env.MAILJET_SENDER_NAME
                        },
                        To: [
                            {
                                Email: toEmail
                            }
                        ],
                        Subject: "Tiszta Város regisztráció - E-mail cím megerősítése",
                        TextPart: `Kérlek kattints a linkre a regisztrációd megerősítéséhez: ${link}`,
                        HTMLPart: `<h3>Köszönjük, hogy regisztráltál a Tiszta Városban!</h3>
                       <p>Kattints a linkre a megerősítéshez:</p>
                       <a href="${link}">${link}</a>`
                    }
                ]
            });
        console.log(`Validation email sent to ${toEmail}`);
    } catch (err) {
        console.error("Mailjet error:", err.message || err);
    }
}

module.exports = { sendValidationEmail };
