const mongoose = require('mongoose');
const { Schema } = mongoose;
const { RequiredString } = require('../util/mongoose-helpers');

const schema = new Schema ({
    name: RequiredString,
    albums:[{
        type: Schema.Types.ObjectId,
        ref:'Album',
    }],
    genre: {
        ...RequiredString,
        enum: ['Pop', 'Rock', 'Alternative', 'Blues', 'Indie', 'Musical', 'Classical', 'Electronic', 'Christian', 'Jazz', 'Vocal', 'Country', 'Dance', 'Hip-Hop', 'Rap', 'R&B/Soul', 'Folk', 'Soundtrack', 'Instrumental', 'World', 'Latin', 'Reggae']
    }
});

schema.statics = {
    getDetailById(id) {
        return Promise.all([
            this.findById(id)
                .populate({
                    path: 'albums',
                    select: 'title length'
                })
                .lean()
        ])
            .then(([artist]) => {
                if(!artist) return null;
                return artist;
            });
    },

    findByQuery(query) {
        return this.find(query)
            .populate({
                path: 'albums',
                select: 'title length'
            })
            .lean()
            .select('name albums genre');
    },

    removeById(id) {
        return this.findOneAndRemove({
            _id: id
        });
    },
    topGenres() {
        return this.aggregate([
            { $group : { _id : '$genre', Total : { $sum : 1 } } },
            { $sort : { Total : -1 } }
        ]);
    },
    byAlph() {
        return this.aggregate([
            { $group: { _id: '$_id', Name: { $first: '$name' }, Genre: { $first: '$genre' } } },
            { $sort: { Name: 1 } }
        ]);
    }
};

module.exports = mongoose.model('Artist', schema); 