const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/demoLogin', { useNewUrlParser: true, useUnifiedTopology: true });

const profileIdsSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    platform: {
        type: String,
    },
    profileId: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('ProfileIds', profileIdsSchema);
