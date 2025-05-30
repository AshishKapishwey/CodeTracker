const mongoose=require('mongoose');
const { use } = require('../../../Desktop/carRental/src/routes');

mongoose.connect('mongodb://localhost:27017/demoLogin', { useNewUrlParser: true, useUnifiedTopology: true })  

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique: true
    },
    email:{
        type:String,
        required:true,
        unique: true
    },
    password:{
        type:String,
        required:true
    }

});



module.exports = mongoose.model('User', userSchema);