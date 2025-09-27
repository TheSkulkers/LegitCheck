const jobDescService = require('../services/jobDescService');

class jobDescController {
        async postJobDesc (req, res, next) {
        try {
            //get response
            const jobDesc = req.body;
            const jobDescResponse = await jobDescService.postJobDesc(jobDesc);

            res.status(201).json({
                success: true,
                message: 'Repsonse Recieved',
                data: jobDescResponse
            });

            
            res.status(201).json({
                success: true,
                message: 'Repsonse Recieved',
                data: jobDescResponse
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new jobDescController();  