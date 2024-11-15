
import  nodemailer from 'nodemailer'




const transporter = nodemailer.createTransport({
    service:process.env.MAILER_SERVICE,
    auth: {
      user: process.env.MAILER_EMAIL,
      pass: process.env.MAILER_SECRET_KEY,
    },
});




async function main(email, codigoVerificacion) {

    const info = await transporter.sendMail({
      to: email, 
      subject: "Código de verificación", 
      html: `<b>El código de verificación es: ${codigoVerificacion}
      </b>`,
    });
  
    console.log("Message sent: %s", info.messageId);

  }

export {
    main
}