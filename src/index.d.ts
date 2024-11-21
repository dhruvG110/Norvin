import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();
import cors from 'cors'
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON and URL-encoded data
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Example routes
// app.get('/user',userRouter)
// app.get('/auth',authRouter)
// app.get('/admin',adminRouter)
// app.get('/chat',chatRouter)
// app.get('/project',projectRouter)
// app.get('/video',videoRouter)

// 404 Middleware for unmatched routes
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
    