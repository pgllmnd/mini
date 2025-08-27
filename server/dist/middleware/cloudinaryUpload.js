"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
// Configuration de Cloudinary
cloudinary_1.default.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadToCloudinary = (buffer_1, ...args_1) => __awaiter(void 0, [buffer_1, ...args_1], void 0, function* (buffer, folder = 'avatars') {
    try {
        // Conversion du buffer en base64
        const base64Image = buffer.toString('base64');
        const dataURI = `data:image/jpeg;base64,${base64Image}`;
        // Upload vers Cloudinary
        const result = yield cloudinary_1.default.uploader.upload(dataURI, {
            folder,
            resource_type: 'auto',
            transformation: [
                { width: 250, height: 250, crop: 'fill' },
                { quality: 'auto' }
            ]
        });
        return result.secure_url;
    }
    catch (error) {
        console.error('Erreur lors de l\'upload vers Cloudinary:', error);
        throw error;
    }
});
exports.uploadToCloudinary = uploadToCloudinary;
const deleteFromCloudinary = (publicUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!publicUrl)
            return;
        // Extract public ID from Cloudinary URL
        const publicId = publicUrl.split('/').slice(-1)[0].split('.')[0];
        if (publicId) {
            yield cloudinary_1.default.uploader.destroy(`avatars/${publicId}`);
        }
    }
    catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
    }
});
exports.deleteFromCloudinary = deleteFromCloudinary;
