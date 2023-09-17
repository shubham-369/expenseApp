const bcrypt = require('bcrypt');
const User = require('../models/user');
const sequelize = require('../util/database');
const sendInBlue = require('sib-api-v3-sdk');
const forgotPasswordRequest = require('../models/forgotPassword');
const crypto = require('crypto');

exports.forgotPassword = async (req, res, next) => {
    const {email} = req.body;
    const t = await sequelize.transaction();
    try{            
        const user = await User.findOne({where: {email: email}}, {transaction: t});
        if(!user){
            return res.status(404).json({message: 'Email does not exist'});
        }
        const FP = await forgotPasswordRequest.create({userId: user.id}, {transaction: t});
        const resetId = FP.id;

        const client = sendInBlue.ApiClient.instance;
        const apiKey = client.authentications['api-key'];
        apiKey.apiKey = process.env.API_KEY;
        const sender = {email:'shubham.srivastav666@gmail.com'};
        const reciever = [ {email: email }]
        const transactionalEmailApi = new sendInBlue.TransactionalEmailsApi();
        
        await transactionalEmailApi.sendTransacEmail({
            sender,
            to: reciever,
            subject: 'Forgot password reset email',
            htmlContent: `<p>Click the following link to reset your password: <a href="http://localhost:3000/user/password/resetPassword/${resetId}">Reset password</a></p>`
        });
        await t.commit();
        res.status(200).json({message: 'Email sent'});
    }
    catch(error){
        await t.rollback();
        console.log('error while sending email: ', error);
        res.status(500).json({message: 'Email does not exist'});
    }
};

exports.resetPassword = async (req, res, next) => {
    const {resetId} = req.params;
    const nonce = crypto.randomBytes(16).toString('base64');
    try{
        const request = await forgotPasswordRequest.findOne({where: {id: resetId}});
        if(request.isActive){
            await request.update({isActive: false});
            res.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'self' 'nonce-${nonce}';`);
            res.status(200).send(`
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <title></title>
                    <meta name="description" content="">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                <style nonce="${nonce}">
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f2f2f2;
                        margin: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }

                    .container {
                        width: 21vw;
                        background-color: #e6e3e3;
                        padding: 1rem;
                    }

                    h2 {
                        text-align: center;
                    }
                    label {
                        display: block;
                        margin-bottom: 0.5rem;
                    }
                    input{
                        margin-bottom: 1rem;
                        width: 100%;
                        min-height: 2rem;
                        border-color: 1px solid rgb(199, 199, 199);
                    }
                    .btn {
                        background-color: #007bff;
                        color: #fff;
                        border: none;
                        padding: 1rem 2rem;
                        border-radius: 3px;
                        cursor: pointer;
                    }

                    .btn:hover {
                        background-color: #0056b3;
                    }
                    #message{
                        color: red;
                    }
                </style>

                </head>
                <body>
                    <div class="container">
                        <h2>Password Reset</h2>
                        <form action="/user/password/updatePassword/${resetId}" method="POST" nonce="${nonce}">
                            <label for="newPassword">New Password:</label>
                            <input type="password" id="newPassword" name="newPassword" required>
                
                            <label for="confirmPassword">Confirm Password:</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" required>
                            <h3 class="form-text" id="message"></h3>
                
                            <button type="submit" class="btn">Reset Password</button>
                        </form>
                    </div>
                    <script nonce="${nonce}">
                        document.addEventListener('DOMContentLoaded', () => {
                            const n = document.getElementById('newPassword')
                            const c = document.getElementById('confirmPassword');
                            c.addEventListener('input', () => {
                                if(c.value !== n.value){
                                    document.getElementById('message').textContent = "Password do not match!";
                                }else{document.getElementById('message').textContent = "";}
                            });
                        });
                    </script>
                </body>
            </html>
            `);
            res.end();
        }
    }
    catch(error){
        console.log('Invalid link: ', error);
        res.status(500).json({message: 'Link is not valid anymore!'});
    }
};

exports.updatePassword = async (req, res, next) => {
    const { newPassword } = req.body;
    const resetId = req.params.resetId;
    const t = await sequelize.transaction();
    try {
        const resetRequest = await forgotPasswordRequest.findOne({ where: { id: resetId } }, { transaction: t });
        const user = await User.findOne({ where: { id: resetRequest.userId } }, { transaction: t });

        if (user) {
            const saltRounds = 10;

            bcrypt.genSalt(saltRounds, async (error, salt) => {
                if (error) {
                    await t.rollback();
                    console.error('Error generating salt: ', error);
                    return res.status(500).json({ message: 'Error while updating password' });
                } else {
                    bcrypt.hash(newPassword, salt, async (error, hash) => {
                        if (error) {
                            await t.rollback();
                            console.error('Error hashing password: ', error);
                            return res.status(500).json({ message: 'Error while updating password' });
                        } else {
                            try {
                                await user.update({ password: hash }, { transaction: t });
                                await t.commit();
                                return res.status(200).redirect('http://localhost:1000/login.html');
                            } catch (updateError) {
                                await t.rollback();
                                console.error('Error updating user password: ', updateError);
                                return res.status(500).json({ message: 'Error while updating password' });
                            }
                        }
                    });
                }
            });
        } else {
            await t.rollback();
            return res.status(500).json({ message: 'No user exists for this reset request' });
        }
    } catch (error) {
        await t.rollback();
        console.error('Error in password update controller: ', error);
        return res.status(500).json({ message: 'Error while updating password' });
    }
};