const bcrypt = require('bcrypt');
const User = require('../models/user');
const mongoose = require('mongoose');
const sendInBlue = require('sib-api-v3-sdk');
const FPRequest = require('../models/forgotPassword');

exports.forgotPassword = async (req, res, next) => {
    const {email} = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();
    try{            
        const user = await User.findOne({ email: email }).session(session);
        if(!user){
            console.error('user not found for', email);
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({message: 'Email does not exist'});
        }
        const FP = new FPRequest({
            isActive: true,
            user: user._id
        });
        await FP.save(session);
        const resetId = FP._id;

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
            htmlContent: `<p>Click the following link to reset your password: <a href="${process.env.HOST}/user/password/resetPassword/${resetId}">Reset password</a></p>`
        });
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({message: 'Email sent'});
    }
    catch(error){
        await session.abortTransaction();
        session.endSession();
        console.log('error while sending email: ', error);
        res.status(500).json({message: 'Email does not exist'});
    }
};

exports.resetPassword = async (req, res, next) => {
    const {resetId} = req.params;
    try{
        const request = await FPRequest.findOne({_id: resetId});
        if(request.isActive){
            await request.updateOne({isActive: false});
            res.status(200).send(`
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <title></title>
                    <meta name="description" content="">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
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
                        <form action="/user/password/updatePassword/${resetId}" method="get" onsubmit="submit(event)">
                            <label for="newPassword">New Password:</label>
                            <input type="password" id="newPassword" name="newPassword" required>
                
                            <label for="confirmPassword">Confirm Password:</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" required>
                            <h3 class="form-text" id="message"></h3>
                
                            <button type="submit" class="btn">Reset Password</button>
                        </form>
                    </div>
                    <script>
                        document.addEventListener('DOMContentLoaded', () => {
                            function submit(event){
                                event.preventDefault();
                            }
                        
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
    const { newPassword } = req.query;
    const resetId = req.params.resetId;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const resetRequest = await FPRequest.findOne({ _id: resetId }).session(session);
        const user = await User.findOne({ _id: resetRequest.user }).session(session);

        if (!user) {
            await session.abortTransaction()
            session.endSession();
            return res.status(500).json({ message: 'No user exists for this reset request' });
        }
    
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(newPassword, salt);

        await user.updateOne({ password: hash});
        await session.commitTransaction();
        session.endSession();

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error in password update controller: ', error);
        return res.status(500).json({ message: 'Error while updating password' });
    }
};