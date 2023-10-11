const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DownloadSchema = new Schema({
    url: {
        type: String,
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
});

module.exports = mongoose.model('Download', DownloadSchema);