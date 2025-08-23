const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const { signAccessToken } = require("../utils/jwt");

const buildUserResponse = (user) => ({
  id: user._id,
  username: user.username,
  name: user.name,
  surname: user.surname,
  email: user.email,
});

const signup = async (req, res, next) => {
  try {
    const { username, name, surname, email, password } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ success: false, error: { code: "DUPLICATE", message: "Email already exists" } });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ success: false, error: { code: "DUPLICATE", message: "Username already exists" } });
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await User.create({ username, name, surname, email, passwordHash });

    const token = signAccessToken({ userId: user._id.toString(), email: user.email });

    return res.status(201).json({ success: true, data: { user: buildUserResponse(user), token } });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } });
    }

    const token = signAccessToken({ userId: user._id.toString(), email: user.email });
    return res.status(200).json({ success: true, data: { user: buildUserResponse(user), token } });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login }; 