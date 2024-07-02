const mongoose =require('mongoose');

const connectDB =async()=>{
    try{
        const con= await mongoose.connect("mongodb+srv://itsmeakhilarappura:arappura123@brodway.4hu74i6.mongodb.net/brodway?retryWrites=true&w=majority",{ 
        })
        console.log(`MongoDB connected: ${con.connection.host}`);
    }catch(err){
          console.log(err);
          process.exit(1);
    }
} 

module.exports =connectDB