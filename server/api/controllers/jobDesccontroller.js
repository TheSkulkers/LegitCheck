const jobDescService = require('../services/jobDescService');

class jobDescController {
    // This is your existing method for text, no changes needed here.
    async postJobDesc(req, res, next) {
        try {
            const jobDesc = req.body;
            const jobDescResponse = await jobDescService.postJobDesc(jobDesc);

            res.status(201).json({
                success: true,
                message: 'Response Received',
                data: jobDescResponse
            });
        } catch (error) {
            next(error);
        }
    }

    // --- NEW METHOD TO HANDLE FILE UPLOADS ---
    async analyzeFile(req, res, next) {
        try {
            // 1. Check if multer has provided a file.
            if (!req.file) {
                // Create an error object for the error-handling middleware
                const error = new Error('No file uploaded. Please use the "analysisFile" field.');
                error.status = 400; // Bad Request
                return next(error);
            }

            // 2. Pass the file from req.file to the service.
            const analysisResult = await jobDescService.analyzeFile(req.file);

            // 3. Send the successful response.
            res.status(200).json({
                success: true,
                message: 'File analyzed successfully',
                data: analysisResult
            });
        } catch (error) {
            // 4. Pass any other errors to the middleware.
            next(error);
        }
    }
}

module.exports = new jobDescController();