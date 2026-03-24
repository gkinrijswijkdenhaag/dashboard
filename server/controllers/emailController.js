const nodemailer = require("nodemailer");
const sanitizeHtml = require("sanitize-html");
const { logEmail } = require("./emailHistoryController");
const emailSettingsController = require("./emailSettingsController");

// Allowed HTML subset for outgoing emails — strips scripts, iframes, event handlers, etc.
const ALLOWED_EMAIL_HTML = {
  allowedTags: [
    'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'blockquote', 'pre', 'code', 'span', 'div',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    '*': ['style'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
};

/**
 * Send an email
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const sendEmail = async (req, res) => {
  try {
    const {
      to,
      cc,
      subject,
      message,
      html,
      documentType,
      documentLink,
      serviceDate,
      recipientType,
    } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Get user info from the auth middleware
    const {
      id: senderId,
      role: senderRole,
      username: senderUsername,
    } = req.user;

    // Get email settings from database
    const emailSettings =
      await emailSettingsController.getEmailSettingsInternal();

    // Create a transporter using the configured email settings
    const transporter = nodemailer.createTransport({
      host: emailSettings.smtp_host,
      port: parseInt(emailSettings.smtp_port),
      secure: emailSettings.smtp_secure === "true",
      auth: {
        user: emailSettings.smtp_user,
        pass: emailSettings.smtp_password,
      },
    });

    // Prepare email content with the document link
    let emailContent = message;
    if (documentLink) {
      emailContent += `\n\nYou can access the document here: ${documentLink}`;
    }

    console.log("Attempting to send email to:", to);

    let info;
    let emailLogData = {
      senderId,
      senderRole,
      senderUsername,
      to,
      cc: cc || null,
      subject,
      message: emailContent,
      documentType,
      documentLink,
      serviceDate: serviceDate || null,
      recipientType: recipientType || null,
      status: "pending",
    };

    try {
      // Prepare the email options
      const mailOptions = {
        from: `"${emailSettings.from_name}" <${emailSettings.from_email}>`,
        to,
        subject,
        text: emailContent,
      };

      // Add CC if provided and not empty
      if (cc && cc.trim()) {
        mailOptions.cc = cc;
      }

      // Add HTML body if provided — sanitize before use
      if (html) {
        mailOptions.html = sanitizeHtml(html, ALLOWED_EMAIL_HTML);
      }

      // Send the email
      info = await transporter.sendMail(mailOptions);

      console.log("Email sent successfully: %s", info.messageId);

      // Update email log data with success info
      emailLogData.messageId = info.messageId;
      emailLogData.status = "sent";

      // Log the successful email to history
      await logEmail(emailLogData);

      res.json({
        message: "Email sent successfully",
        messageId: info.messageId,
      });
      return; // End the function here after successful email
    } catch (emailError) {
      console.error("SMTP Error:", emailError);

      // Log the failed email to history
      emailLogData.status = "failed";
      emailLogData.errorMessage = emailError.message;
      try {
        await logEmail(emailLogData);
      } catch (logError) {
        console.error("Failed to log email error to history:", logError);
      }

      // Log more details about the error
      if (emailError.code === "ECONNREFUSED") {
        console.error(
          "Connection refused. Check if the SMTP server is accessible from your network."
        );
      } else if (emailError.code === "EAUTH") {
        console.error(
          "Authentication failed. Check your username and password."
        );
      }
      throw emailError; // Re-throw to be caught by the outer try/catch
    }
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
};

/**
 * Internal function to send an email (for use within controllers)
 * @param {Object} emailReq - Request-like object with body and user
 * @returns {Promise<Object>} Email send result
 */
const sendEmailInternal = async (emailReq) => {
  try {
    const {
      to,
      cc,
      subject,
      message,
      html,
      documentType,
      documentLink,
      serviceDate,
      recipientType,
    } = emailReq.body;

    if (!to || !subject || !message) {
      throw new Error("Missing required fields");
    }

    // Get user info from the request
    const {
      id: senderId,
      role: senderRole,
      username: senderUsername,
    } = emailReq.user;

    // Get email settings from database
    const emailSettings =
      await emailSettingsController.getEmailSettingsInternal();

    // Create a transporter using the configured email settings
    const transporter = nodemailer.createTransport({
      host: emailSettings.smtp_host,
      port: parseInt(emailSettings.smtp_port),
      secure: emailSettings.smtp_secure === "true",
      auth: {
        user: emailSettings.smtp_user,
        pass: emailSettings.smtp_password,
      },
    });

    // Prepare email content with the document link
    let emailContent = message;
    if (documentLink) {
      emailContent += `\n\nYou can access the document here: ${documentLink}`;
    }

    let emailLogData = {
      senderId,
      senderRole,
      senderUsername,
      to,
      cc: cc || null,
      subject,
      message: emailContent,
      documentType,
      documentLink,
      serviceDate: serviceDate || null,
      recipientType: recipientType || null,
      status: "pending",
    };

    try {
      // Prepare the email options
      const mailOptions = {
        from: `"${emailSettings.from_name}" <${emailSettings.from_email}>`,
        to,
        subject,
        text: emailContent,
      };

      // Add CC if provided and not empty
      if (cc && cc.trim()) {
        mailOptions.cc = cc;
      }

      // Add HTML body if provided — sanitize before use
      if (html) {
        mailOptions.html = sanitizeHtml(html, ALLOWED_EMAIL_HTML);
      }

      // Send the email
      const info = await transporter.sendMail(mailOptions);

      // Update email log data with success info
      emailLogData.messageId = info.messageId;
      emailLogData.status = "sent";

      // Log the successful email to history
      await logEmail(emailLogData);

      return {
        message: "Email sent successfully",
        messageId: info.messageId,
      };
    } catch (emailError) {
      // Log the failed email to history
      emailLogData.status = "failed";
      emailLogData.errorMessage = emailError.message;
      try {
        await logEmail(emailLogData);
      } catch (logError) {
        console.error("Failed to log email error to history:", logError);
      }
      throw emailError;
    }
  } catch (error) {
    console.error("Error sending email internally:", error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendEmailInternal,
};
