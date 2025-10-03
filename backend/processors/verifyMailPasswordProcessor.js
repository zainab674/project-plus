import nodemailer  from 'nodemailer'

export const verifyMailPassword = async (mail, password) => {
    try {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: mail,
                pass: password,
            },
        });
        await transporter.verify();
        return true;
    } catch (error) {
        return false;
    }
}