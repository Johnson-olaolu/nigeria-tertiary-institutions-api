/**
 * @openapi
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Institution not found
 *         stack:
 *           type: string
 *           nullable: true
 *           description: Only included outside production
 */
export const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    // Read by the request logger for the dashboard's error table
    res.locals.errorMessage = err.message;
    
    res.status(statusCode).json({ 
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
};