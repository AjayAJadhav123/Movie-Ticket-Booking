const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://aj386092_db_user:Ajay_1234@ac-fdeds21-shard-00-00.0yuyxmp.mongodb.net:27017,ac-fdeds21-shard-00-01.0yuyxmp.mongodb.net:27017,ac-fdeds21-shard-00-02.0yuyxmp.mongodb.net:27017/quickshow?ssl=true&replicaSet=atlas-fbnmnw-shard-0&authSource=admin&retryWrites=true&w=majority';

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const TARGET_IDS = ['user_3HxvplFV33psRj5hNMuoHOb7uNE', 'user_3IHaixhMTi1Vs0cdXAGjZDDEiDm'];
    
    for (const clerkId of TARGET_IDS) {
      console.log(`\n--- Inspecting ${clerkId} ---`);
      let user = await User.findOne({ clerkId });
      
      if (!user) {
        console.log(`User ${clerkId} not found.`);
        continue;
      }
      
      console.log('BEFORE:');
      console.log(JSON.stringify({ clerkId: user.clerkId, isAdmin: user.get('isAdmin') }, null, 2));
      
      await User.updateOne({ clerkId }, { $set: { isAdmin: true } });
      
      user = await User.findOne({ clerkId });
      console.log('AFTER:');
      console.log(JSON.stringify({ clerkId: user.clerkId, isAdmin: user.get('isAdmin') }, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
