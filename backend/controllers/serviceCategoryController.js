// C:\Users\Siddharathan\Desktop\salon-booking-full-stack\backend\controllers\serviceCategoryController.js
import ServiceCategory from '../models/ServiceCategory.js';
import { v2 as cloudinary } from 'cloudinary';

// ✅ Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer, mimetype, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });
};

const getAllServices = async (req, res) => {
  try {
    const services = await ServiceCategory.find().sort({ createdAt: -1 });
    res.json({ success: true, services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.json({ success: false, message: 'Failed to fetch services' });
  }
};

const createService = async (req, res) => {
  try {
    const { name, description, basePrice } = req.body;

    if (!name || !description || !basePrice) {
      return res.json({ success: false, message: 'Name, description and base price are required' });
    }

    if (!req.file) {
      return res.json({ success: false, message: 'Service image is required' });
    }

    // ✅ FIX S08-002: Check for duplicate name (case-insensitive)
    const existing = await ServiceCategory.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    if (existing) {
      return res.json({ success: false, message: 'Category already exists' });
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'services');
    const imageUrl = uploadResult.secure_url;

    const service = new ServiceCategory({ name: name.trim(), description, basePrice, imageUrl });
    await service.save();

    res.json({ success: true, message: 'Service created successfully', service });
  } catch (error) {
    console.error('Error creating service:', error);
    res.json({ success: false, message: error.message });
  }
};

const getServiceById = async (req, res) => {
  try {
    const service = await ServiceCategory.findById(req.params.id);
    if (!service) return res.json({ success: false, message: 'Service not found' });
    res.json({ success: true, service });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.json({ success: false, message: error.message });
  }
};

const updateService = async (req, res) => {
  try {
    const { name, description, basePrice } = req.body;
    const serviceId = req.params.id;

    const updateData = { name, description, basePrice };

    // ✅ Upload buffer to Cloudinary if new image provided
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'services');
      updateData.imageUrl = uploadResult.secure_url;
    }

    const updatedService = await ServiceCategory.findByIdAndUpdate(
      serviceId, updateData, { new: true }
    );

    if (!updatedService) return res.json({ success: false, message: 'Service not found' });

    res.json({ success: true, message: 'Service updated successfully', service: updatedService });
  } catch (error) {
    console.error('Error updating service:', error);
    res.json({ success: false, message: error.message });
  }
};

const deleteService = async (req, res) => {
  try {
    const service = await ServiceCategory.findById(req.params.id);
    if (!service) return res.json({ success: false, message: 'Service not found' });

    await ServiceCategory.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.json({ success: false, message: error.message });
  }
};

export { getAllServices, createService, getServiceById, updateService, deleteService };