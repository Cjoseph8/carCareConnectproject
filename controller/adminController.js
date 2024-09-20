
// const bookingModel =require('../models/bookingModel');
// const customerModel =require('../models/customerModel');
// const mechModel = require('../models/mechModel');

 

// exports.approveOrRejectMech = async (req, res) => {
//     try {
//         const { mechId } = req.params; // Mechanic ID to approve or reject
//         const { action } = req.body;   // Action to take ('Approve' or 'Reject')

//         // Validate input
//         if (!mechId || !action || (action !== 'Approve' && action !== 'Reject')) {
//             return res.status(400).json({ message: "Invalid request. Action must be 'Approve' or 'Reject'." });
//         }
//         // Find the mechanic by ID
//         const mechanic = await mechModel.findById(mechId);

//         if (!mechanic) {
//             return res.status(404).json({ message: "Mechanic not found." });
//         }
//         // Check if the mechanic is already approved or rejected
//         if (mechanic.approved !== 'Pending') {
//             return res.status(400).json({ message: "Mechanic's status cannot be changed from its current state." });
//         }
//         // Update the mechanic's status based on the action
//         mechanic.approved = action === 'Approve' ? 'Approved' : 'Rejected';

//         await mechanic.save();

//         res.status(200).json({
//             message: `Mechanic ${action} successfully.`,
//             data: mechanic
//         });
//     } catch (err) {
//         res.status(500).json({ message: 'An error occurred while processing your request.', error: err.message });
//     }
// };


// exports.getAllApprovedMechs = async (req, res) => {
//     try {
//         // Fetch all mechanics from the database
//         const allMechs = await mechModel.find({ approved: 'Approved' });

//         // Check if any approved mechanics are found
//         if (allMechs.length === 0) {
//             return res.status(404).json({ message: "No approved mechanics found." });
//         }

//         // Respond with the list of approved mechanics
//         res.status(200).json({
//             message: 'List of approved mechanics:',
//             data: allMechs
//         });
//     } catch (err) {
//         // Handle any errors that occur
//         res.status(500).json({
//             message: 'An error occurred while retrieving approved mechanics.',
//             error: err.message
//         });
//     }
// };


// exports.getAllRejectedMechs = async (req, res) => {
//     try {
//         // Fetch all mechanics from the database with 'Rejected' status
//         const allMechs = await mechModel.find({ approved: 'Rejected' });

//         // Check if any rejected mechanics are found
//         if (allMechs.length === 0) {
//             return res.status(404).json({ message: "No rejected mechanics found." });
//         }

//         // Respond with the list of rejected mechanics
//         res.status(200).json({
//             message: 'List of rejected mechanics:',
//             data: allMechs
//         });
//     } catch (err) {
//         // Handle any errors that occur
//         res.status(500).json({
//             message: 'An error occurred while retrieving rejected mechanics.',
//             error: err.message
//         });
//     }
// };
