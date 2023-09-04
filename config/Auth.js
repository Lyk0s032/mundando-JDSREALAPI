module.exports = {
    secret: process.env.AUTH_SECRET || "WithGod",
    expires: process.env.AUTH_EXPIRES || "1h",
    rounds: process.env.AUTH_ROUNDS || 10
}