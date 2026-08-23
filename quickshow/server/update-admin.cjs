const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://aj386092_db_user:Ajay_1234@ac-fdeds21-shard-00-00.0yuyxmp.mongodb.net:27017,ac-fdeds21-shard-00-01.0yuyxmp.mongodb.net:27017,ac-fdeds21-shard-00-02.0yuyxmp.mongodb.net:27017/quickshow?ssl=true&replicaSet=atlas-fbnmnw-shard-0&authSource=admin&retryWrites=true&w=majority';
const CLERK_ID = 'user_3HxvplFV33psRj5hNMuoHOb7uNE';

// Minimal schema to just update the field
const userSchema = new mongoose.Schema({
  clerkId: String,
  name: String,
  email: String,
  isAdmin: { type: Boolean, default: false }
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ clerkId: CLERK_ID });
    if (!user) {
      console.log('User not found!');
      process.exit(1);
    }

    console.log('\n--- BEFORE UPDATE ---');
    console.log(JSON.stringify({
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin
    }, null, 2));

    user.isAdmin = true;
    await user.save();

    console.log('\n--- AFTER UPDATE ---');
    console.log(JSON.stringify({
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin
    }, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
