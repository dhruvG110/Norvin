import jwt from "jsonwebtoken";
import { client } from "../utils/prismaClient";
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    const storedToken = await client.token.findUnique({
      where: {
        token: token,
      },
    });

    if (!storedToken) {
      return res.status(401).json({
        message: "Invalid token. Please log in again.",
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    console.error("Error in authMiddleware:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired. Please log in again.",
      });
    }

    return res.status(500).json({
      message: "An error occurred while verifying the token.",
    });
  }
};
