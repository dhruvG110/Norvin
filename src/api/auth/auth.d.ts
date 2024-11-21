import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const client = new PrismaClient();
const nodemailer = require("nodemailer");

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await client.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      return res.status(404).json({
        message: "No such user! Please sign up.",
      });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Email or Password is incorrect",
      });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const newToken = await client.token.create({
      data: {
        token: token,
      },
    });
    const { password: userPassword, ...userWithoutPassword } = user;

    return res.status(200).json({
      message: "Welcome back again!",
      token: newToken.token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({
      message: "An error occurred during login.",
    });
  }
};

const register = async (req, res) => {
  try {
    const { email, password, username, role } = req.body;
    const user = await client.user.findUnique({
      where: {
        email: email,
      },
    });

    if (user) {
      return res.status(400).json({
        message: "User already exists",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await client.user.create({
      data: {
        email: email,
        password: hashedPassword,
        username: username,
        role: role,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role }, // Payload
      process.env.JWT_SECRET, // Replace with a secure secret key
      { expiresIn: "1h" } // Token expiration
    );
    const newToken = await client.token.create({
      data: {
        token: token,
      },
    });
    // Exclude password from response
    const { password: userPassword, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      message: "New user created",
      token: newToken.token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({
      message: "An error occurred while creating the user.",
    });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(411).json({
        message: "No token found",
      });
    }
    const dbToken = await client.token.delete({
      where: {
        token: token,
      },
    });
    return res.json({
      message: "Logout successfully !",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong !?!",
      error: error,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await client.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "No user found. Please sign up.",
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    await client.otp.create({
      data: {
        Otp: otp,
        userId: user.id,
      },
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.HOST_EMAIL, pass: process.env.HOST_PASS },
    });

    const mailOptions = {
      from: process.env.HOST_EMAIL,
      to: user.email,
      subject: "Forgot password",
      text: `Your OTP for resetting the password is ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({
          message: "Error sending email",
          error: error.message,
        });
      } else {
        return res.status(200).json({
          message: "OTP sent to your email. Please verify.",
          id: user.id,
        });
      }
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return res.status(500).json({
      message: "An error occurred during the process.",
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const user = await client.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const storedOtp = await client.otp.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (!storedOtp || storedOtp.Otp !== otp) {
      return res.status(400).json({
        message: "Invalid or expired OTP.",
      });
    }

    await client.otp.delete({
      where: {
        id: storedOtp.id,
      },
    });

    return res.status(200).json({
      message: "OTP verified successfully. You may now reset your password.",
    });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return res.status(500).json({
      message: "An error occurred during OTP verification.",
    });
  }
};
const resetPassword = async (req, res) => {
  const { id } = req.params;
  const user = await client.user.findUnique({
    where: {
      id: id,
    },
  });
  const { password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const updatedUser = await client.user.update({
    where: {
      id: id,
    },
    data: {
      password: hashedPassword,
    },
  });
  return res.status(201).json({
    message: "Password Updated Successfully",
  });
};
export  {
  login,
  logout,
  register,
  forgotPassword,
  resetPassword,
  verifyOtp,
};
