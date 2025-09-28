const jobDescService = require('../services/jobDescService');

class jobDescController {
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
    async analyzeFile(req, res, next) {
        try {
            if (!req.file) {
                const error = new Error('No file uploaded. Please use the "analysisFile" field.');
                error.status = 400; 
                return next(error);
            }
            const analysisResult = await jobDescService.analyzeFile(req.file);
            res.status(200).json({
                success: true,
                message: 'File analyzed successfully',
                data: analysisResult
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new jobDescController();