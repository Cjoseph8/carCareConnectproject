function generateWelcomeEmail(fullName, verificationLink) {
    return `
  <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0"> <!-- Viewport meta tag -->
    <title>Welcome to [Carcare Connect Service]</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #2c2c2c; /* Dark background */
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%; /* Full width for responsiveness */
            max-width: 600px; /* Max width for larger screens */
            margin: 20px auto; /* Center the container */
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            background-color: #f4f4f4; /* Light grey background */
        }
        .header {
            background: #0F4C81;
            padding: 10px;
            text-align: center;
            border-bottom: 1px solid #ddd;
            color: #ffffff;
        }
        .content {
            color: #333333;
            text-align: center; /* Center text for mobile view */
        }
        .footer {
            background:  #002F6C;
            padding: 10px;
            text-align: center;
            border-top: 1px solid #ddd;
            font-size: 0.9em;
            color: #cccccc;
        }
        .button {
            display: inline-block;
            background-color: #002F6C;
            color: #ffffff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
        }
        /* Media Queries for mobile responsiveness */
        @media (max-width: 600px) {
            .button {
                padding: 10px 15px;
                font-size: 14px;
            }
            .container {
                padding: 10px;
            }
            .header, .footer {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to CarCare Connect SERVICE!</h1>
        </div>
        <div class="content">
            <p>Hello ${fullName},</p>
            <p>Thank you for signing up for [CarCare Connect WebApp]. We are excited to have you on board.</p>
            <p>Please click the button below to verify your account:</p>
            <p>
                <a href="${verificationLink}" class="button">Verify My Account</a>
            </p>
            <p>If you did not create an account, please ignore this email.</p>
            <p>Best regards,<br> CarCare Connect Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 [CarCare Connect Service]. All rights reserved.</p>
            <p>[Group 11, Cohort 4, The Curve Africa]</p>
        </div>
    </div>
</body>
</html>

    `;
}

function generateBookingEmail(fullName, verificationLink) {
    return `
 <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0"> <!-- Viewport meta tag -->
    <title>Carcare Connect Service</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #2c2c2c; /* Dark background */
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%; /* Full width for responsiveness */
            max-width: 600px; /* Max width for larger screens */
            margin: 20px auto; /* Center the container */
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            background-color: #f4f4f4; /* Light grey background */
        }
        .header {
            background: #0F4C81;
            padding: 10px;
            text-align: center;
            border-bottom: 1px solid #ddd;
            color: #ffffff;
        }
        .content {
            color: #333333;
            text-align: center; /* Center text for mobile view */
        }
        .footer {
            background:  #002F6C;
            padding: 10px;
            text-align: center;
            border-top: 1px solid #ddd;
            font-size: 0.9em;
            color: #cccccc;
        }
        .button {
            display: inline-block;
            background-color: #002F6C;
            color: #ffffff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
        }
        /* Media Queries for mobile responsiveness */
        @media (max-width: 600px) {
            .button {
                padding: 10px 15px;
                font-size: 14px;
            }
            .container {
                padding: 10px;
            }
            .header, .footer {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CarCare Connect SERVICE!</h1>
        </div>
        <div class="content">
            <p>Hello ${fullName},</p>
            <p>You have a booking waiting for you!!!</p>
            <p>Please click the button below to view booking</p>
            <p>
                <a href="${verificationLink}" class="button">VIEW BOOKING</a>
            </p>
            <p>Best regards,<br> CarCare Connect Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 [CarCare Connect Service]. All rights reserved.</p>
            <p>[Group 11, Cohort 4, The Curve Africa]</p>
        </div>
    </div>
</body>
</html>


    `;
}

function ForgetPasswordEmail(fullName, verificationLink) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0"> <!-- Viewport meta tag -->
    <title>Carcare Connect Service</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #2c2c2c; /* Dark background */
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%; /* Full width for responsiveness */
            max-width: 600px; /* Max width for larger screens */
            margin: 20px auto; /* Center the container */
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            background-color: #f4f4f4; /* Light grey background */
        }
        .header {
            background: #0F4C81;
            padding: 10px;
            text-align: center;
            border-bottom: 1px solid #ddd;
            color: #ffffff;
        }
        .content {
            color: #333333;
            text-align: center; /* Center text for mobile view */
        }
        .footer {
            background:  #002F6C;
            padding: 10px;
            text-align: center;
            border-top: 1px solid #ddd;
            font-size: 0.9em;
            color: #cccccc;
        }
        .button {
            display: inline-block;
            background-color: #000000;
            color: #ffffff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
        }
        /* Media Queries for mobile responsiveness */
        @media (max-width: 600px) {
            .button {
                padding: 10px 15px;
                font-size: 14px;
            }
            .container {
                padding: 10px;
            }
            .header, .footer {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CarCare Connect SERVICE!</h1>
        </div>
        <div class="content">
            <p>Hello ${fullName},</p>
            <p>Forgot your password? No worries CarCare got you covered</p>
            <p>Please click the button below to reset your password</p>
            <p>
                <a href="${verificationLink}" class="button">RESET PASSWORD</a>
            </p>
            <p>If you did not initiate this, please ignore this email.</p>
            <p>Best regards,<br> CarCare Connect Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 [CarCare Connect Service]. All rights reserved.</p>
            <p>[Group 11, Cohort 4, The Curve Africa]</p>
        </div>
    </div>
</body>
</html>


    `;
}



module.exports={
    generateWelcomeEmail,
    generateBookingEmail,
    ForgetPasswordEmail
}