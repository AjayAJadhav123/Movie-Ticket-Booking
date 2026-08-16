import { Webhook } from 'svix';
import User from '../models/User.js';

export const handleClerkWebhook = async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET || WEBHOOK_SECRET.startsWith('whsec_')) {
    // In development without a properly configured webhook secret, 
    // just acknowledge the webhook
    if (!WEBHOOK_SECRET) {
      console.warn('⚠️ Webhook secret not configured');
      return res.status(200).json({
        success: true,
        message: 'Webhook secret not configured (dev mode)',
      });
    }
  }

  const payload = req.body;
  const headers = req.headers;

  let wh;
  try {
    wh = new Webhook(WEBHOOK_SECRET);
  } catch (err) {
    console.warn('⚠️ Invalid webhook secret format:', err.message);
    return res.status(200).json({
      success: true,
      message: 'Webhook secret invalid (dev mode)',
    });
  }

  let evt;

  try {
    evt = wh.verify(payload, headers);
  } catch (err) {
    console.error('Webhook verification failed:', err.message);
    return res.status(400).json({
      success: false,
      message: 'Webhook verification failed',
    });
  }

  try {
    if (evt.type === 'user.created') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;

      const newUser = new User({
        clerkId: id,
        name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
        email: email_addresses[0]?.email_address || '',
        image: image_url || null,
      });

      await newUser.save();
      console.log(`✅ User created: ${id}`);
    } else if (evt.type === 'user.updated') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;

      await User.updateOne(
        { clerkId: id },
        {
          $set: {
            name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
            email: email_addresses[0]?.email_address || '',
            image: image_url || null,
          },
        }
      );
      console.log(`✅ User updated: ${id}`);
    } else if (evt.type === 'user.deleted') {
      const { id } = evt.data;
      await User.deleteOne({ clerkId: id });
      console.log(`✅ User deleted: ${id}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing webhook',
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user',
    });
  }
};

export const addFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const { movieId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!movieId) {
      return res.status(400).json({
        success: false,
        message: 'Movie ID is required',
      });
    }

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.favorites.includes(movieId)) {
      user.favorites.push(movieId);
      await user.save();
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return res.status(500).json({
      success: false,
      message: 'Error adding favorite',
    });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const { movieId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!movieId) {
      return res.status(400).json({
        success: false,
        message: 'Movie ID is required',
      });
    }

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.favorites = user.favorites.filter((id) => id.toString() !== movieId);
    await user.save();

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return res.status(500).json({
      success: false,
      message: 'Error removing favorite',
    });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const user = await User.findOne({ clerkId: userId }).populate('favorites');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: user.favorites || [],
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching favorites',
    });
  }
};
