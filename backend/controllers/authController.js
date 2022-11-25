const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const User = require("../models/userModel")
let refreshTokens = []
const authController = {
	generateAccessToken: (user) => {
		return jwt.sign(
			{
				id: user.id,
				isAdmin: user.isAdmin
			},
			process.env.JWT_ACCESS_KEY,
			{ expiresIn: "90s" }
		)
	},

	generateRefreshToken: (user) => {
		return jwt.sign(
			{
				id: user.id,
				isAdmin: user.isAdmin
			},
			process.env.JWT_REFRESH_KEY,
			{ expiresIn: "365d" }
		)
	},

	registerUser: async (req, res) => {
		try {
			const salt = await bcrypt.genSalt(10)
			const hashedPassword = await bcrypt.hash(req.body.password, salt)

			//Create a new user
			const newUser = await new User({
				username: req.body.username,
				email: req.body.email,
				password: hashedPassword
			})

			//Save user
			const user = await newUser.save()
			res.status(200).json(user)
		} catch (error) {
			res.status(500).json(error)
		}
	},

	loginUser: async (req, res) => {
		try {
			const user = await User.findOne({ username: req.body.username })
			if (!user) {
				res.status(400).json("Tên người dùng không hợp lệ!")
			}
			const validPassword = await bcrypt.compare(req.body.password, user.password)
			if (!validPassword) {
				res.status(404).json("Password không hợp lệ!")
			}
			if (user && validPassword) {
				const accessToken = authController.generateAccessToken(user)
				const refreshToken = authController.generateRefreshToken(user)
				await User.findByIdAndUpdate(user.id, { verifyRefreshToken: refreshToken })
				//STORE REFRESH TOKEN IN 
				res.cookie("refreshToken", refreshToken, {
					httpOnly: true,
					secure: false,
					path: "/",
					sameSite: "strict"
				})
				const { password, ...others } = user._doc
				res.status(200).json({ ...others, accessToken, refreshToken })
			}
		} catch (error) {
			res.status(500).json(error)
		}
	},

	requestRefreshToken: async (req, res) => {
		const refreshToken = req.cookies.refreshToken
		if (!refreshToken) return res.status(401).json("Bạn chưa được xác thực")
		if (!refreshTokens.includes(refreshToken)) {
			return res.status(403).json("Refresh token không hợp lệ")
		}
		jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (err, user) => {
			if (err) {
				console.log(err)
			}
			refreshTokens = refreshTokens.filter((token) => token !== refreshToken)
			// Create new access token, refresh token and send to user
			const newAccessToken = authController.generateAccessToken(user)
			const newRefreshToken = authController.generateRefreshToken(user)
			refreshTokens.push(newRefreshToken)
			res.cookie("refreshToken", refreshToken, {
				httpOnly: true,
				secure: false,
				path: "/",
				sameSite: "strict"
			})
			res.status(200).json({
				accessToken: newAccessToken,
				refreshToken: newRefreshToken
			})
		})
	},

	logoutUser: async (req, res) => {
		//Clear cookies when user logs out
		refreshTokens = refreshTokens.filter((token) => token !== req.body.token)
		res.clearCookie("refreshToken")
		res.status(200).json("Logout successfully!")
	}
}
module.exports = authController
