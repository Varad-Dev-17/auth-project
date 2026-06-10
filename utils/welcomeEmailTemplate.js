export const welcomeEmailTemplate = (username) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background-color: #f4f4f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 500px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: #4f46e5;
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 22px;
      font-weight: 600;
    }
    .body {
      padding: 32px;
      text-align: center;
    }
    .body p {
      color: #4b5563;
      font-size: 15px;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }
    .btn {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 16px 0;
    }
    .footer {
      padding: 20px 32px;
      background: #f9fafb;
      text-align: center;
    }
    .footer p {
      color: #9ca3af;
      font-size: 12px;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome, ${username}!</h1>
    </div>
    <div class="body">
      <p>Your account has been created successfully.</p>
      <p>Before you proceed to sign in, please verify your email address in profile section.</p>
    </div>
    <div class="footer">
      <p>If you didn't create this account, you can safely ignore this email.</p>
      <p>Tech Team</p>
    </div>
  </div>
</body>
</html>`;
};
