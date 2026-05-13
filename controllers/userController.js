// controllers/userController.js
const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if(!user) return res.status(404).json({ msg: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, approved, settings } = req.body;
    const updateData = { name, email, role };

    // Only include approved in the update if it's explicitly provided
    if (approved !== undefined) {
      updateData.approved = approved;
    }

    if (settings !== undefined) {
      if (settings.friPercentage !== undefined) {
        updateData['settings.friPercentage'] = settings.friPercentage;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if(!updatedUser) return res.status(404).json({ msg: 'Usuario no encontrado' });
    res.json({ msg: 'Usuario actualizado', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });
    
    // If user is already approved, return success without updating
    if (user.approved) {
      return res.json({ msg: 'Usuario ya está aprobado', user });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { approved: true },
      { new: true }
    );
    
    res.json({ msg: 'Usuario aprobado exitosamente', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if(!deletedUser) return res.status(404).json({ msg: 'Usuario no encontrado' });
    res.json({ msg: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
