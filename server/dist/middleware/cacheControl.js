"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCacheControl = void 0;
const CACHE_DURATION = {
    assets: 60 * 60 * 24 * 7, // 7 days for static assets
    images: 60 * 60 * 24 * 30, // 30 days for images
};
const setCacheControl = (req, res, next) => {
    // Check if the request is for a static asset
    const isAsset = req.path.match(/\.(js|css|json)$/);
    const isImage = req.path.match(/\.(jpg|jpeg|png|gif|svg|webp)$/);
    if (isAsset || isImage) {
        const maxAge = isImage ? CACHE_DURATION.images : CACHE_DURATION.assets;
        res.set({
            'Cache-Control': `public, max-age=${maxAge}`,
            'Expires': new Date(Date.now() + maxAge * 1000).toUTCString()
        });
    }
    else {
        // For API routes and other dynamic content
        res.set('Cache-Control', 'no-cache');
    }
    next();
};
exports.setCacheControl = setCacheControl;
