import express from 'express';
import passport from 'passport';
import '../src/google.js'; 
import dotenv from 'dotenv';
import session from 'express-session';
import { main } from '../src/controller/home.controller.js';


dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use(session({
    secret: process.env.GOOGLE_CLIENT_SECRET, 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session())

const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificación de Código</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            background-color: #ffffff;
            padding: 2em;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            max-width: 400px;
            text-align: center;
        }
        h1 {
            font-size: 1.5em;
            color: #333;
        }
        p {
            font-size: 1em;
            color: #666;
            margin-bottom: 1.5em;
        }
        label {
            font-size: 1em;
            color: #333;
            display: block;
            margin-bottom: 0.5em;
        }
        input[type="number"] {
            width: 100%;
            padding: 0.75em;
            margin-bottom: 1em;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1em;
            box-sizing: border-box;
        }
        input[type="submit"] {
            background-color: #4CAF50;
            color: white;
            padding: 0.75em 1.5em;
            border: none;
            border-radius: 4px;
            font-size: 1em;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }
        input[type="submit"]:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Verificación de Código</h1>
        <p>Se le ha enviado un código de verificación a su correo.</p>
        <form action="/verificar-codigo" method="post">
            <label for="codigo">Ingrese su código:</label>
            <input required type="number" id="codigo" name="codigo" placeholder="Código de verificación">
            <input type="submit" value="Verificar">
        </form>
    </div>
</body>
</html>`;


app.get('/', (req, res) => {
    res.send(html);
});



app.get('/login', (req, res) => {
    res.send('Login');
});


app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }), 
    async (req, res) => {
       const codigoVerificacion = Math.floor(100000 + Math.random() * 900000);
       req.session.codigoVerificacion = codigoVerificacion;
       if (req.user && req.user.emails && req.user.emails[0]) {
        req.session.user = {
            email: req.user.emails[0].value,
            name: req.user.displayName,
            photos: req.user.photos[0].value,
        };
    }


       
       const email = req.user.emails[0].value;
       await main(email, codigoVerificacion);
       res.redirect('/');

    }


);

app.post('/verificar-codigo', (req, res) => {
    const { codigo } = req.body;


    if (parseInt(codigo) === req.session.codigoVerificacion) {

        res.redirect('/dashboard');
    } else {

        res.send('Código de verificación incorrecto. Inténtalo de nuevo.');
    }
});


app.get('/dashboard', (req, res) => {
    if (!req.session.user) {

        return res.redirect('/login');
    }


    const user = req.session.user;
    
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dashboard</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f3f4f6;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .dashboard-container {
                    background-color: #ffffff;
                    border-radius: 10px;
                    padding: 2em;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                }
                h1 {
                    color: #333;
                    font-size: 1.8em;
                    margin-bottom: 0.5em;
                }
                .profile-pic {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    object-fit: cover;
                    margin-bottom: 1em;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                p {
                    font-size: 1.1em;
                    color: #666;
                    margin: 0.5em 0;
                }
                .info-container {
                    margin-top: 1.5em;
                }
            </style>
        </head>
        <body>
            <div class="dashboard-container">
                <h1>Bienvenido al Dashboard</h1>
                <img src="${user.photos}" alt="${user.name}" class="profile-pic">
                <div class="info-container">
                    <p><strong>Nombre:</strong> ${user.name}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                </div>
            </div>
        </body>
        </html>
        `);
        
});




app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});